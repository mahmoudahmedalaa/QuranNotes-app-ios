/**
 * AudioPlayerService — Verse playback via react-native-track-player
 *
 * Supports TWO playback modes:
 * 1. Full-surah (gapless): Single MP3 + progress polling + timestamp-based verse detection
 * 2. Per-verse (fallback): Individual MP3 queue from everyayah.com
 *
 * Uses the native OS audio queue (AVQueuePlayer on iOS, ExoPlayer on Android)
 * for lock screen / Dynamic Island controls.
 *
 * NOTE: Recording functionality stays on expo-av (AudioRecorderService.ts).
 */
import TrackPlayer, {
    Capability,
    State,
    Event,
    AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { AppState, type NativeEventSubscription } from 'react-native';
import { VerseTimestamp, findVerseAtPosition } from './QuranAudioApi';

export type PlaybackStatus = {
    isPlaying: boolean;
    isBuffering: boolean;
    positionMillis: number;
    durationMillis: number;
    didJustFinish: boolean;
    /** Track index that just became active (per-verse mode only) */
    activeTrackIndex?: number;
    /** Current verse key from timestamp polling (full-surah mode only) */
    currentVerseKey?: string;
};

export class AudioPlayerService {
    private listeners: ((status: PlaybackStatus) => void)[] = [];
    private isSetup = false;
    private setupPromise: Promise<void> | null = null;
    /** Debounce timer for PlaybackState — suppresses transient Loading/Buffering flicker */
    private playbackStateTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Full-surah mode state ──
    private progressTimer: ReturnType<typeof setInterval> | null = null;
    private currentTimestamps: VerseTimestamp[] | null = null;
    private lastEmittedVerseKey: string | null = null;
    private isFullSurahMode = false;
    private appStateSubscription: NativeEventSubscription | null = null;

    /** Build CDN URL for a verse */
    private buildUrl(surah: number, verse: number, cdnFolder: string): string {
        const s = surah.toString().padStart(3, '0');
        const v = verse.toString().padStart(3, '0');
        return `https://everyayah.com/data/${cdnFolder}/${s}${v}.mp3`;
    }

    /** Initialize the track player (idempotent — safe to call multiple times) */
    async setup(): Promise<void> {
        if (this.isSetup) return;
        if (this.setupPromise) return this.setupPromise;

        this.setupPromise = (async () => {
            try {
                await TrackPlayer.setupPlayer({
                    // Buffer ahead for gapless transitions
                    minBuffer: 30,
                    maxBuffer: 60,
                    backBuffer: 10,
                    // Start playback as soon as 0.5s is buffered — reduces inter-track gap
                    playBuffer: 0.5,
                });

                await TrackPlayer.updateOptions({
                    capabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious,
                        Capability.SeekTo,
                        Capability.Stop,
                    ],
                    compactCapabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                    ],
                    android: {
                        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
                    },
                });

                // Subscribe to native events and forward to our listeners
                this.subscribeToEvents();
                this.isSetup = true;
            } catch (e) {
                if (__DEV__) console.warn('[AudioPlayer] Setup failed:', e);
                // Player may already be set up (hot reload). Try to continue.
                this.isSetup = true;
                this.subscribeToEvents();
            }
        })();

        return this.setupPromise;
    }

    /** Subscribe to RNTP native events and translate to our PlaybackStatus */
    private subscribeToEvents() {
        // Track changed — fires when the player moves to a new track in the queue
        // Only relevant for per-verse mode (queue of tracks)
        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
            if (!this.isFullSurahMode && event.index !== undefined && event.index !== null) {
                this.notifyListeners({
                    isPlaying: true,
                    isBuffering: false,
                    positionMillis: 0,
                    durationMillis: 0,
                    didJustFinish: false,
                    activeTrackIndex: event.index,
                });
            }
        });

        // Playback state changed (playing, paused, buffering, etc.)
        // Debounced: during track transitions RNTP fires rapid
        // Playing → Loading → Buffering → Playing. We suppress the
        // intermediate non-playing states to prevent UI flicker.
        TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
            const state = event.state;
            const isPlaying = state === State.Playing;
            const isBuffering = state === State.Buffering || state === State.Loading;

            // Manage progress polling based on play state
            if (this.isFullSurahMode) {
                if (isPlaying) {
                    this.startProgressPolling();
                } else if (!isBuffering) {
                    this.stopProgressPolling();
                }
            }

            // If transitioning TO playing, fire immediately (cancel any pending "paused" notification)
            if (isPlaying) {
                if (this.playbackStateTimer) {
                    clearTimeout(this.playbackStateTimer);
                    this.playbackStateTimer = null;
                }
                try {
                    const progress = await TrackPlayer.getProgress();
                    this.notifyListeners({
                        isPlaying: true,
                        isBuffering: false,
                        positionMillis: Math.round((progress.position || 0) * 1000),
                        durationMillis: Math.round((progress.duration || 0) * 1000),
                        didJustFinish: false,
                    });
                } catch {
                    this.notifyListeners({
                        isPlaying: true,
                        isBuffering: false,
                        positionMillis: 0,
                        durationMillis: 0,
                        didJustFinish: false,
                    });
                }
                return;
            }

            // For non-playing states (Loading, Buffering, Paused, Stopped),
            // delay notification by 250ms so transient track-change states are swallowed
            if (this.playbackStateTimer) {
                clearTimeout(this.playbackStateTimer);
            }
            this.playbackStateTimer = setTimeout(async () => {
                this.playbackStateTimer = null;
                try {
                    const progress = await TrackPlayer.getProgress();
                    this.notifyListeners({
                        isPlaying: false,
                        isBuffering,
                        positionMillis: Math.round((progress.position || 0) * 1000),
                        durationMillis: Math.round((progress.duration || 0) * 1000),
                        didJustFinish: false,
                    });
                } catch {
                    this.notifyListeners({
                        isPlaying: false,
                        isBuffering,
                        positionMillis: 0,
                        durationMillis: 0,
                        didJustFinish: false,
                    });
                }
            }, 250);
        });

        // Queue ended — all tracks finished playing
        TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
            this.stopProgressPolling();
            this.notifyListeners({
                isPlaying: false,
                isBuffering: false,
                positionMillis: 0,
                durationMillis: 0,
                didJustFinish: true,
            });
        });

        // Playback error
        TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
            if (__DEV__) console.error('[AudioPlayer] Playback error:', event.message);
        });

        // ── Lock screen skip overrides for full-surah mode ──
        TrackPlayer.addEventListener(Event.RemoteNext, async () => {
            if (this.isFullSurahMode && this.currentTimestamps) {
                await this.skipToNextVerse();
            } else {
                try { await TrackPlayer.skipToNext(); } catch { /* no next track */ }
            }
        });

        TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
            if (this.isFullSurahMode && this.currentTimestamps) {
                await this.skipToPreviousVerse();
            } else {
                try { await TrackPlayer.skipToPrevious(); } catch { /* no prev track */ }
            }
        });

        // Seek event — update verse key after user seeks on lock screen
        TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
            if (this.isFullSurahMode && this.currentTimestamps) {
                await TrackPlayer.seekTo(event.position);
                const positionMs = event.position * 1000;
                const idx = findVerseAtPosition(this.currentTimestamps, positionMs);
                if (idx >= 0) {
                    const verseKey = this.currentTimestamps[idx].verseKey;
                    if (verseKey !== this.lastEmittedVerseKey) {
                        this.lastEmittedVerseKey = verseKey;
                        this.notifyListeners({
                            isPlaying: true,
                            isBuffering: false,
                            positionMillis: Math.round(positionMs),
                            durationMillis: 0,
                            didJustFinish: false,
                            currentVerseKey: verseKey,
                        });
                    }
                }
            }
        });
    }

    // ── Progress polling for full-surah mode ──

    private startProgressPolling() {
        if (this.progressTimer) return; // already running
        this.progressTimer = setInterval(async () => {
            if (!this.currentTimestamps) return;
            try {
                const progress = await TrackPlayer.getProgress();
                const positionMs = progress.position * 1000;
                const idx = findVerseAtPosition(this.currentTimestamps, positionMs);
                if (idx >= 0) {
                    const verseKey = this.currentTimestamps[idx].verseKey;
                    if (verseKey !== this.lastEmittedVerseKey) {
                        this.lastEmittedVerseKey = verseKey;
                        this.notifyListeners({
                            isPlaying: true,
                            isBuffering: false,
                            positionMillis: Math.round(positionMs),
                            durationMillis: Math.round((progress.duration || 0) * 1000),
                            didJustFinish: false,
                            currentVerseKey: verseKey,
                        });
                    }
                }
            } catch {
                // Player may be in transition — ignore
            }
        }, 200);

        // Pause polling when app goes to background, resume on foreground
        if (!this.appStateSubscription) {
            this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
                if (nextState === 'active' && this.isFullSurahMode) {
                    // Catch up: do an immediate poll
                    this.pollProgressOnce();
                }
            });
        }
    }

    private stopProgressPolling() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    }

    /** Single immediate poll — used for foreground catch-up */
    private async pollProgressOnce() {
        if (!this.currentTimestamps) return;
        try {
            const progress = await TrackPlayer.getProgress();
            const positionMs = progress.position * 1000;
            const idx = findVerseAtPosition(this.currentTimestamps, positionMs);
            if (idx >= 0) {
                const verseKey = this.currentTimestamps[idx].verseKey;
                if (verseKey !== this.lastEmittedVerseKey) {
                    this.lastEmittedVerseKey = verseKey;
                    this.notifyListeners({
                        isPlaying: true,
                        isBuffering: false,
                        positionMillis: Math.round(positionMs),
                        durationMillis: Math.round((progress.duration || 0) * 1000),
                        didJustFinish: false,
                        currentVerseKey: verseKey,
                    });
                }
            }
        } catch { /* ignore */ }
    }

    // ── Skip controls for full-surah mode ──

    private async skipToNextVerse() {
        if (!this.currentTimestamps || !this.lastEmittedVerseKey) return;
        const currentIdx = this.currentTimestamps.findIndex(t => t.verseKey === this.lastEmittedVerseKey);
        if (currentIdx >= 0 && currentIdx < this.currentTimestamps.length - 1) {
            const nextTs = this.currentTimestamps[currentIdx + 1];
            await TrackPlayer.seekTo(nextTs.timestampFrom / 1000);
            this.lastEmittedVerseKey = nextTs.verseKey;
            this.notifyListeners({
                isPlaying: true,
                isBuffering: false,
                positionMillis: nextTs.timestampFrom,
                durationMillis: 0,
                didJustFinish: false,
                currentVerseKey: nextTs.verseKey,
            });
        }
    }

    private async skipToPreviousVerse() {
        if (!this.currentTimestamps || !this.lastEmittedVerseKey) return;
        const currentIdx = this.currentTimestamps.findIndex(t => t.verseKey === this.lastEmittedVerseKey);
        if (currentIdx < 0) return;

        try {
            const progress = await TrackPlayer.getProgress();
            const positionMs = progress.position * 1000;
            const currentTs = this.currentTimestamps[currentIdx];

            // If > 3s into current verse, restart current. Otherwise go to previous.
            if (positionMs - currentTs.timestampFrom > 3000) {
                await TrackPlayer.seekTo(currentTs.timestampFrom / 1000);
                // Keep same verseKey — it's a restart, not a change
            } else if (currentIdx > 0) {
                const prevTs = this.currentTimestamps[currentIdx - 1];
                await TrackPlayer.seekTo(prevTs.timestampFrom / 1000);
                this.lastEmittedVerseKey = prevTs.verseKey;
                this.notifyListeners({
                    isPlaying: true,
                    isBuffering: false,
                    positionMillis: prevTs.timestampFrom,
                    durationMillis: 0,
                    didJustFinish: false,
                    currentVerseKey: prevTs.verseKey,
                });
            } else {
                // Already at first verse — restart it
                await TrackPlayer.seekTo(currentTs.timestampFrom / 1000);
            }
        } catch {
            // Fallback: seek to beginning
            await TrackPlayer.seekTo(0);
        }
    }

    // ── Public API ──

    addListener(callback: (status: PlaybackStatus) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(status: PlaybackStatus) {
        this.listeners.forEach(l => l(status));
    }

    /**
     * Full-surah gapless playback — loads a single MP3 track with verse timestamps.
     * Progress polling detects verse transitions and emits currentVerseKey.
     */
    async loadFullSurah(
        surahNum: number,
        audioUrl: string,
        timestamps: VerseTimestamp[],
        reciterName: string,
        surahName: string,
        startVerseKey?: string,
    ): Promise<void> {
        await this.setup();

        // Clean up previous state
        this.stopProgressPolling();
        await TrackPlayer.reset();

        // Set full-surah mode
        this.isFullSurahMode = true;
        this.currentTimestamps = timestamps;
        this.lastEmittedVerseKey = null;

        // Calculate starting position (seconds)
        let startPosition = 0;
        if (startVerseKey) {
            const startTs = timestamps.find(t => t.verseKey === startVerseKey);
            if (startTs) {
                startPosition = startTs.timestampFrom / 1000;
                this.lastEmittedVerseKey = startVerseKey;
            }
        } else if (timestamps.length > 0) {
            this.lastEmittedVerseKey = timestamps[0].verseKey;
        }

        // Calculate total verse count for display
        const totalVerses = timestamps.length;
        const startVerseNum = startVerseKey
            ? parseInt(startVerseKey.split(':')[1]) || 1
            : 1;

        const track = {
            id: `surah-${surahNum}`,
            url: audioUrl,
            title: surahName,
            artist: `Verse ${startVerseNum}/${totalVerses} · ${reciterName}`,
            album: 'QuranNotes',
            artwork: require('../../../../assets/icon.png'),
        };

        await TrackPlayer.add(track);

        // Seek to starting verse position if needed
        if (startPosition > 0) {
            await TrackPlayer.seekTo(startPosition);
        }

        await TrackPlayer.play();
    }

    /**
     * Seek to a specific verse within the current full-surah track.
     * @param verseKey - e.g. "2:142"
     */
    async seekToVerse(verseKey: string): Promise<void> {
        if (!this.isFullSurahMode || !this.currentTimestamps) return;
        const ts = this.currentTimestamps.find(t => t.verseKey === verseKey);
        if (ts) {
            await TrackPlayer.seekTo(ts.timestampFrom / 1000);
            this.lastEmittedVerseKey = verseKey;
            this.notifyListeners({
                isPlaying: true,
                isBuffering: false,
                positionMillis: ts.timestampFrom,
                durationMillis: 0,
                didJustFinish: false,
                currentVerseKey: verseKey,
            });
        }
    }

    /** Update the lock screen now-playing info with current verse */
    async updateNowPlayingVerse(
        surahName: string,
        verseNum: number,
        totalVerses: number,
        reciterName: string,
    ): Promise<void> {
        if (!this.isFullSurahMode) return;
        try {
            await TrackPlayer.updateNowPlayingMetadata({
                title: surahName,
                artist: `Verse ${verseNum}/${totalVerses} · ${reciterName}`,
            });
        } catch {
            // updateNowPlayingMetadata may not be available on all versions
        }
    }

    /** Check if currently in full-surah mode */
    getIsFullSurahMode(): boolean {
        return this.isFullSurahMode;
    }

    /** Get current timestamps (for use by AudioContext) */
    getCurrentTimestamps(): VerseTimestamp[] | null {
        return this.currentTimestamps;
    }

    /**
     * Load a full surah as a queue and start playing from a specific verse.
     * Each verse becomes a track with metadata for lock screen display.
     * (Per-verse fallback mode — used when reciter has no Quran.com ID)
     */
    async loadPlaylist(
        surahNum: number,
        verses: { number: number }[],
        startIndex: number,
        cdnFolder: string,
        reciterName: string,
        surahName: string,
    ): Promise<void> {
        await this.setup();

        // Clean up full-surah state if switching mode
        this.stopProgressPolling();
        this.isFullSurahMode = false;
        this.currentTimestamps = null;
        this.lastEmittedVerseKey = null;

        // Reset current queue
        await TrackPlayer.reset();

        // Build tracks for the entire surah
        const tracks = verses.map((verse, idx) => ({
            id: `${surahNum}:${verse.number}`,
            url: this.buildUrl(surahNum, verse.number, cdnFolder),
            title: `Surah ${surahName} (${idx + 1}/${verses.length})`,
            artist: `Verse ${verse.number} · ${reciterName}`,
            album: 'QuranNotes',
            // Use app icon as artwork for Now Playing
            artwork: require('../../../../assets/icon.png'),
        }));

        await TrackPlayer.add(tracks);

        // Skip to the starting verse and play
        if (startIndex > 0) {
            await TrackPlayer.skip(startIndex);
        }
        await TrackPlayer.play();
    }

    /**
     * Play a single verse (used when no surah context is available).
     * For full surah playback, prefer loadFullSurah() or loadPlaylist().
     */
    async playVerse(
        surah: number,
        verse: number,
        cdnFolder: string,
        reciterName: string = 'Reciter',
        surahName: string = 'Quran',
    ): Promise<void> {
        await this.setup();

        // Clean up full-surah state
        this.stopProgressPolling();
        this.isFullSurahMode = false;
        this.currentTimestamps = null;
        this.lastEmittedVerseKey = null;

        await TrackPlayer.reset();

        const track = {
            id: `${surah}:${verse}`,
            url: this.buildUrl(surah, verse, cdnFolder),
            title: `${surahName} — Verse ${verse}`,
            artist: reciterName,
            album: 'QuranNotes',
            artwork: require('../../../../assets/icon.png'),
        };

        await TrackPlayer.add(track);
        await TrackPlayer.play();
    }

    /** Preload is a no-op — RNTP handles buffering natively via the queue */
    async preloadVerse(): Promise<void> {
        // No-op: RNTP auto-buffers the next track in the queue
    }

    async pause(): Promise<void> {
        await TrackPlayer.pause();
    }

    async resume(): Promise<void> {
        await TrackPlayer.play();
    }

    async stop(): Promise<void> {
        this.stopProgressPolling();
        this.isFullSurahMode = false;
        this.currentTimestamps = null;
        this.lastEmittedVerseKey = null;
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
        await TrackPlayer.reset();
        this.notifyListeners({
            isPlaying: false,
            isBuffering: false,
            positionMillis: 0,
            durationMillis: 0,
            didJustFinish: false,
        });
    }

    /** Get current active track index in the queue */
    async getActiveTrackIndex(): Promise<number | undefined> {
        try {
            return await TrackPlayer.getActiveTrackIndex();
        } catch {
            return undefined;
        }
    }

    /** Skip to a specific track in the queue by index (per-verse mode) */
    async skipToTrack(index: number): Promise<void> {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }
}

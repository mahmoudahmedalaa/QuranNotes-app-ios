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
import { Paths, File, Directory } from 'expo-file-system';
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

    // ── Per-verse queue tracking ──
    // Tracks the expected queue length synchronously to avoid async getQueue() race conditions.
    // Set in loadPlaylist(), reset in loadFullSurah()/playVerse().
    private perVerseQueueSize = 0;

    // ══════════════════════════════════════════════════════════════════════
    //  PRE-DOWNLOAD CACHE — Gapless per-verse transitions
    // ══════════════════════════════════════════════════════════════════════
    //
    //  WHY THIS EXISTS:
    //  RNTP queues remote URLs, but iOS's AVQueuePlayer has a 400-1000ms
    //  gap when transitioning between remote tracks because it doesn't
    //  aggressively pre-buffer the NEXT track's network data.
    //
    //  HOW IT WORKS:
    //  When track N starts playing, we pre-download tracks N+1 and N+2
    //  to the device's cache directory. We then update the RNTP queue
    //  to use file:// URLs for those tracks. File URLs have ZERO network
    //  latency → transitions are instant.
    //
    //  IMPORTANT: This cache is ephemeral — cleared when playback stops
    //  or the surah changes. It is NOT meant for persistent offline storage.
    //
    //  This replaces the expo-av preloading mechanism from commit cffd9fc9d
    //  that was lost during the RNTP migration.
    // ══════════════════════════════════════════════════════════════════════
    /** Cache directory for pre-downloaded verse MP3s (new expo-file-system v18+ API) */
    private cacheDir: Directory | null = null;

    /** Lazily get or create the cache directory */
    private getCacheDir(): Directory {
        if (!this.cacheDir) {
            this.cacheDir = new Directory(Paths.cache, 'audio-cache');
        }
        if (!this.cacheDir.exists) {
            this.cacheDir.create();
        }
        return this.cacheDir;
    }
    /** Set of track IDs currently being pre-downloaded (prevents duplicate downloads) */
    private activeDownloads = new Set<string>();
    /** Map of track ID → cached file:// path (for already-downloaded files) */
    private cachedPaths = new Map<string, string>();
    /** Metadata for the current per-verse queue (surah, cdnFolder) for pre-download */
    private currentQueueMeta: {
        surahNum: number;
        verses: { number: number }[];
        cdnFolder: string;
    } | null = null;

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

    /**
     * ══════════════════════════════════════════════════════════════════════
     * CRITICAL: Event Handler Architecture for Per-Verse vs Full-Surah Mode
     * ══════════════════════════════════════════════════════════════════════
     *
     * ⚠️  DO NOT MODIFY WITHOUT READING THIS SECTION IN FULL  ⚠️
     *
     * Root Cause (March 2026 regression):
     * ------------------------------------
     * After `npx expo prebuild --clean`, the native RNTP (react-native-track-player)
     * binary exhibited different timing behavior. Specifically, Event.PlaybackQueueEnded
     * began firing BETWEEN tracks in per-verse mode (not just at the true end of the queue).
     * This caused AudioContext.tsx's `didJustFinish` handler to clear ALL playback state
     * after each verse, making the player stop after every verse.
     *
     * The audio JS code was byte-for-byte IDENTICAL to the working state — the regression
     * was caused entirely by native timing changes after the native rebuild.
     *
     * Architecture Decision:
     * ----------------------
     * 1. PlaybackActiveTrackChanged is the PRIMARY signal for per-verse mode:
     *    - When event.index is a number → normal track change, update verse
     *    - When event.index is undefined/null → queue truly exhausted → didJustFinish
     *    This event fires SYNCHRONOUSLY during track transitions and is RELIABLE.
     *
     * 2. PlaybackQueueEnded is ONLY used in full-surah mode (single track):
     *    - In per-verse mode it is COMPLETELY IGNORED because it has known
     *      race conditions in RNTP v4 on iOS where it fires between tracks.
     *    - In full-surah mode it's always valid (only one track in queue).
     *
     * 3. PlaybackState is ONLY for UI updates (play/pause/buffer status):
     *    - Uses 500ms debounce to absorb transient states during track transitions
     *    - NEVER sets didJustFinish (that's handled by #1 and #2 above)
     *    - NEVER takes destructive action (no auto-resume, no state clearing)
     *
     * 4. perVerseQueueSize tracks the expected queue length synchronously:
     *    - Set in loadPlaylist() when the queue is constructed
     *    - Used in event handlers to avoid async getQueue() race conditions
     *
     * If you need to change this logic, first read the systematic debugging
     * investigation in the conversation logs and walkthrough for March 2026.
     * ══════════════════════════════════════════════════════════════════════
     */
    private subscribeToEvents() {
        /**
         * ── EVENT 1: PlaybackActiveTrackChanged ──
         *
         * Per-Verse Mode: This is the AUTHORITATIVE signal for:
         *   a) Verse transitions: event.index = new track number
         *   b) Queue completion: event.index = undefined (no more tracks)
         *
         * Full-Surah Mode: Ignored (only one track, verse detection uses polling)
         *
         * WHY THIS IS RELIABLE: Unlike PlaybackQueueEnded, this event fires
         * synchronously with the native player's track change and includes
         * the exact index. There are no known race conditions.
         */
        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
            if (this.isFullSurahMode) return; // Full-surah = single track, skip

            // ── Normal track advance: new verse started ──
            if (event.index !== undefined && event.index !== null) {
                this.notifyListeners({
                    isPlaying: true,
                    isBuffering: false,
                    positionMillis: 0,
                    durationMillis: 0,
                    didJustFinish: false,
                    activeTrackIndex: event.index,
                });

                // ── PRE-DOWNLOAD: Cache next verses for gapless transitions ──
                // Fire-and-forget: don't await, don't block the event handler.
                // Downloads the next 2 verses to disk and updates their RNTP URLs.
                this.preDownloadAhead(event.index).catch(() => { /* best effort */ });

                return;
            }

            // ── Queue exhausted: event.index is undefined/null ──
            // This means RNTP has no more tracks to play.
            // Verify using our synchronously-tracked queue size to prevent false positives.
            if (event.lastIndex !== undefined && event.lastIndex !== null) {
                const wasLastTrack = event.lastIndex >= this.perVerseQueueSize - 1;
                if (wasLastTrack) {
                    // ✅ Genuinely finished the entire queue
                    this.notifyListeners({
                        isPlaying: false,
                        isBuffering: false,
                        positionMillis: 0,
                        durationMillis: 0,
                        didJustFinish: true,
                    });
                    return;
                }
            }
            // If we get here with index=undefined but lastIndex didn't match the end,
            // this is an anomalous event — do NOT mark as finished.
        });

        /**
         * ── EVENT 2: PlaybackState (Debounced) ──
         *
         * Reports play/pause/buffer state to the UI.
         *
         * DESIGN RULE: This handler NEVER sets didJustFinish.
         * Completion detection is handled exclusively by:
         *   - PlaybackActiveTrackChanged (per-verse mode)
         *   - PlaybackQueueEnded (full-surah mode)
         *
         * DEBOUNCE (500ms): During track transitions, RNTP fires rapid
         * Playing → Loading → Buffering → Playing sequences. We suppress
         * non-playing states for 500ms so the UI doesn't flicker.
         * Playing states fire immediately (no debounce).
         */
        TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
            const state = event.state;
            const isPlaying = state === State.Playing;
            const isBuffering = state === State.Buffering || state === State.Loading;

            // ── Full-surah mode: manage progress polling ──
            if (this.isFullSurahMode) {
                if (isPlaying) {
                    this.startProgressPolling();
                } else if (!isBuffering) {
                    this.stopProgressPolling();
                }
            }

            // ── Playing state: fire immediately, cancel any pending pause notification ──
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

            // ── Non-playing states: debounce 500ms to absorb transient states ──
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
                        didJustFinish: false,  // NEVER set here — see architecture doc above
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
            }, 500);
        });

        /**
         * ── EVENT 3: PlaybackQueueEnded ──
         *
         * ⚠️  ONLY USED IN FULL-SURAH MODE  ⚠️
         *
         * In per-verse mode, this event is COMPLETELY IGNORED.
         * Reason: RNTP v4 on iOS has a known issue where this event fires
         * BETWEEN tracks in a queue (not just at the true end). When this
         * happens, it triggers didJustFinish which destroys the entire
         * playback session in AudioContext.tsx.
         *
         * Per-verse completion is handled by PlaybackActiveTrackChanged
         * (event.index === undefined), which is reliable.
         *
         * In full-surah mode, there's only ONE track in the queue, so
         * this event always means playback genuinely completed.
         *
         * DO NOT add per-verse handling here. It WILL break.
         * See March 2026 regression investigation for details.
         */
        TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
            // ── Full-surah mode: single track finished → mark as done ──
            if (this.isFullSurahMode) {
                this.stopProgressPolling();
                this.notifyListeners({
                    isPlaying: false,
                    isBuffering: false,
                    positionMillis: 0,
                    durationMillis: 0,
                    didJustFinish: true,
                });
                return;
            }

            // ── Per-verse mode: IGNORE this event entirely ──
            // Completion is handled by PlaybackActiveTrackChanged above.
            // This event is unreliable in per-verse mode (fires between tracks).
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
        this.perVerseQueueSize = 0;  // Not applicable in full-surah mode
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

        // Clean up full-surah state if switching to per-verse mode
        this.stopProgressPolling();
        this.isFullSurahMode = false;
        this.currentTimestamps = null;
        this.lastEmittedVerseKey = null;

        // Clean up any existing pre-download cache from previous playback
        await this.clearCache();

        // Reset current queue
        await TrackPlayer.reset();

        // ── Store queue metadata for pre-download system ──
        this.currentQueueMeta = { surahNum, verses: [...verses], cdnFolder };

        // ── Pre-download the first few verses for instant start ──
        // Download the starting verse + next 2 to cache before building the queue.
        // This ensures the first few transitions are gapless from the start.
        const preDownloadEnd = Math.min(startIndex + 3, verses.length);
        const preDownloadPromises: Promise<void>[] = [];
        for (let i = startIndex; i < preDownloadEnd; i++) {
            preDownloadPromises.push(this.downloadVerseToCache(
                `${surahNum}:${verses[i].number}`,
                this.buildUrl(surahNum, verses[i].number, cdnFolder),
            ));
        }
        // Wait for pre-downloads (with a timeout so we don't block forever)
        await Promise.race([
            Promise.allSettled(preDownloadPromises),
            new Promise(resolve => setTimeout(resolve, 4000)), // 4s max wait
        ]);

        // Build tracks for the entire surah — use cached file:// URLs where available
        const tracks = verses.map((verse, idx) => {
            const trackId = `${surahNum}:${verse.number}`;
            const cachedPath = this.cachedPaths.get(trackId);
            return {
                id: trackId,
                url: cachedPath || this.buildUrl(surahNum, verse.number, cdnFolder),
                title: `Surah ${surahName} (${idx + 1}/${verses.length})`,
                artist: `Verse ${verse.number} · ${reciterName}`,
                album: 'QuranNotes',
                artwork: require('../../../../assets/icon.png'),
            };
        });

        // ── Track queue size synchronously for event handlers ──
        // This avoids async getQueue() race conditions in PlaybackActiveTrackChanged.
        // See subscribeToEvents() architecture doc for details.
        this.perVerseQueueSize = tracks.length;

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
        this.perVerseQueueSize = 1;  // Single verse = queue of 1

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

    /**
     * Pre-download a verse MP3 to the cache directory.
     * Called by preDownloadAhead() — not used directly by AudioContext.
     *
     * Uses fetch() + expo-file-system v18 File API:
     * - fetch() downloads the MP3 as an ArrayBuffer
     * - new File() writes it to the cache directory
     */
    private async downloadVerseToCache(trackId: string, remoteUrl: string): Promise<void> {
        // Already cached or currently downloading — skip
        if (this.cachedPaths.has(trackId) || this.activeDownloads.has(trackId)) return;

        this.activeDownloads.add(trackId);
        try {
            const dir = this.getCacheDir();
            const fileName = trackId.replace(':', '_') + '.mp3';
            const file = new File(dir, fileName);

            // Check if already exists on disk (from a previous download in this session)
            if (file.exists && file.size > 0) {
                this.cachedPaths.set(trackId, file.uri);
                return;
            }

            // Download the file using fetch + write
            const response = await fetch(remoteUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                file.write(new Uint8Array(buffer));
                this.cachedPaths.set(trackId, file.uri);
                if (__DEV__) console.log(`[AudioCache] ✅ Cached ${trackId}`);
            } else {
                if (__DEV__) console.warn(`[AudioCache] ❌ HTTP ${response.status} for ${trackId}`);
            }
        } catch (e) {
            if (__DEV__) console.warn(`[AudioCache] Download failed for ${trackId}:`, e);
        } finally {
            this.activeDownloads.delete(trackId);
        }
    }

    /**
     * Pre-download the next 2 verses ahead of the currently playing track.
     * Called from PlaybackActiveTrackChanged event handler (fire-and-forget).
     *
     * After downloading, updates the RNTP queue's track URL to the cached
     * file:// path so the next transition is instant.
     */
    private async preDownloadAhead(currentIndex: number): Promise<void> {
        if (!this.currentQueueMeta || this.isFullSurahMode) return;

        const { surahNum, verses, cdnFolder } = this.currentQueueMeta;

        // Pre-download next 2 verses
        for (let offset = 1; offset <= 2; offset++) {
            const nextIdx = currentIndex + offset;
            if (nextIdx >= verses.length) break;

            const verse = verses[nextIdx];
            const trackId = `${surahNum}:${verse.number}`;
            const remoteUrl = this.buildUrl(surahNum, verse.number, cdnFolder);

            // Download to cache
            await this.downloadVerseToCache(trackId, remoteUrl);

            // If cached, update the RNTP track's URL to the local file
            const cachedPath = this.cachedPaths.get(trackId);
            if (cachedPath) {
                try {
                    await TrackPlayer.updateMetadataForTrack(nextIdx, {
                        url: cachedPath,
                    } as any);
                } catch {
                    // updateMetadataForTrack may not support URL changes in all RNTP versions.
                    // The cached file will still be used if the track is re-added.
                }
            }
        }
    }

    /**
     * Clear all cached audio files and reset download state.
     * Called on stop(), surah change, or mode switch.
     */
    private async clearCache(): Promise<void> {
        this.cachedPaths.clear();
        this.activeDownloads.clear();
        this.currentQueueMeta = null;
        try {
            if (this.cacheDir?.exists) {
                this.cacheDir.delete();
                this.cacheDir = null;
            }
        } catch {
            // Best-effort cleanup
        }
    }

    /** Preload is handled automatically by the pre-download cache system */
    async preloadVerse(): Promise<void> {
        // Pre-downloading is triggered automatically by PlaybackActiveTrackChanged.
        // This method exists for API compatibility with AudioContext.
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
        // Clean up pre-download cache
        await this.clearCache();
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

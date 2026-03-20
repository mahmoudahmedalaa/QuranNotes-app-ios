/**
 * TadabburAudioService — Verse recitation for Tadabbur contemplation.
 *
 * v3 — Uses react-native-track-player (RNTP) for verse playback.
 *
 * WHY:
 *  - expo-av conflicts with RNTP's iOS audio session management,
 *    causing silent playback failures.
 *  - RNTP is the project's single audio engine (see docs/AUDIO_STABILITY.md).
 *  - This service now uses the same TrackPlayer API as AudioPlayerService.
 *
 * HOW:
 *  - Loads verse MP3s from everyayah.com CDN (Alafasy reciter).
 *  - Plays sequentially using RNTP queue.
 *  - Emits observable state for UI playback indicators.
 *  - Ambient audio is currently a no-op (verse recitation IS the experience).
 */
import TrackPlayer, { State, Event } from 'react-native-track-player';

// ── everyayah.com CDN — Mishary Alafasy (soothing for reflection) ──────────
const ALAFASY_CDN = 'https://everyayah.com/data/Alafasy_128kbps';

// ── Ambient audio config ────────────────────────────────────────────────────
// Time-of-day based ambient settings.
// Volume and style vary to match the contemplative mood of the hour.
type AmbientProfile = {
    name: string;
    volume: number;
    description: string;
};

const TIME_PROFILES: Record<string, AmbientProfile> = {
    fajr: {
        name: 'Dawn Stillness',
        volume: 0.10,
        description: 'Pre-dawn tranquility',
    },
    morning: {
        name: 'Morning Calm',
        volume: 0.12,
        description: 'Gentle morning ambiance',
    },
    afternoon: {
        name: 'Midday Serenity',
        volume: 0.10,
        description: 'Warm afternoon stillness',
    },
    evening: {
        name: 'Evening Peace',
        volume: 0.12,
        description: 'Sunset contemplation',
    },
    night: {
        name: 'Night Meditation',
        volume: 0.08,
        description: 'Deep night stillness',
    },
};

// ── Observable Audio State ──────────────────────────────────────────────────

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface TadabburAudioState {
    /** Overall ambient status */
    ambientState: AudioPlaybackState;
    ambientProfile: AmbientProfile;

    /** Verse recitation status */
    recitationState: AudioPlaybackState;
    currentVerse: { surah: number; verse: number } | null;

    /** True when any audio is actively playing */
    isAnyAudioPlaying: boolean;
}

type AudioStateListener = (state: TadabburAudioState) => void;

const listeners = new Set<AudioStateListener>();

let currentState: TadabburAudioState = {
    ambientState: 'idle',
    ambientProfile: getTimeProfile(),
    recitationState: 'idle',
    currentVerse: null,
    isAnyAudioPlaying: false,
};

function emitState(partial: Partial<TadabburAudioState>): void {
    currentState = { ...currentState, ...partial };
    currentState.isAnyAudioPlaying =
        currentState.ambientState === 'playing' || currentState.recitationState === 'playing';
    listeners.forEach((fn) => {
        try { fn(currentState); } catch { }
    });
}

/**
 * Subscribe to audio state changes. Returns unsubscribe function.
 */
export function subscribeToAudioState(listener: AudioStateListener): () => void {
    listeners.add(listener);
    // Emit current state immediately
    try { listener(currentState); } catch { }
    return () => listeners.delete(listener);
}

/**
 * Get the current audio state snapshot.
 */
export function getAudioState(): TadabburAudioState {
    return currentState;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function verseKey(surahNum: number, verseNum: number): string {
    const s = String(surahNum).padStart(3, '0');
    const v = String(verseNum).padStart(3, '0');
    return `${s}${v}`;
}

function getVerseAudioUrl(surahNum: number, verseNum: number): string {
    return `${ALAFASY_CDN}/${verseKey(surahNum, verseNum)}.mp3`;
}

function getTimeProfile(): AmbientProfile {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 7) return TIME_PROFILES.fajr;
    if (hour >= 7 && hour < 12) return TIME_PROFILES.morning;
    if (hour >= 12 && hour < 16) return TIME_PROFILES.afternoon;
    if (hour >= 16 && hour < 20) return TIME_PROFILES.evening;
    return TIME_PROFILES.night;
}

// ── Service State ───────────────────────────────────────────────────────────

/** Flag to track if Tadabbur is currently "owning" the RNTP queue */
let isTadabburPlaying = false;

/** Event subscription cleanup */
let eventSubscription: { remove: () => void } | null = null;

/**
 * Ensure RNTP is initialized. The main AudioPlayerService should have already
 * called setupPlayer(), but we guard against the case where Tadabbur is used first.
 */
async function ensurePlayerReady(): Promise<void> {
    try {
        // getActiveTrack() will throw if the player isn't set up yet
        await TrackPlayer.getActiveTrack();
    } catch {
        // Player not initialized — set it up
        try {
            await TrackPlayer.setupPlayer({
                minBuffer: 5,
                maxBuffer: 50,
                playBuffer: 0.2,
                backBuffer: 0,
            });
        } catch {
            // Already set up (e.g., during hot reload) — safe to continue
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start time-of-day appropriate ambient background audio.
 * Currently a no-op — verse recitation IS the audio experience.
 * In the future, bundle a local ambient .mp3 asset.
 */
export async function startAmbient(): Promise<void> {
    const profile = getTimeProfile();
    if (__DEV__) console.log(`[TadabburAudio] startAmbient() — profile: ${profile.name} (ambient is silent)`);
    emitState({ ambientState: 'idle', ambientProfile: profile });
}

/**
 * Play verse recitation audio using react-native-track-player.
 *
 * Loads verses into the RNTP queue and plays them sequentially.
 * Emits state updates so the UI can show playback indicators.
 */
export async function playVerseRecitation(
    surahNum: number,
    startVerse: number,
    endVerse: number,
): Promise<void> {
    if (__DEV__) console.log(`[TadabburAudio] playVerseRecitation(${surahNum}:${startVerse}-${endVerse})`);

    emitState({
        recitationState: 'loading',
        currentVerse: { surah: surahNum, verse: startVerse },
    });

    try {
        await ensurePlayerReady();

        // Reset the queue — Tadabbur takes over RNTP
        await TrackPlayer.reset();
        isTadabburPlaying = true;

        // Build tracks for each verse in the range
        const tracks = [];
        for (let v = startVerse; v <= endVerse; v++) {
            tracks.push({
                id: `tadabbur_${surahNum}:${v}`,
                url: getVerseAudioUrl(surahNum, v),
                title: `Verse ${v}`,
                artist: 'Mishary Alafasy',
                album: 'Tadabbur — QuranNotes',
                artwork: require('../../../../assets/icon.png'),
            });
        }

        if (__DEV__) console.log(`[TadabburAudio] Adding ${tracks.length} tracks to RNTP queue`);

        // Add all tracks at once, then play
        await TrackPlayer.add(tracks);
        await TrackPlayer.setVolume(0.85);
        await TrackPlayer.play();

        emitState({
            recitationState: 'playing',
            currentVerse: { surah: surahNum, verse: startVerse },
        });

        if (__DEV__) console.log(`[TadabburAudio] RNTP playback started ✓`);

        // Wait for the entire queue to finish
        const verseCount = endVerse - startVerse + 1;
        await new Promise<void>((resolve) => {
            let resolved = false;
            const safeResolve = () => {
                if (resolved) return;
                resolved = true;
                cleanup();
                resolve();
            };

            // Scale timeout: ~30s per verse, min 60s, max 300s
            const SAFETY_TIMEOUT = Math.min(300000, Math.max(60000, verseCount * 30000));
            const timeout = setTimeout(() => {
                if (__DEV__) console.warn(`[TadabburAudio] Safety timeout reached (${SAFETY_TIMEOUT / 1000}s)`);
                safeResolve();
            }, SAFETY_TIMEOUT);

            // Clean up any previous subscription
            if (eventSubscription) {
                eventSubscription.remove();
                eventSubscription = null;
            }

            // Listen for track changes (to update currentVerse in state)
            const trackChangeSub = TrackPlayer.addEventListener(
                Event.PlaybackActiveTrackChanged,
                (data) => {
                    if (!isTadabburPlaying) return;
                    const trackId = data.track?.id;
                    if (trackId && typeof trackId === 'string' && trackId.startsWith('tadabbur_')) {
                        const parts = trackId.replace('tadabbur_', '').split(':');
                        if (parts.length === 2) {
                            const verseNum = parseInt(parts[1], 10);
                            if (!isNaN(verseNum)) {
                                emitState({
                                    currentVerse: { surah: surahNum, verse: verseNum },
                                    recitationState: 'playing',
                                });
                                if (__DEV__) console.log(`[TadabburAudio] Now playing verse ${surahNum}:${verseNum}`);
                            }
                        }
                    }
                },
            );

            // Listen for queue end (all verses played)
            const queueEndSub = TrackPlayer.addEventListener(
                Event.PlaybackQueueEnded,
                () => {
                    if (!isTadabburPlaying) return;
                    if (__DEV__) console.log(`[TadabburAudio] Queue finished — all verses played ✓`);
                    safeResolve();
                },
            );

            // Fallback: poll player state every 2s to catch completion
            // PlaybackQueueEnded doesn't always fire on all iOS versions
            const pollInterval = setInterval(async () => {
                if (resolved) return;
                try {
                    const playerState = await TrackPlayer.getPlaybackState();
                    const state = playerState?.state ?? playerState;
                    if (
                        state === State.None ||
                        state === State.Stopped ||
                        state === State.Error
                    ) {
                        if (__DEV__) console.log(`[TadabburAudio] Player state=${state} — resolving via poll`);
                        safeResolve();
                    }
                } catch {
                    // Player not available — resolve
                    safeResolve();
                }
            }, 2000);

            // Cleanup helper
            const cleanup = () => {
                clearTimeout(timeout);
                clearInterval(pollInterval);
                trackChangeSub.remove();
                queueEndSub.remove();
                eventSubscription = null;
            };

            // Store for external cleanup
            eventSubscription = {
                remove: cleanup,
            };
        });
    } catch (e) {
        if (__DEV__) console.warn(`[TadabburAudio] Playback error:`, e);
        emitState({ recitationState: 'error' });
    }

    // Mark recitation complete
    isTadabburPlaying = false;
    if (__DEV__) console.log(`[TadabburAudio] playVerseRecitation complete`);
    emitState({
        recitationState: 'idle',
        currentVerse: null,
    });
}

/**
 * Pause/resume ambient audio toggle.
 * Currently no-op since ambient is silent.
 */
export async function toggleAmbient(): Promise<void> {
    // No-op — ambient audio not implemented yet
    if (__DEV__) console.log('[TadabburAudio] toggleAmbient() — no ambient audio to toggle');
}

/**
 * Stop all Tadabbur audio and release RNTP resources.
 */
export async function stopAll(): Promise<void> {
    try {
        if (isTadabburPlaying) {
            isTadabburPlaying = false;
            await TrackPlayer.reset();
        }
    } catch {
        // Player may not be initialized — safe to ignore
    }

    // Clean up event subscriptions
    if (eventSubscription) {
        eventSubscription.remove();
        eventSubscription = null;
    }

    emitState({
        ambientState: 'idle',
        recitationState: 'idle',
        currentVerse: null,
    });
}

/**
 * Fade out all audio gracefully over durationMs, then stop.
 */
export async function fadeOutAndStop(durationMs: number = 1000): Promise<void> {
    if (!isTadabburPlaying) {
        await stopAll();
        return;
    }

    const steps = 10;
    const interval = durationMs / steps;

    for (let i = steps; i >= 0; i--) {
        const vol = (i / steps) * 0.85;
        try {
            await TrackPlayer.setVolume(vol);
        } catch { }
        await new Promise((r) => setTimeout(r, interval));
    }

    await stopAll();
}

/**
 * Get the current ambient profile name for display.
 */
export function getAmbientProfileName(): string {
    return getTimeProfile().name;
}

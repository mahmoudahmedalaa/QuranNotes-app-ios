/**
 * QuranAudioApi — Fetches full-surah audio and verse timestamps from Quran.com API v4.
 *
 * Used by the gapless playback system to get:
 * 1. A single MP3 URL for an entire surah (zero inter-verse gaps)
 * 2. Verse-level timestamps (ms) for UI synchronization
 *
 * Falls back gracefully — callers should use per-verse playback on failure.
 */

export interface VerseTimestamp {
    verseKey: string;       // e.g. "2:142"
    timestampFrom: number;  // ms from start of audio
    timestampTo: number;    // ms from start of audio
    duration: number;       // ms
}

export interface ChapterAudio {
    audioUrl: string;
    timestamps: VerseTimestamp[];
}

// In-memory cache: "reciterId:chapter" → ChapterAudio
const audioCache = new Map<string, ChapterAudio>();

const API_BASE = 'https://api.quran.com/api/v4';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

/**
 * Fetch full-surah audio URL and verse timestamps from Quran.com.
 *
 * @param quranComReciterId - Quran.com chapter_recitations reciter ID
 * @param chapter - Surah number (1-114)
 * @returns ChapterAudio or null if unavailable / error
 */
export async function getChapterAudio(
    quranComReciterId: number,
    chapter: number,
): Promise<ChapterAudio | null> {
    const cacheKey = `${quranComReciterId}:${chapter}`;

    // Return cached data if available
    const cached = audioCache.get(cacheKey);
    if (cached) return cached;

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(
                `${API_BASE}/chapter_recitations/${quranComReciterId}/${chapter}?segments=true`,
                { signal: controller.signal },
            );
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (__DEV__) console.warn(`[QuranAudioApi] HTTP ${response.status} for reciter ${quranComReciterId} chapter ${chapter}`);
                return null;
            }

            const data = await response.json();
            const audioFile = data?.audio_file;
            if (!audioFile?.audio_url) {
                if (__DEV__) console.warn('[QuranAudioApi] No audio_url in response');
                return null;
            }

            // Parse timestamps — handle both numeric and float segment formats
            const timestamps: VerseTimestamp[] = (audioFile.timestamps || []).map(
                (t: any) => ({
                    verseKey: t.verse_key,
                    timestampFrom: Math.round(Number(t.timestamp_from) || 0),
                    timestampTo: Math.round(Number(t.timestamp_to) || 0),
                    duration: Math.abs(Math.round(Number(t.duration) || 0)),
                }),
            );

            // Validate we got timestamps (some reciters have audio but no timestamps)
            if (timestamps.length === 0) {
                if (__DEV__) console.warn('[QuranAudioApi] No timestamps in response — cannot use for gapless playback');
                return null;
            }

            const result: ChapterAudio = {
                audioUrl: audioFile.audio_url,
                timestamps,
            };

            // Cache for future use
            audioCache.set(cacheKey, result);
            return result;

        } catch (error: unknown) {
            lastError = error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                if (__DEV__) console.warn(`[QuranAudioApi] Timeout (attempt ${attempt + 1})`);
            } else {
                if (__DEV__) console.warn(`[QuranAudioApi] Fetch error (attempt ${attempt + 1}):`, error);
            }
            // Retry after a short delay
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    if (__DEV__) console.warn('[QuranAudioApi] All attempts failed:', lastError);
    return null;
}

/**
 * Binary search to find which verse is playing at a given position (ms).
 * Returns the verse index in the timestamps array, or -1 if not found.
 */
export function findVerseAtPosition(
    timestamps: VerseTimestamp[],
    positionMs: number,
): number {
    if (timestamps.length === 0) return -1;

    // Quick bounds check
    if (positionMs < timestamps[0].timestampFrom) return 0;
    if (positionMs >= timestamps[timestamps.length - 1].timestampTo) return timestamps.length - 1;

    let low = 0;
    let high = timestamps.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const ts = timestamps[mid];

        if (positionMs < ts.timestampFrom) {
            high = mid - 1;
        } else if (positionMs >= ts.timestampTo) {
            low = mid + 1;
        } else {
            // positionMs is within [timestampFrom, timestampTo)
            return mid;
        }
    }

    // Fallback: return closest match (shouldn't happen with valid data)
    return Math.max(0, Math.min(low, timestamps.length - 1));
}

/** Clear the audio cache (useful for testing or memory pressure) */
export function clearAudioCache(): void {
    audioCache.clear();
}

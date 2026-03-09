/**
 * TafsirDataService — Loads structured tafsir commentary from bundled JSON.
 *
 * Architecture:
 * - JSON files are bundled in-app via static require() in TafsirRequireMap.ts
 * - Caches parsed data in-memory via Map for repeated access
 * - Graceful fallback if data is missing or corrupted
 *
 * Data format per file (new — with verse ranges):
 * { "verses": { "1": { "text": "...", "range": [1, 7] }, ... } }
 *
 * Also supports legacy format:
 * { "verses": { "1": "commentary text...", "2": "...", ... } }
 */

import { TafsirSource, TafsirCommentary } from '../domain/types';
import { TAFSIR_DATA } from './TafsirRequireMap';

// ── In-memory cache ──
const cache = new Map<string, Record<string, { text: string; range?: [number, number] }>>();

/**
 * Build the cache key for a surah+source combo.
 */
function cacheKey(source: TafsirSource, surahNumber: number): string {
    return `${source}_${surahNumber}`;
}

/**
 * Normalize verse entry — handles both old (string) and new ({ text, range }) formats.
 */
function normalizeEntry(entry: unknown): { text: string; range?: [number, number] } | null {
    if (!entry) return null;
    if (typeof entry === 'string') {
        return { text: entry };
    }
    if (typeof entry === 'object' && entry !== null && 'text' in entry) {
        const obj = entry as { text: string; range?: [number, number] };
        return { text: obj.text, range: obj.range };
    }
    return null;
}

/**
 * Load tafsir data for a specific surah from the bundled JSON.
 * Returns the verses map or null if not available.
 */
function loadSurahData(source: TafsirSource, surahNumber: number): Record<string, { text: string; range?: [number, number] }> | null {
    const key = cacheKey(source, surahNumber);

    // Check in-memory cache first
    if (cache.has(key)) {
        return cache.get(key)!;
    }

    try {
        const data = TAFSIR_DATA[source]?.[surahNumber];
        if (data?.verses && Object.keys(data.verses).length > 0) {
            // Normalize all entries to the new format
            const normalized: Record<string, { text: string; range?: [number, number] }> = {};
            for (const [vn, raw] of Object.entries(data.verses)) {
                const entry = normalizeEntry(raw);
                if (entry) {
                    normalized[vn] = entry;
                }
            }

            if (Object.keys(normalized).length > 0) {
                cache.set(key, normalized);
                return normalized;
            }
        }
    } catch (e) {
        console.warn(`[TafsirData] Failed to load ${source} surah ${surahNumber}:`, e);
    }

    return null;
}

/**
 * Get tafsir commentary for a specific verse.
 *
 * @param source - The tafsir source (ibn_kathir or al_sadi)
 * @param surahNumber - Surah number (1-114)
 * @param verseNumber - Verse number within the surah
 * @returns TafsirCommentary if available, null otherwise
 */
export function getTafsirCommentary(
    source: TafsirSource,
    surahNumber: number,
    verseNumber: number,
): TafsirCommentary | null {
    const surahData = loadSurahData(source, surahNumber);

    if (!surahData) {
        return null;
    }

    const entry = surahData[String(verseNumber)];
    if (!entry || !entry.text) {
        return null;
    }

    return {
        text: entry.text,
        source,
        surahNumber,
        verseNumber,
        verseRange: entry.range,
    };
}

/**
 * Check if tafsir data is available for a given source and surah.
 */
export function isTafsirAvailable(source: TafsirSource, surahNumber: number): boolean {
    return loadSurahData(source, surahNumber) !== null;
}

/**
 * Clear the in-memory cache (useful for testing or memory pressure).
 */
export function clearTafsirCache(): void {
    cache.clear();
}

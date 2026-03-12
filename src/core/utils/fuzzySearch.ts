/**
 * Fuzzy search utility for Arabic transliteration names.
 * Used by SurahPicker, ReciterPicker, and other search UIs.
 *
 * Handles common transliteration variations:
 *   "Al-Ahzaab" → "alahzab"
 *   "Yaseen"    → "yasin"
 *   "Mishary"   → "misary"
 *   "Husary"    → "husary"
 */

/**
 * Normalize a string for fuzzy matching of Arabic transliterations.
 * Handles: hyphens, doubled vowels, common letter variants, diacritics.
 */
export function normalize(str: string): string {
    return str
        .toLowerCase()
        .replace(/[-''`_]/g, '')        // strip hyphens, apostrophes, underscores
        .replace(/\s+/g, '')            // strip spaces
        // Collapse doubled vowels: aa→a, ee→i, oo→u, ii→i, uu→u
        .replace(/aa/g, 'a')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/ii/g, 'i')
        .replace(/uu/g, 'u')
        // Common transliteration equivalences
        .replace(/th/g, 't')            // "th" → "t" (Thaaha/Taha)
        .replace(/dh/g, 'd')            // "dh" → "d"
        .replace(/sh/g, 's')            // "sh" → "s"
        .replace(/kh/g, 'k')            // "kh" → "k"
        .replace(/gh/g, 'g')            // "gh" → "g"
        .replace(/ph/g, 'f')            // unlikely but safe
        // Strip trailing 'h' for cases like "tawbah" vs "tawba", "fatiha" vs "fatihah"
        .replace(/h$/, '');
}

/**
 * Score a candidate string against a query using fuzzy matching.
 * Returns a score: higher is better, 0 means no match.
 *
 * Matches:
 * 1. Exact normalized substring → highest score
 * 2. Prefix match → high score
 * 3. Character-by-character subsequence → lower score proportional to coverage
 */
export function fuzzyScore(query: string, candidate: string): number {
    const nq = normalize(query);
    const nc = normalize(candidate);

    if (!nq) return 1; // empty query matches everything

    // Exact substring match (best)
    if (nc.includes(nq)) {
        // Prefer shorter candidates (more specific match)
        return 100 + (1 / nc.length) * 10;
    }

    // Check prefix
    if (nc.startsWith(nq)) {
        return 90 + (1 / nc.length) * 10;
    }

    // Subsequence match: every char of query appears in order in candidate
    let qi = 0;
    let matchCount = 0;
    for (let ci = 0; ci < nc.length && qi < nq.length; ci++) {
        if (nc[ci] === nq[qi]) {
            qi++;
            matchCount++;
        }
    }

    if (qi === nq.length) {
        // All query chars found in order — score by coverage %
        return (matchCount / nc.length) * 50;
    }

    return 0; // no match
}

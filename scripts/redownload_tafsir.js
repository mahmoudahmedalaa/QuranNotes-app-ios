#!/usr/bin/env node
/**
 * redownload_tafsir.js — Re-download tafsir from quran.com API v4.
 *
 * The quran.com API returns verse-range commentary (e.g., Ibn Kathir
 * discusses passages of 3-8 verses together). For each verse we store
 * the commentary text AND the verse range it belongs to.
 *
 * Output format per surah JSON:
 * {
 *   "verses": {
 *     "1": { "text": "...", "range": [1, 7] },
 *     "2": { "text": "...", "range": [1, 7] },
 *     ...
 *   }
 * }
 *
 * Sources:
 *   - Ibn Kathir (English): resource_id 169
 *   - Al-Sa'di (Arabic):    resource_id 170 (ar-tafsir-al-saddi)
 *
 * Usage: node scripts/redownload_tafsir.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ──
const SOURCES = [
    { key: 'ibn_kathir', resourceId: 169, name: 'Ibn Kathir (English)' },
    { key: 'al_sadi', resourceId: 91, name: "Al-Sa'di (Arabic)" },
];
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'features', 'tafsir', 'data', 'tafsir');
const TOTAL_SURAHS = 114;
// quran.com rate limits: be gentle
const DELAY_MS = 300;

// Verse counts per surah
const VERSE_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98,
    135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 88, 52, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11,
    11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25,
    22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5,
    4, 5, 6
];

/**
 * HTTPS GET with redirect following. Returns string body.
 */
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const doGet = (u) => {
            https.get(u, { headers: { 'Accept': 'application/json' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return doGet(res.headers.location);
                }
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                    }
                });
                res.on('error', reject);
            }).on('error', reject);
        };
        doGet(url);
    });
}

/**
 * Strip HTML tags and decode entities.
 */
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Download tafsir for one surah using quran.com API v4.
 * Fetches verse-by-verse via the by_ayah endpoint.
 */
async function downloadSurah(source, surahNumber) {
    const verseCount = VERSE_COUNTS[surahNumber - 1];
    const padded = String(surahNumber).padStart(3, '0');
    const outFile = path.join(OUTPUT_DIR, source.key, `surah_${padded}.json`);

    const verses = {};
    let verse = 1;
    const visited = new Set();

    while (verse <= verseCount) {
        if (visited.has(verse)) {
            verse++;
            continue;
        }

        const url = `https://api.quran.com/api/v4/tafsirs/${source.resourceId}/by_ayah/${surahNumber}:${verse}`;

        try {
            const raw = await httpGet(url);
            const json = JSON.parse(raw);
            const tafsir = json.tafsir || {};
            const text = stripHtml(tafsir.text || '');
            const verseKeys = Object.keys(tafsir.verses || {});

            // Parse the verse range from the API response
            const verseNums = verseKeys.map(k => {
                const parts = k.split(':');
                return parseInt(parts[1], 10);
            }).sort((a, b) => a - b);

            const rangeStart = verseNums.length > 0 ? verseNums[0] : verse;
            const rangeEnd = verseNums.length > 0 ? verseNums[verseNums.length - 1] : verse;

            // Assign the same text & range to each verse in the group
            for (const vn of verseNums) {
                if (vn >= 1 && vn <= verseCount) {
                    verses[String(vn)] = {
                        text: text,
                        range: [rangeStart, rangeEnd],
                    };
                    visited.add(vn);
                }
            }

            // Jump past this verse range
            verse = rangeEnd + 1;
        } catch (e) {
            console.warn(`  ⚠️  ${surahNumber}:${verse} — ${e.message}`);
            verse++;
        }

        await sleep(DELAY_MS);
    }

    fs.writeFileSync(outFile, JSON.stringify({ verses }, null, 2), 'utf8');
    return Object.keys(verses).length;
}

async function downloadSource(source) {
    const dir = path.join(OUTPUT_DIR, source.key);
    fs.mkdirSync(dir, { recursive: true });

    let totalVerses = 0;
    const startTime = Date.now();

    for (let s = 1; s <= TOTAL_SURAHS; s++) {
        const count = await downloadSurah(source, s);
        totalVerses += count;

        if (s % 10 === 0 || s === TOTAL_SURAHS) {
            const pct = Math.round((s / TOTAL_SURAHS) * 100);
            process.stdout.write(`  📥 ${pct}% (surah ${s}/${TOTAL_SURAHS}, total verses: ${totalVerses})\n`);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ ${source.name}: ${TOTAL_SURAHS} surahs, ${totalVerses} verses in ${elapsed}s\n`);
    return totalVerses;
}

async function main() {
    console.log('🕌 Tafsir Re-download — quran.com API v4\n');

    let grandTotal = 0;
    for (const source of SOURCES) {
        console.log(`📖 Downloading ${source.name}...`);
        grandTotal += await downloadSource(source);
    }

    console.log(`\n🎉 Done! Total: ${grandTotal} verses across both sources`);
    console.log(`   Data saved to: src/features/tafsir/data/tafsir/`);
}

main().catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
});

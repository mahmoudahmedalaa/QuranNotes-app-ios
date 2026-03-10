#!/usr/bin/env node
/**
 * add_verse_ranges.js — Process existing tafsir JSON to add verse-range metadata.
 *
 * Reads the existing surah JSON files, detects which verses share the same
 * commentary text (indicating verse-range grouping in classical tafsir),
 * and rewrites each file with the new format:
 *
 * Old: { "verses": { "1": "text...", "2": "text...", ... } }
 * New: { "verses": { "1": { "text": "...", "range": [1, 7] }, ... } }
 *
 * Runs locally — no API calls, completes in seconds.
 */

const fs = require('fs');
const path = require('path');

const TAFSIR_DIR = path.join(__dirname, '..', 'src', 'features', 'tafsir', 'data', 'tafsir');
const SOURCES = ['ibn_kathir', 'al_sadi'];
const TOTAL_SURAHS = 114;

function processSurah(sourceDir, surahFile) {
    const filePath = path.join(sourceDir, surahFile);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    if (!data.verses) return 0;

    // Check if already in new format
    const firstVal = Object.values(data.verses)[0];
    if (firstVal && typeof firstVal === 'object' && firstVal.text) {
        // Already converted
        return Object.keys(data.verses).length;
    }

    // Get all verse numbers sorted
    const verseNums = Object.keys(data.verses)
        .map(Number)
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    if (verseNums.length === 0) return 0;

    // Group consecutive verses that share the same text
    const groups = [];
    let currentGroup = { text: data.verses[String(verseNums[0])], verses: [verseNums[0]] };

    for (let i = 1; i < verseNums.length; i++) {
        const vn = verseNums[i];
        const text = data.verses[String(vn)];

        if (text === currentGroup.text) {
            currentGroup.verses.push(vn);
        } else {
            groups.push(currentGroup);
            currentGroup = { text, verses: [vn] };
        }
    }
    groups.push(currentGroup);

    // Build new format with ranges
    const newVerses = {};
    for (const group of groups) {
        const rangeStart = group.verses[0];
        const rangeEnd = group.verses[group.verses.length - 1];

        for (const vn of group.verses) {
            newVerses[String(vn)] = {
                text: group.text,
                range: [rangeStart, rangeEnd],
            };
        }
    }

    // Write back
    fs.writeFileSync(filePath, JSON.stringify({ verses: newVerses }, null, 2), 'utf8');
    return Object.keys(newVerses).length;
}

function main() {
    console.log('🔧 Adding verse-range metadata to existing tafsir JSON...\n');

    for (const source of SOURCES) {
        const sourceDir = path.join(TAFSIR_DIR, source);
        if (!fs.existsSync(sourceDir)) {
            console.log(`  ⚠️  Skipping ${source} — directory not found`);
            continue;
        }

        let totalVerses = 0;
        let totalFiles = 0;

        for (let s = 1; s <= TOTAL_SURAHS; s++) {
            const padded = String(s).padStart(3, '0');
            const file = `surah_${padded}.json`;
            const filePath = path.join(sourceDir, file);

            if (!fs.existsSync(filePath)) {
                console.log(`  ⚠️  Missing: ${source}/${file}`);
                continue;
            }

            totalVerses += processSurah(sourceDir, file);
            totalFiles++;
        }

        console.log(`  ✅ ${source}: ${totalFiles} surahs, ${totalVerses} verses processed`);
    }

    console.log('\n🎉 Done! All files updated with verse-range metadata.');
}

main();

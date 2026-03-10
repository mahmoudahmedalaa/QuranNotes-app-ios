#!/usr/bin/env node
/**
 * generate_require_map.js — Generate a static require() map for React Native.
 *
 * React Native requires static require() calls that the bundler can resolve
 * at build time. This script generates a TypeScript file that maps
 * (source, surahNumber) to the corresponding JSON require().
 *
 * Usage: node scripts/generate_require_map.js
 * Output: src/features/tafsir/data/TafsirRequireMap.ts
 */

const fs = require('fs');
const path = require('path');

const TAFSIR_DIR = path.join(__dirname, '..', 'src', 'features', 'tafsir', 'data', 'tafsir');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'features', 'tafsir', 'data', 'TafsirRequireMap.ts');
const SOURCES = ['ibn_kathir', 'al_sadi'];

function main() {
    let lines = [];

    lines.push('/**');
    lines.push(' * Auto-generated static require map for bundled tafsir JSON.');
    lines.push(' * DO NOT EDIT MANUALLY — regenerate with: node scripts/generate_require_map.js');
    lines.push(' */');
    lines.push('');
    lines.push("import { TafsirSource } from '../domain/types';");
    lines.push('');
    lines.push('type TafsirRequireMap = Record<TafsirSource, Record<number, { verses: Record<string, string> }>>;');
    lines.push('');
    lines.push('export const TAFSIR_DATA: TafsirRequireMap = {');

    for (const source of SOURCES) {
        const dir = path.join(TAFSIR_DIR, source);

        lines.push(`    ${source}: {`);

        if (fs.existsSync(dir)) {
            for (let surah = 1; surah <= 114; surah++) {
                const padded = String(surah).padStart(3, '0');
                const file = path.join(dir, `surah_${padded}.json`);

                if (fs.existsSync(file)) {
                    // Verify the file has actual data
                    try {
                        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                        if (data.verses && Object.keys(data.verses).length > 0) {
                            const relPath = `./tafsir/${source}/surah_${padded}.json`;
                            lines.push(`        ${surah}: require('${relPath}'),`);
                        }
                    } catch (e) {
                        console.warn(`  [WARN] Skipping ${file}: ${e.message}`);
                    }
                }
            }
        }

        lines.push('    },');
    }

    lines.push('};');
    lines.push('');

    fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');

    // Count entries
    let total = 0;
    for (const source of SOURCES) {
        const dir = path.join(TAFSIR_DIR, source);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
            total += files.length;
            console.log(`  ${source}: ${files.length} surah files`);
        }
    }

    console.log(`\n✅ Generated ${OUTPUT_FILE}`);
    console.log(`   Total: ${total} surah files mapped`);
}

main();

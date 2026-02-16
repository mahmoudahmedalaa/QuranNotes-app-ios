/**
 * AudioKhatmaBridge — Updates global reading position during audio playback.
 *
 * Always updates the GLOBAL ReadingPositionService so that the home screen
 * "Continue Reading" and the Khatma "Continue Reading" features work correctly.
 */
import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../../infrastructure/audio/AudioContext';
import { ReadingPositionService } from '../../../infrastructure/reading/ReadingPositionService';

export const AudioKhatmaBridge: React.FC = () => {
    const { playingVerse, currentSurahNum, currentSurahName } = useAudio();
    const highestVerseRef = useRef<{ surah: number; verse: number } | null>(null);

    // Reset highest verse tracking when surah changes
    useEffect(() => {
        if (currentSurahNum) {
            if (!highestVerseRef.current || highestVerseRef.current.surah !== currentSurahNum) {
                highestVerseRef.current = { surah: currentSurahNum, verse: 0 };
            }
        }
    }, [currentSurahNum]);

    // Auto-advance reading position (forward only)
    useEffect(() => {
        if (!playingVerse || !currentSurahNum) return;

        const highest = highestVerseRef.current;
        if (!highest || highest.surah !== playingVerse.surah || playingVerse.verse > highest.verse) {
            highestVerseRef.current = { surah: playingVerse.surah, verse: playingVerse.verse };

            // Update GLOBAL reading position (for home screen + Khatma continue reading)
            ReadingPositionService.save(playingVerse.surah, playingVerse.verse, currentSurahName || undefined);
        }
    }, [playingVerse, currentSurahNum, currentSurahName]);

    return null;
};

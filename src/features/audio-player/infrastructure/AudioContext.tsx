/**
 * AudioContext — Global audio state provider
 * Lifts audio playback state from local hook to app-wide context.
 * Audio continues playing across screen navigation.
 *
 * Uses react-native-track-player for native audio queue,
 * lock screen controls, and gapless playback.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayerService, PlaybackStatus } from './AudioPlayerService';
import { Surah, Verse } from '../../../core/domain/entities/Quran';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import { getReciterById } from '../domain/Reciter';
import { ReadingHistoryService } from '../../quran-reading/infrastructure/ReadingHistoryService';

// Singleton player instance (shared across the app)
const player = new AudioPlayerService();

const LAST_SESSION_KEY = 'audio_last_session';

/** Persisted audio session — survives stop/app restart */
export interface AudioSession {
    surahNum: number;
    surahName: string;
    verse: number;
    timestamp: number;
    completed: boolean; // true if queue finished naturally
}

/** Info about a completed playback session — used for batch Khatma tracking */
export interface CompletedPlayback {
    surah: number;
    verses: Verse[];
    timestamp: number;
}

interface AudioContextType {
    playingVerse: { surah: number; verse: number } | null;
    isPlaying: boolean;
    currentSurahNum: number | null;
    currentSurahName: string | null;
    playlist: Verse[];
    /** Populated when playback queue ends — Surah screen uses this to batch-record Khatma pages */
    lastCompletedPlayback: CompletedPlayback | null;
    /** Persisted session — survives stop, lives until user explicitly dismisses */
    lastSession: AudioSession | null;
    playVerse: (surahNum: number, verseNum: number, surah?: Surah) => Promise<void>;
    playSurah: (surah: Surah) => Promise<void>;
    playFromVerse: (surah: Surah, verseNum: number) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    /** Clear the persisted session — user explicitly dismisses the mini player */
    dismissSession: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = (): AudioContextType => {
    const ctx = useContext(AudioContext);
    if (!ctx) throw new Error('useAudio must be used within AudioProvider');
    return ctx;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings } = useSettings();
    const [playingVerse, setPlayingVerse] = useState<{ surah: number; verse: number } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSurahName, setCurrentSurahName] = useState<string | null>(null);
    const [lastCompletedPlayback, setLastCompletedPlayback] = useState<CompletedPlayback | null>(null);
    const [lastSession, setLastSession] = useState<AudioSession | null>(null);

    // Playlist State
    const [playlist, setPlaylist] = useState<Verse[]>([]);
    const [currentSurahNum, setCurrentSurahNum] = useState<number | null>(null);

    // ── Refs to prevent stale closures ──
    const playlistRef = useRef<Verse[]>([]);
    const currentSurahNumRef = useRef<number | null>(null);
    const currentSurahNameRef = useRef<string | null>(null);

    // Keep refs in sync with state
    useEffect(() => { playlistRef.current = playlist; }, [playlist]);
    useEffect(() => { currentSurahNumRef.current = currentSurahNum; }, [currentSurahNum]);
    useEffect(() => { currentSurahNameRef.current = currentSurahName; }, [currentSurahName]);

    // Ref to track previous reciter for live switching
    const prevReciterRef = useRef(settings.reciterId);

    // Get reciter info
    const getReciterInfo = useCallback(() => {
        const reciter = getReciterById(settings.reciterId);
        return { cdnFolder: reciter.cdnFolder, name: reciter.name };
    }, [settings.reciterId]);

    // Initialize player + restore last session on mount
    useEffect(() => {
        player.setup().catch(e => console.warn('[AudioContext] Setup failed:', e));
        // Restore persisted session for cold-start resume
        AsyncStorage.getItem(LAST_SESSION_KEY).then(raw => {
            if (raw) {
                try {
                    setLastSession(JSON.parse(raw));
                } catch { /* corrupt — ignore */ }
            }
        }).catch(() => { /* silent */ });
    }, []);

    // Live reciter switch — reload current playlist with new reciter
    useEffect(() => {
        if (prevReciterRef.current !== settings.reciterId && playingVerse && isPlaying) {
            const pl = playlistRef.current;
            const surahNum = currentSurahNumRef.current;
            const surahName = currentSurahNameRef.current;
            if (pl.length > 0 && surahNum) {
                const currentIndex = pl.findIndex(v => v.number === playingVerse.verse);
                const { cdnFolder, name } = getReciterInfo();
                player.loadPlaylist(
                    surahNum,
                    pl,
                    currentIndex >= 0 ? currentIndex : 0,
                    cdnFolder,
                    name,
                    surahName || 'Quran',
                );
            }
        }
        prevReciterRef.current = settings.reciterId;
    }, [settings.reciterId, playingVerse, isPlaying, getReciterInfo]);

    // ── Listen to player events ──
    useEffect(() => {
        const unsubscribe = player.addListener((status: PlaybackStatus) => {
            setIsPlaying(status.isPlaying);

            // Track changed in the queue — update playingVerse from playlist
            if (status.activeTrackIndex !== undefined) {
                const pl = playlistRef.current;
                const surahNum = currentSurahNumRef.current;
                if (pl.length > 0 && surahNum && status.activeTrackIndex < pl.length) {
                    const verse = pl[status.activeTrackIndex];
                    setPlayingVerse({ surah: surahNum, verse: verse.number });
                }
            }

            // Queue ended — save completed playback info BEFORE clearing state
            if (status.didJustFinish) {
                const finishedSurah = currentSurahNumRef.current;
                const finishedPlaylist = playlistRef.current;
                const finishedName = currentSurahNameRef.current;
                if (finishedSurah && finishedPlaylist.length > 0) {
                    setLastCompletedPlayback({
                        surah: finishedSurah,
                        verses: [...finishedPlaylist],
                        timestamp: Date.now(),
                    });
                    // Save session so mini player persists in "completed" state
                    const session: AudioSession = {
                        surahNum: finishedSurah,
                        surahName: finishedName || `Surah ${finishedSurah}`,
                        verse: finishedPlaylist[finishedPlaylist.length - 1].number,
                        timestamp: Date.now(),
                        completed: true,
                    };
                    setLastSession(session);
                    AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session)).catch(() => { });
                    // Record in reading history
                    ReadingHistoryService.addEntry({
                        surah: finishedSurah,
                        surahName: finishedName || `Surah ${finishedSurah}`,
                        verse: finishedPlaylist[finishedPlaylist.length - 1].number,
                        timestamp: Date.now(),
                        source: 'audio',
                    }).catch(() => { });
                }
                setPlayingVerse(null);
                setPlaylist([]);
                playlistRef.current = [];
                setCurrentSurahNum(null);
                currentSurahNumRef.current = null;
                setCurrentSurahName(null);
                currentSurahNameRef.current = null;
            }
        });
        return unsubscribe;
    }, []);

    // Play a specific verse (with optional surah context for queue)
    const playVerse = useCallback(
        async (surahNum: number, verseNum: number, surah?: Surah) => {
            try {
                const { cdnFolder, name } = getReciterInfo();

                if (surah) {
                    const startIndex = surah.verses.findIndex(v => v.number === verseNum);
                    if (startIndex >= 0) {
                        setPlaylist(surah.verses);
                        playlistRef.current = surah.verses;
                        setCurrentSurahNum(surah.number);
                        currentSurahNumRef.current = surah.number;
                        const sName = surah.englishName || surah.name;
                        setCurrentSurahName(sName);
                        currentSurahNameRef.current = sName;
                        setPlayingVerse({ surah: surahNum, verse: verseNum });

                        await player.loadPlaylist(
                            surah.number,
                            surah.verses,
                            startIndex,
                            cdnFolder,
                            name,
                            sName,
                        );
                        return;
                    }
                }

                // No surah context — try existing playlist
                if (currentSurahNumRef.current === surahNum && playlistRef.current.length > 0) {
                    const startIndex = playlistRef.current.findIndex(v => v.number === verseNum);
                    if (startIndex >= 0) {
                        setPlayingVerse({ surah: surahNum, verse: verseNum });
                        await player.skipToTrack(startIndex);
                        return;
                    }
                }

                // Fallback: single verse playback — clear stale playlist state first
                // to prevent conflicts when switching from surah to mood verse
                if (playlistRef.current.length > 0) {
                    await player.stop();
                }
                setPlaylist([]);
                playlistRef.current = [];
                setCurrentSurahNum(null);
                currentSurahNumRef.current = null;
                setCurrentSurahName(null);
                currentSurahNameRef.current = null;
                setPlayingVerse({ surah: surahNum, verse: verseNum });
                await player.playVerse(surahNum, verseNum, cdnFolder, name);
            } catch (e) {
                if (__DEV__) console.warn('[AudioContext] playVerse failed:', e);
            }
        },
        [getReciterInfo],
    );

    // Play entire surah from beginning
    const playSurah = useCallback(
        async (surah: Surah) => {
            try {
                setPlaylist(surah.verses);
                playlistRef.current = surah.verses;
                setCurrentSurahNum(surah.number);
                currentSurahNumRef.current = surah.number;
                const sName = surah.englishName || surah.name;
                setCurrentSurahName(sName);
                currentSurahNameRef.current = sName;

                if (surah.verses.length > 0) {
                    setPlayingVerse({ surah: surah.number, verse: surah.verses[0].number });
                    const { cdnFolder, name } = getReciterInfo();
                    await player.loadPlaylist(
                        surah.number,
                        surah.verses,
                        0,
                        cdnFolder,
                        name,
                        sName,
                    );
                }
            } catch (e) {
                if (__DEV__) console.warn('[AudioContext] playSurah failed:', e);
            }
        },
        [getReciterInfo],
    );

    // Play from a specific verse within a surah
    const playFromVerse = useCallback(
        async (surah: Surah, verseNum: number) => {
            try {
                const startIndex = surah.verses.findIndex(v => v.number === verseNum);
                if (startIndex >= 0) {
                    setPlaylist(surah.verses);
                    playlistRef.current = surah.verses;
                    setCurrentSurahNum(surah.number);
                    currentSurahNumRef.current = surah.number;
                    const sName = surah.englishName || surah.name;
                    setCurrentSurahName(sName);
                    currentSurahNameRef.current = sName;
                    setPlayingVerse({ surah: surah.number, verse: verseNum });
                    const { cdnFolder, name } = getReciterInfo();
                    await player.loadPlaylist(
                        surah.number,
                        surah.verses,
                        startIndex,
                        cdnFolder,
                        name,
                        sName,
                    );
                }
            } catch (e) {
                if (__DEV__) console.warn('[AudioContext] playFromVerse failed:', e);
            }
        },
        [getReciterInfo],
    );

    const pause = useCallback(async () => {
        try {
            setIsPlaying(false);
            await player.pause();
        } catch (e) {
            if (__DEV__) console.warn('[AudioContext] pause failed:', e);
        }
    }, []);

    const resume = useCallback(async () => {
        try {
            setIsPlaying(true);
            await player.resume();
        } catch (e) {
            setIsPlaying(false);
            if (__DEV__) console.warn('[AudioContext] resume failed:', e);
        }
    }, []);

    const stop = useCallback(async () => {
        try {
            // Save session before clearing playback state
            const sNum = currentSurahNumRef.current;
            const sName = currentSurahNameRef.current;
            const pv = playingVerse;
            if (sNum && pv) {
                const session: AudioSession = {
                    surahNum: sNum,
                    surahName: sName || `Surah ${sNum}`,
                    verse: pv.verse,
                    timestamp: Date.now(),
                    completed: false,
                };
                setLastSession(session);
                AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session)).catch(() => { });
                // Record in reading history
                ReadingHistoryService.addEntry({
                    surah: sNum,
                    surahName: sName || `Surah ${sNum}`,
                    verse: pv.verse,
                    timestamp: Date.now(),
                    source: 'audio',
                }).catch(() => { });
            }
            setIsPlaying(false);
            setPlayingVerse(null);
            await player.stop();
            setPlaylist([]);
            playlistRef.current = [];
            setCurrentSurahNum(null);
            currentSurahNumRef.current = null;
            setCurrentSurahName(null);
            currentSurahNameRef.current = null;
        } catch (e) {
            if (__DEV__) console.warn('[AudioContext] stop failed:', e);
        }
    }, [playingVerse]);

    const dismissSession = useCallback(() => {
        setLastSession(null);
        AsyncStorage.removeItem(LAST_SESSION_KEY).catch(() => { });
    }, []);

    // Clear lastSession when new playback starts
    useEffect(() => {
        if (playingVerse) {
            setLastSession(null);
        }
    }, [playingVerse]);

    const value: AudioContextType = {
        playingVerse,
        isPlaying,
        currentSurahNum,
        currentSurahName,
        playlist,
        lastCompletedPlayback,
        lastSession,
        playVerse,
        playSurah,
        playFromVerse,
        pause,
        resume,
        stop,
        dismissSession,
    };

    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

/**
 * Khatma Context — Surah-Based Sequential Reading
 * User reads one surah at a time (always from verse 1). Juz progress auto-derives.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JUZ_DATA } from '../data/khatmaData';
import { useAuth } from '../../auth/infrastructure/AuthContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

// First N Juz are free, then premium required
const FREE_JUZ_LIMIT = 2;

// ─── Surah metadata (name + Arabic) for the 114 surahs ─────────────────────
// Minimal inline list — only what the reading card needs.
const SURAH_NAMES: { number: number; english: string; arabic: string; verses: number }[] = [
    { number: 1, english: 'Al-Fatiha', arabic: 'الفاتحة', verses: 7 },
    { number: 2, english: 'Al-Baqarah', arabic: 'البقرة', verses: 286 },
    { number: 3, english: 'Al-Imran', arabic: 'آل عمران', verses: 200 },
    { number: 4, english: 'An-Nisa', arabic: 'النساء', verses: 176 },
    { number: 5, english: "Al-Ma'idah", arabic: 'المائدة', verses: 120 },
    { number: 6, english: "Al-An'am", arabic: 'الأنعام', verses: 165 },
    { number: 7, english: "Al-A'raf", arabic: 'الأعراف', verses: 206 },
    { number: 8, english: 'Al-Anfal', arabic: 'الأنفال', verses: 75 },
    { number: 9, english: 'At-Tawbah', arabic: 'التوبة', verses: 129 },
    { number: 10, english: 'Yunus', arabic: 'يونس', verses: 109 },
    { number: 11, english: 'Hud', arabic: 'هود', verses: 123 },
    { number: 12, english: 'Yusuf', arabic: 'يوسف', verses: 111 },
    { number: 13, english: "Ar-Ra'd", arabic: 'الرعد', verses: 43 },
    { number: 14, english: 'Ibrahim', arabic: 'إبراهيم', verses: 52 },
    { number: 15, english: 'Al-Hijr', arabic: 'الحجر', verses: 99 },
    { number: 16, english: 'An-Nahl', arabic: 'النحل', verses: 128 },
    { number: 17, english: "Al-Isra'", arabic: 'الإسراء', verses: 111 },
    { number: 18, english: 'Al-Kahf', arabic: 'الكهف', verses: 110 },
    { number: 19, english: 'Maryam', arabic: 'مريم', verses: 98 },
    { number: 20, english: 'Ta-Ha', arabic: 'طه', verses: 135 },
    { number: 21, english: 'Al-Anbiya', arabic: 'الأنبياء', verses: 112 },
    { number: 22, english: 'Al-Hajj', arabic: 'الحج', verses: 78 },
    { number: 23, english: "Al-Mu'minun", arabic: 'المؤمنون', verses: 118 },
    { number: 24, english: 'An-Nur', arabic: 'النور', verses: 64 },
    { number: 25, english: 'Al-Furqan', arabic: 'الفرقان', verses: 77 },
    { number: 26, english: "Ash-Shu'ara", arabic: 'الشعراء', verses: 227 },
    { number: 27, english: 'An-Naml', arabic: 'النمل', verses: 93 },
    { number: 28, english: 'Al-Qasas', arabic: 'القصص', verses: 88 },
    { number: 29, english: 'Al-Ankabut', arabic: 'العنكبوت', verses: 69 },
    { number: 30, english: 'Ar-Rum', arabic: 'الروم', verses: 60 },
    { number: 31, english: 'Luqman', arabic: 'لقمان', verses: 34 },
    { number: 32, english: 'As-Sajdah', arabic: 'السجدة', verses: 30 },
    { number: 33, english: 'Al-Ahzab', arabic: 'الأحزاب', verses: 73 },
    { number: 34, english: "Saba'", arabic: 'سبأ', verses: 54 },
    { number: 35, english: 'Fatir', arabic: 'فاطر', verses: 45 },
    { number: 36, english: 'Ya-Sin', arabic: 'يس', verses: 83 },
    { number: 37, english: 'As-Saffat', arabic: 'الصافات', verses: 182 },
    { number: 38, english: 'Sad', arabic: 'ص', verses: 88 },
    { number: 39, english: 'Az-Zumar', arabic: 'الزمر', verses: 75 },
    { number: 40, english: 'Ghafir', arabic: 'غافر', verses: 85 },
    { number: 41, english: 'Fussilat', arabic: 'فصلت', verses: 54 },
    { number: 42, english: 'Ash-Shura', arabic: 'الشورى', verses: 53 },
    { number: 43, english: 'Az-Zukhruf', arabic: 'الزخرف', verses: 89 },
    { number: 44, english: 'Ad-Dukhan', arabic: 'الدخان', verses: 59 },
    { number: 45, english: 'Al-Jathiyah', arabic: 'الجاثية', verses: 37 },
    { number: 46, english: 'Al-Ahqaf', arabic: 'الأحقاف', verses: 35 },
    { number: 47, english: 'Muhammad', arabic: 'محمد', verses: 38 },
    { number: 48, english: 'Al-Fath', arabic: 'الفتح', verses: 29 },
    { number: 49, english: 'Al-Hujurat', arabic: 'الحجرات', verses: 18 },
    { number: 50, english: 'Qaf', arabic: 'ق', verses: 45 },
    { number: 51, english: 'Adh-Dhariyat', arabic: 'الذاريات', verses: 60 },
    { number: 52, english: 'At-Tur', arabic: 'الطور', verses: 49 },
    { number: 53, english: 'An-Najm', arabic: 'النجم', verses: 62 },
    { number: 54, english: 'Al-Qamar', arabic: 'القمر', verses: 55 },
    { number: 55, english: 'Ar-Rahman', arabic: 'الرحمن', verses: 78 },
    { number: 56, english: "Al-Waqi'ah", arabic: 'الواقعة', verses: 96 },
    { number: 57, english: 'Al-Hadid', arabic: 'الحديد', verses: 29 },
    { number: 58, english: 'Al-Mujadila', arabic: 'المجادلة', verses: 22 },
    { number: 59, english: 'Al-Hashr', arabic: 'الحشر', verses: 24 },
    { number: 60, english: 'Al-Mumtahina', arabic: 'الممتحنة', verses: 13 },
    { number: 61, english: 'As-Saff', arabic: 'الصف', verses: 14 },
    { number: 62, english: "Al-Jumu'ah", arabic: 'الجمعة', verses: 11 },
    { number: 63, english: 'Al-Munafiqun', arabic: 'المنافقون', verses: 11 },
    { number: 64, english: 'At-Taghabun', arabic: 'التغابن', verses: 18 },
    { number: 65, english: 'At-Talaq', arabic: 'الطلاق', verses: 12 },
    { number: 66, english: 'At-Tahrim', arabic: 'التحريم', verses: 12 },
    { number: 67, english: 'Al-Mulk', arabic: 'الملك', verses: 30 },
    { number: 68, english: 'Al-Qalam', arabic: 'القلم', verses: 52 },
    { number: 69, english: 'Al-Haqqah', arabic: 'الحاقة', verses: 52 },
    { number: 70, english: "Al-Ma'arij", arabic: 'المعارج', verses: 44 },
    { number: 71, english: 'Nuh', arabic: 'نوح', verses: 28 },
    { number: 72, english: 'Al-Jinn', arabic: 'الجن', verses: 28 },
    { number: 73, english: 'Al-Muzzammil', arabic: 'المزمل', verses: 20 },
    { number: 74, english: 'Al-Muddaththir', arabic: 'المدثر', verses: 56 },
    { number: 75, english: 'Al-Qiyamah', arabic: 'القيامة', verses: 40 },
    { number: 76, english: 'Al-Insan', arabic: 'الإنسان', verses: 31 },
    { number: 77, english: 'Al-Mursalat', arabic: 'المرسلات', verses: 50 },
    { number: 78, english: "An-Naba'", arabic: 'النبأ', verses: 40 },
    { number: 79, english: "An-Nazi'at", arabic: 'النازعات', verses: 46 },
    { number: 80, english: 'Abasa', arabic: 'عبس', verses: 42 },
    { number: 81, english: 'At-Takwir', arabic: 'التكوير', verses: 29 },
    { number: 82, english: 'Al-Infitar', arabic: 'الانفطار', verses: 19 },
    { number: 83, english: 'Al-Mutaffifin', arabic: 'المطففين', verses: 36 },
    { number: 84, english: 'Al-Inshiqaq', arabic: 'الانشقاق', verses: 25 },
    { number: 85, english: 'Al-Buruj', arabic: 'البروج', verses: 22 },
    { number: 86, english: 'At-Tariq', arabic: 'الطارق', verses: 17 },
    { number: 87, english: "Al-A'la", arabic: 'الأعلى', verses: 19 },
    { number: 88, english: 'Al-Ghashiyah', arabic: 'الغاشية', verses: 26 },
    { number: 89, english: 'Al-Fajr', arabic: 'الفجر', verses: 30 },
    { number: 90, english: 'Al-Balad', arabic: 'البلد', verses: 20 },
    { number: 91, english: 'Ash-Shams', arabic: 'الشمس', verses: 15 },
    { number: 92, english: 'Al-Layl', arabic: 'الليل', verses: 21 },
    { number: 93, english: 'Ad-Duha', arabic: 'الضحى', verses: 11 },
    { number: 94, english: 'Ash-Sharh', arabic: 'الشرح', verses: 8 },
    { number: 95, english: 'At-Tin', arabic: 'التين', verses: 8 },
    { number: 96, english: "Al-'Alaq", arabic: 'العلق', verses: 19 },
    { number: 97, english: 'Al-Qadr', arabic: 'القدر', verses: 5 },
    { number: 98, english: 'Al-Bayyinah', arabic: 'البينة', verses: 8 },
    { number: 99, english: 'Az-Zalzalah', arabic: 'الزلزلة', verses: 8 },
    { number: 100, english: "Al-'Adiyat", arabic: 'العاديات', verses: 11 },
    { number: 101, english: "Al-Qari'ah", arabic: 'القارعة', verses: 11 },
    { number: 102, english: 'At-Takathur', arabic: 'التكاثر', verses: 8 },
    { number: 103, english: "Al-'Asr", arabic: 'العصر', verses: 3 },
    { number: 104, english: 'Al-Humazah', arabic: 'الهمزة', verses: 9 },
    { number: 105, english: 'Al-Fil', arabic: 'الفيل', verses: 5 },
    { number: 106, english: 'Quraysh', arabic: 'قريش', verses: 4 },
    { number: 107, english: "Al-Ma'un", arabic: 'الماعون', verses: 7 },
    { number: 108, english: 'Al-Kawthar', arabic: 'الكوثر', verses: 3 },
    { number: 109, english: 'Al-Kafirun', arabic: 'الكافرون', verses: 6 },
    { number: 110, english: 'An-Nasr', arabic: 'النصر', verses: 3 },
    { number: 111, english: 'Al-Masad', arabic: 'المسد', verses: 5 },
    { number: 112, english: 'Al-Ikhlas', arabic: 'الإخلاص', verses: 4 },
    { number: 113, english: 'Al-Falaq', arabic: 'الفلق', verses: 5 },
    { number: 114, english: 'An-Nas', arabic: 'الناس', verses: 6 },
];

export function getSurahMeta(surahNumber: number) {
    return SURAH_NAMES.find(s => s.number === surahNumber) ?? SURAH_NAMES[0];
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface KhatmaState {
    completedSurahs: number[];  // e.g. [1, 2, 3] = Fatiha, Baqarah, Imran done
    year: number;
    lastProgressDate?: string;
    currentRound: number;
    completedRounds: number[];
    streakCount: number;
}

export interface SurahMeta {
    number: number;
    english: string;
    arabic: string;
    verses: number;
}

interface KhatmaContextType {
    // Surah-level
    completedSurahs: number[];
    nextSurah: SurahMeta;
    markSurahComplete: (surahNumber: number) => Promise<void>;
    unmarkSurah: (surahNumber: number) => Promise<void>;

    // Juz-level (auto-derived)
    completedJuz: number[];
    currentJuz: number;         // The Juz the user is currently reading in

    // Global
    isComplete: boolean;
    totalPagesRead: number;
    loading: boolean;
    resetKhatma: () => Promise<void>;
    startNextRound: () => Promise<void>;
    streakDays: number;
    currentRound: number;
    completedRounds: number[];
    isGated: boolean;           // true when premium required (completed >= FREE_JUZ_LIMIT and not pro)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive which Juz are complete from the list of completed surahs.
 * A Juz is complete when ALL surahs from 1..endSurahNumber are complete
 * (since reading is sequential, if endSurahNumber is done, everything before it is too).
 */
function deriveCompletedJuz(completedSurahs: number[]): number[] {
    if (completedSurahs.length === 0) return [];
    const highestCompleted = Math.max(...completedSurahs);
    return JUZ_DATA
        .filter(juz => juz.endSurahNumber <= highestCompleted)
        .map(juz => juz.juzNumber);
}

/**
 * Which Juz is the user currently reading in?
 * Based on the next surah to read.
 */
function deriveCurrentJuz(nextSurahNumber: number): number {
    const juz = JUZ_DATA.find(j =>
        nextSurahNumber >= j.startSurahNumber && nextSurahNumber <= j.endSurahNumber
    );
    return juz?.juzNumber ?? 1;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'khatma_progress';
const getStorageKey = (year: number) => `${STORAGE_KEY}_${year}`;
const todayDateString = () => new Date().toISOString().split('T')[0];

// ─── Context ─────────────────────────────────────────────────────────────────

const KhatmaContext = createContext<KhatmaContextType | undefined>(undefined);

export const useKhatma = (): KhatmaContextType => {
    const context = useContext(KhatmaContext);
    if (!context) {
        throw new Error('useKhatma must be used within a KhatmaProvider');
    }
    return context;
};

// ─── Provider ────────────────────────────────────────────────────────────────

const INITIAL_STATE = (year: number): KhatmaState => ({
    completedSurahs: [],
    year,
    currentRound: 1,
    completedRounds: [],
    streakCount: 0,
});

export const KhatmaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const currentYear = new Date().getFullYear();
    const { user } = useAuth();
    const prevUidRef = useRef<string | null | undefined>(undefined);

    const [state, setState] = useState<KhatmaState>(INITIAL_STATE(currentYear));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset on auth change
    useEffect(() => {
        const currentUid = user?.id ?? null;
        if (prevUidRef.current === undefined) {
            prevUidRef.current = currentUid;
            return;
        }
        if (currentUid !== prevUidRef.current) {
            prevUidRef.current = currentUid;
            loadProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const loadProgress = async () => {
        try {
            const key = getStorageKey(currentYear);
            const raw = await AsyncStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);

                // Migration: old format had completedJuz, new format has completedSurahs
                if (Array.isArray(parsed.completedJuz) && !Array.isArray(parsed.completedSurahs)) {
                    // Migrate: convert completedJuz to completedSurahs
                    // Find the highest surah number covered by the completed Juz
                    const juzNumbers = parsed.completedJuz as number[];
                    let highestSurah = 0;
                    for (const juzNum of juzNumbers) {
                        const juz = JUZ_DATA.find(j => j.juzNumber === juzNum);
                        if (juz && juz.endSurahNumber > highestSurah) {
                            highestSurah = juz.endSurahNumber;
                        }
                    }
                    const migratedSurahs = Array.from({ length: highestSurah }, (_, i) => i + 1);
                    const migratedState: KhatmaState = {
                        completedSurahs: migratedSurahs,
                        year: parsed.year || currentYear,
                        lastProgressDate: parsed.lastProgressDate,
                        currentRound: parsed.currentRound || 1,
                        completedRounds: parsed.completedRounds || [],
                        streakCount: parsed.streakCount || 0,
                    };
                    setState(migratedState);
                    saveProgress(migratedState);
                    return;
                }

                if (Array.isArray(parsed.completedSurahs)) {
                    setState({
                        completedSurahs: parsed.completedSurahs.filter(
                            (n: number, i: number, arr: number[]) =>
                                typeof n === 'number' && n >= 1 && n <= 114 && arr.indexOf(n) === i
                        ),
                        year: parsed.year || currentYear,
                        lastProgressDate: parsed.lastProgressDate,
                        currentRound: parsed.currentRound || 1,
                        completedRounds: parsed.completedRounds || [],
                        streakCount: parsed.streakCount || 0,
                    });
                } else {
                    setState(INITIAL_STATE(currentYear));
                }
            } else {
                setState(INITIAL_STATE(currentYear));
            }
        } catch (e) {
            if (__DEV__) console.error('[Khatma] Load failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async (newState: KhatmaState) => {
        try {
            await AsyncStorage.setItem(getStorageKey(newState.year), JSON.stringify(newState));
        } catch (e) {
            if (__DEV__) console.error('[Khatma] Save failed:', e);
        }
    };

    // ─── Actions ─────────────────────────────────────────────────────────

    const markSurahComplete = useCallback(async (surahNumber: number) => {
        if (surahNumber < 1 || surahNumber > 114) return;
        setState(prev => {
            if (prev.completedSurahs.includes(surahNumber)) return prev;
            const updated = [...prev.completedSurahs, surahNumber].sort((a, b) => a - b);
            const today = todayDateString();

            // Compute streak: same day = keep, yesterday = increment, older = reset to 1
            let newStreak = 1;
            if (prev.lastProgressDate) {
                const lastDate = new Date(prev.lastProgressDate + 'T00:00:00');
                const todayDate = new Date(today + 'T00:00:00');
                const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
                if (diffDays === 0) {
                    newStreak = Math.max(prev.streakCount, 1); // same day, don't double-count
                } else if (diffDays === 1) {
                    newStreak = prev.streakCount + 1; // consecutive day
                }
                // else: gap > 1 day, reset to 1
            }

            const newState: KhatmaState = {
                ...prev,
                completedSurahs: updated,
                lastProgressDate: today,
                streakCount: newStreak,
            };
            saveProgress(newState);
            return newState;
        });
    }, []);

    const unmarkSurah = useCallback(async (surahNumber: number) => {
        if (surahNumber < 1 || surahNumber > 114) return;
        setState(prev => {
            if (!prev.completedSurahs.includes(surahNumber)) return prev;
            const updated = prev.completedSurahs.filter(n => n !== surahNumber);
            const newState: KhatmaState = {
                ...prev,
                completedSurahs: updated,
            };
            saveProgress(newState);
            return newState;
        });
    }, []);

    const resetKhatma = useCallback(async () => {
        const newState = INITIAL_STATE(currentYear);
        setState(newState);
        await saveProgress(newState);
    }, [currentYear]);

    const startNextRound = useCallback(async () => {
        setState(prev => {
            const newState: KhatmaState = {
                completedSurahs: [],
                year: currentYear,
                currentRound: prev.currentRound + 1,
                completedRounds: [...prev.completedRounds, Date.now()],
                streakCount: prev.streakCount,
                lastProgressDate: prev.lastProgressDate,
            };
            saveProgress(newState);
            return newState;
        });
    }, [currentYear]);

    // ─── Derived values ──────────────────────────────────────────────────

    const completedJuz = useMemo(() => deriveCompletedJuz(state.completedSurahs), [state.completedSurahs]);

    const nextSurahNumber = useMemo(() => {
        for (let i = 1; i <= 114; i++) {
            if (!state.completedSurahs.includes(i)) return i;
        }
        return 114; // all done
    }, [state.completedSurahs]);

    const nextSurah = useMemo(() => getSurahMeta(nextSurahNumber), [nextSurahNumber]);
    const currentJuz = useMemo(() => deriveCurrentJuz(nextSurahNumber), [nextSurahNumber]);
    const isComplete = useMemo(() => state.completedSurahs.length >= 114, [state.completedSurahs]);

    const totalPagesRead = useMemo(() => {
        let total = 0;
        for (const juzNum of completedJuz) {
            const juz = JUZ_DATA.find(j => j.juzNumber === juzNum);
            total += juz?.totalPages ?? 20;
        }
        return total;
    }, [completedJuz]);

    // Sync khatma data to iOS widget
    useEffect(() => {
        WidgetBridge.setKhatma({
            completedJuz: completedJuz.length,
            totalJuz: 30,
            completedSurahs: state.completedSurahs.length,
        });
    }, [completedJuz.length, state.completedSurahs.length]);

    // Juz-based premium gate: free for first 2 Juz, then premium required
    const { isPro, loading: proLoading } = usePro();
    const isGated = useMemo(() => {
        if (proLoading) return false; // Don't gate while checking subscription
        if (isPro) return false;
        return completedJuz.length >= FREE_JUZ_LIMIT;
    }, [isPro, proLoading, completedJuz]);


    // Streak
    const streakDays = useMemo(() => {
        if (!state.lastProgressDate) return 0;
        const lastDate = new Date(state.lastProgressDate + 'T00:00:00');
        const today = new Date(todayDateString() + 'T00:00:00');
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays === 0) return Math.max(state.streakCount, 1);
        if (diffDays === 1) return state.streakCount + 1;
        return 0;
    }, [state.lastProgressDate, state.streakCount]);

    const value: KhatmaContextType = {
        completedSurahs: state.completedSurahs,
        nextSurah,
        markSurahComplete,
        unmarkSurah,
        completedJuz,
        currentJuz,
        isComplete,
        totalPagesRead,
        loading,
        resetKhatma,
        startNextRound,
        streakDays,
        currentRound: state.currentRound,
        completedRounds: state.completedRounds,
        isGated,
    };

    return (
        <KhatmaContext.Provider value={value}>
            {children}
        </KhatmaContext.Provider>
    );
};

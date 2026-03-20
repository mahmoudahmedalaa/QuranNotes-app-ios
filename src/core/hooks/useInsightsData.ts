import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useStreaks } from '../../features/auth/infrastructure/StreakContext';
import { useKhatma } from '../../features/khatma/infrastructure/KhatmaContext';
import { useAdhkar } from '../../features/adhkar/infrastructure/AdhkarContext';
import { useRepositories } from '../di/RepositoryContext';
import { useAuth } from '../../features/auth/infrastructure/AuthContext';
import { Colors } from '../theme/DesignSystem';
import { Recording } from '../domain/entities/Recording';
import { Note } from '../../features/notes/domain/Note';
import { TimeframePeriod } from '../../shared/components/TimeframeSelector';
import { ReadingActivityLog } from '../infrastructure/ReadingActivityLog';
import TadabburRepository from '../../features/tadabbur/data/TadabburRepository';
import { TadabburSession } from '../../features/tadabbur/domain/entities/Reflection';

// ── Smart time formatting ────────────────────────────────────────────
export function formatTime(totalMinutes: number): string {
    if (totalMinutes <= 0) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    if (totalMinutes < 1440) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const d = Math.floor(totalMinutes / 1440);
    const h = Math.floor((totalMinutes % 1440) / 60);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

// ── Date filtering helper ──────────────────────────────────────────
function getCutoffDate(period: TimeframePeriod): Date | null {
    if (period === 'all') return null;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (period === '7d' ? 7 : 30));
    return cutoff;
}


export interface InsightMetrics {
    dailyActivity: { value: number; label: string }[];
    heatmapData: { date: string; count: number }[];
    topicBreakdown: {
        value: number;
        color: string;
        text: string;
        label?: string;
        minutes?: number;
        focused?: boolean;
    }[];
    filteredTotalTime: string;
    stats: {
        currentStreak: number;
        longestStreak: number;
        totalTimeMinutes: number;
        totalTimeFormatted: string;
        pagesRead: number;
        notesCount: number;
        recordingsCount: number;
        totalRecordingMinutes: number;
        favoritesCount: number;
        tadabburSessions: number;
        tadabburMinutes: number;
    };
    loading: boolean;
}

export const useInsightsData = (breakdownTimeframe: TimeframePeriod = 'all'): InsightMetrics => {
    const { streak } = useStreaks();
    const { totalPagesRead, completedJuz, completedSurahs, readingLog } = useKhatma();
    const { getCompletionPercentage } = useAdhkar();
    const { recordingRepo, noteRepo } = useRepositories();
    const { user } = useAuth();
    const uid = user?.id || 'anonymous';
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [tadabburSessions, setTadabburSessions] = useState<TadabburSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [fetchedRecordings, fetchedNotes, fetchedTadabbur] = await Promise.all([
                recordingRepo.getAllRecordings(),
                noteRepo.getAllNotes(),
                TadabburRepository.getSessions(uid),
            ]);
            setRecordings(fetchedRecordings);
            setNotes(fetchedNotes);
            setTadabburSessions(fetchedTadabbur);
        } catch (error) {
            if (__DEV__) console.error('Failed to fetch insight data:', error);
        } finally {
            setLoading(false);
        }
    }, [recordingRepo, noteRepo, uid]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData]),
    );

    // ── Filtered data for breakdown ────────────────────────────────
    const filteredRecordings = useMemo(() => {
        const cutoff = getCutoffDate(breakdownTimeframe);
        if (!cutoff) return recordings;
        return recordings.filter(r => new Date(r.createdAt) >= cutoff);
    }, [recordings, breakdownTimeframe]);

    const filteredNotes = useMemo(() => {
        const cutoff = getCutoffDate(breakdownTimeframe);
        if (!cutoff) return notes;
        return notes.filter(n => new Date(n.createdAt) >= cutoff);
    }, [notes, breakdownTimeframe]);

    const filteredTadabbur = useMemo(() => {
        const cutoff = getCutoffDate(breakdownTimeframe);
        if (!cutoff) return tadabburSessions;
        return tadabburSessions.filter(s => new Date(s.createdAt) >= cutoff);
    }, [tadabburSessions, breakdownTimeframe]);

    // Pages read filtered by timeframe using actual date-stamped reading log
    const filteredPagesRead = useMemo(() => {
        // Always use the readingLog if it has data — it's the source of truth
        // for date-aware filtering. getPagesInRange(log, null) sums ALL entries.
        if (Object.keys(readingLog).length > 0) {
            const cutoff = getCutoffDate(breakdownTimeframe);
            return ReadingActivityLog.getPagesInRange(readingLog, cutoff);
        }
        // Fallback if no readingLog yet
        return totalPagesRead;
    }, [totalPagesRead, breakdownTimeframe, readingLog]);

    // 1. Daily Activity (Last 7 Days)
    const getDailyActivity = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityMap = new Map<string, number>();
        const today = new Date();
        const result: { date: string; label: string; value: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            activityMap.set(dateStr, 0);
            result.push({ date: dateStr, label: days[d.getDay()], value: 0 });
        }

        recordings.forEach(r => {
            const rd = new Date(r.createdAt);
            const dateStr = isNaN(rd.getTime()) ? '' : rd.toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                const mins = Math.round((r.duration || 0) / 60);
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + mins);
            }
        });

        notes.forEach(n => {
            const nd = new Date(n.updatedAt);
            const dateStr = isNaN(nd.getTime()) ? '' : nd.toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 5);
            }
        });

        // Tadabbur sessions
        tadabburSessions.forEach(s => {
            const sd = new Date(s.createdAt);
            const dateStr = isNaN(sd.getTime()) ? '' : sd.toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                const mins = Math.max(1, Math.round((s.durationSeconds || 0) / 60));
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + mins);
            }
        });

        if (totalPagesRead > 0 && streak?.activityHistory) {
            const last7Dates = Array.from(activityMap.keys());
            const activeDatesIn7 = last7Dates.filter(d => (streak.activityHistory[d] || 0) > 0);

            if (activeDatesIn7.length > 0) {
                const totalReadingMins = totalPagesRead * 2;
                const minsPerDay = Math.round(totalReadingMins / Math.max(activeDatesIn7.length, 7));
                activeDatesIn7.forEach(dateStr => {
                    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + minsPerDay);
                });
            } else {
                const todayStr = today.toISOString().split('T')[0];
                if (activityMap.has(todayStr)) {
                    const readingMins = Math.min(totalPagesRead * 2, 30);
                    activityMap.set(todayStr, (activityMap.get(todayStr) || 0) + readingMins);
                }
            }
        }

        const adhkarPeriods: ('morning' | 'evening' | 'night')[] = ['morning', 'evening', 'night'];
        const todayStr = today.toISOString().split('T')[0];
        adhkarPeriods.forEach(period => {
            const pct = getCompletionPercentage(period);
            if (pct > 0 && activityMap.has(todayStr)) {
                activityMap.set(todayStr, (activityMap.get(todayStr) || 0) + Math.round(5 * (pct / 100)));
            }
        });

        return result.map(item => ({
            label: item.label,
            value: activityMap.get(item.date) || 0,
        }));
    };

    // 2. Heatmap Data
    const getHeatmapData = () => {
        const heatmap = new Map<string, number>();

        if (streak?.activityHistory) {
            for (const [date, count] of Object.entries(streak.activityHistory)) {
                heatmap.set(date, (heatmap.get(date) || 0) + count);
            }
        }

        if (completedSurahs.length > 0 || totalPagesRead > 0) {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            for (const juzNum of completedJuz) {
                const d = new Date(year, month, Math.min(juzNum, new Date(year, month + 1, 0).getDate()));
                const dateStr = d.toISOString().split('T')[0];
                if (!heatmap.has(dateStr)) {
                    heatmap.set(dateStr, 3);
                }
            }
        }

        // Tadabbur sessions contribute to heatmap
        tadabburSessions.forEach(s => {
            const sd = new Date(s.createdAt);
            const dateStr = isNaN(sd.getTime()) ? '' : sd.toISOString().split('T')[0];
            if (dateStr) {
                heatmap.set(dateStr, (heatmap.get(dateStr) || 0) + 1);
            }
        });

        return Array.from(heatmap.entries()).map(([date, count]) => ({ date, count }));
    };

    // 3. Topic Breakdown — uses FILTERED data with actual TIME (minutes) per category
    //    Both the donut proportions AND the center total derive from the same values.
    const { topicBreakdown, filteredTotalTime } = useMemo(() => {
        // ─ Actual minutes per category ────────────────────────────
        const readingMins = filteredPagesRead * 2; // ~2 min per page

        const recordingMins = Math.ceil(
            filteredRecordings.reduce((acc, r) => acc + (r.duration || 0), 0) / 60,
        );

        const notesMins = filteredNotes.length * 5; // ~5 min per note

        // Adhkar: estimate based on today's completion (not easily filterable by date yet)
        const adhkarPeriods: ('morning' | 'evening' | 'night')[] = ['morning', 'evening', 'night'];
        const adhkarMins = adhkarPeriods.reduce((sum, period) => {
            const pct = getCompletionPercentage(period);
            // Each completed period ≈ 5 min, proportional
            return sum + Math.round(5 * (pct / 100));
        }, 0);

        // Tadabbur: actual duration from sessions
        const tadabburMins = Math.ceil(
            filteredTadabbur.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60,
        );

        const totalMins = readingMins + recordingMins + notesMins + adhkarMins + tadabburMins;

        if (totalMins === 0) {
            return {
                topicBreakdown: [{ value: 1, color: '#E5E7EB', text: '0%', label: 'No data', minutes: 0 }],
                filteredTotalTime: 0,
            };
        }

        const pct = (v: number) => Math.round((v / totalMins) * 100);

        // Minimum visible value: ensure tiny slices (like a 2-min recording in
        // 670 total mins) still get a visible sliver in the donut.
        // We use raw minutes as values (PieChart sizes proportionally to value),
        // but enforce a floor of 2% of total so nothing disappears.
        const minVisible = Math.ceil(totalMins * 0.02);
        const donutVal = (v: number) => (v > 0 ? Math.max(v, minVisible) : 0);

        const breakdown = [
            { value: donutVal(readingMins), color: Colors.chartReading, text: `${pct(readingMins)}%`, label: 'Reading', minutes: readingMins },
            { value: donutVal(adhkarMins), color: Colors.chartAdhkar, text: `${pct(adhkarMins)}%`, label: 'Adhkar', minutes: adhkarMins },
            { value: donutVal(recordingMins), color: Colors.chartRecording, text: `${pct(recordingMins)}%`, label: 'Recording', minutes: recordingMins },
            { value: donutVal(notesMins), color: Colors.chartNotes, text: `${pct(notesMins)}%`, label: 'Notes', minutes: notesMins },
            { value: donutVal(tadabburMins), color: Colors.chartTadabbur, text: `${pct(tadabburMins)}%`, label: 'Tadabbur', minutes: tadabburMins },
        ];

        return { topicBreakdown: breakdown, filteredTotalTime: totalMins };
    }, [filteredRecordings, filteredNotes, filteredPagesRead, filteredTadabbur, getCompletionPercentage]);

    // 4. Overall Stats (always all-time)
    const totalRecordingSeconds = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
    const totalTadabburSeconds = tadabburSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const totalTimeMinutes = useMemo(() => {
        const recSecs = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
        const noteSecs = notes.length * 5 * 60;
        const khatmaSecs = totalPagesRead * 2 * 60;
        const tadabburSecs = tadabburSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        return Math.round((recSecs + noteSecs + khatmaSecs + tadabburSecs) / 60);
    }, [recordings, notes, totalPagesRead, tadabburSessions]);

    return {
        dailyActivity: getDailyActivity(),
        heatmapData: getHeatmapData(),
        topicBreakdown,
        filteredTotalTime: formatTime(filteredTotalTime),
        stats: {
            currentStreak: streak?.currentStreak || 0,
            longestStreak: streak?.longestStreak || 0,
            totalTimeMinutes,
            totalTimeFormatted: formatTime(totalTimeMinutes),
            pagesRead: totalPagesRead,
            notesCount: notes.length,
            recordingsCount: recordings.length,
            totalRecordingMinutes: Math.round(totalRecordingSeconds / 60),
            favoritesCount: completedSurahs.length,
            tadabburSessions: tadabburSessions.length,
            tadabburMinutes: Math.round(totalTadabburSeconds / 60),
        },
        loading,
    };
};

import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useStreaks } from '../../features/auth/infrastructure/StreakContext';
import { useKhatma } from '../../features/khatma/infrastructure/KhatmaContext';
import { useAdhkar } from '../../features/adhkar/infrastructure/AdhkarContext';
import { useRepositories } from '../di/RepositoryContext';
import { Colors } from '../theme/DesignSystem';
import { Recording } from '../domain/entities/Recording';
import { Note } from '../../features/notes/domain/Note';
import { TimeframePeriod } from '../../shared/components/TimeframeSelector';

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

/** Count calendar days from the user's first activity to now */
function getTotalCalendarDays(activityHistory: Record<string, number> | undefined): number {
    if (!activityHistory || Object.keys(activityHistory).length === 0) return 1;
    const dates = Object.keys(activityHistory).map(d => new Date(d).getTime());
    const earliest = Math.min(...dates);
    const now = Date.now();
    return Math.max(Math.ceil((now - earliest) / (1000 * 60 * 60 * 24)), 1);
}

export interface InsightMetrics {
    dailyActivity: { value: number; label: string }[];
    heatmapData: { date: string; count: number }[];
    topicBreakdown: {
        value: number;
        color: string;
        text: string;
        label?: string;
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
    };
    loading: boolean;
}

export const useInsightsData = (breakdownTimeframe: TimeframePeriod = 'all'): InsightMetrics => {
    const { streak } = useStreaks();
    const { totalPagesRead, completedJuz, completedSurahs } = useKhatma();
    const { getCompletionPercentage } = useAdhkar();
    const { recordingRepo, noteRepo } = useRepositories();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [fetchedRecordings, fetchedNotes] = await Promise.all([
                recordingRepo.getAllRecordings(),
                noteRepo.getAllNotes(),
            ]);
            setRecordings(fetchedRecordings);
            setNotes(fetchedNotes);
        } catch (error) {
            if (__DEV__) console.error('Failed to fetch insight data:', error);
        } finally {
            setLoading(false);
        }
    }, [recordingRepo, noteRepo]);

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

    // Estimate pages read for the timeframe using activity-history day counts
    const filteredPagesRead = useMemo(() => {
        if (breakdownTimeframe === 'all') return totalPagesRead;
        const cutoff = getCutoffDate(breakdownTimeframe);
        if (!cutoff) return totalPagesRead;

        const history = streak?.activityHistory || {};
        const allActiveDays = Object.keys(history).filter(d => (history[d] || 0) > 0);
        if (allActiveDays.length === 0) return 0;

        const daysInTimeframe = allActiveDays.filter(d => new Date(d) >= cutoff);
        const ratio = daysInTimeframe.length / allActiveDays.length;
        return Math.round(totalPagesRead * ratio);
    }, [totalPagesRead, breakdownTimeframe, streak?.activityHistory]);

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
            const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                const mins = Math.round((r.duration || 0) / 60);
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + mins);
            }
        });

        notes.forEach(n => {
            const dateStr = new Date(n.updatedAt).toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 5);
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

        return Array.from(heatmap.entries()).map(([date, count]) => ({ date, count }));
    };

    // 3. Topic Breakdown — uses FILTERED data, always shows all 4 categories
    const topicBreakdown = useMemo(() => {
        const khatmaReadingUnits = Math.max(
            Math.floor(filteredPagesRead / 20),
            1, // At least 1 if user has read anything
        );

        const adhkarPeriods: ('morning' | 'evening' | 'night')[] = ['morning', 'evening', 'night'];
        const adhkarUnits = adhkarPeriods.reduce((sum, period) => {
            const pct = getCompletionPercentage(period);
            return sum + (pct > 0 ? Math.ceil(pct / 25) : 0);
        }, 0);

        const totalItems = khatmaReadingUnits + adhkarUnits + filteredRecordings.length + filteredNotes.length;

        if (totalItems === 0) {
            return [
                { value: 1, color: '#E5E7EB', text: '0%', label: 'No data' },
            ];
        }

        const readingPct = Math.round((khatmaReadingUnits / totalItems) * 100);
        const adhkarPct = Math.round((adhkarUnits / totalItems) * 100);
        const recordingPct = Math.round((filteredRecordings.length / totalItems) * 100);
        const notesPct = Math.round((filteredNotes.length / totalItems) * 100);

        // Always show all 4 categories — even if 0%, for consistent legend
        return [
            { value: readingPct, color: Colors.chartReading, text: `${readingPct}%`, label: 'Reading' },
            { value: adhkarPct, color: Colors.chartAdhkar, text: `${adhkarPct}%`, label: 'Adhkar' },
            { value: recordingPct, color: Colors.chartRecording, text: `${recordingPct}%`, label: 'Recording' },
            { value: notesPct, color: Colors.chartNotes, text: `${notesPct}%`, label: 'Notes' },
        ];
    }, [filteredRecordings, filteredNotes, filteredPagesRead, getCompletionPercentage]);

    // Filtered total time for the breakdown donut center
    // For non-"all" timeframes: only include time from date-stamped sources
    // (recordings + notes). Khatma reading has no per-day timestamps so we
    // can only include it accurately for "all time".
    const filteredTotalTime = useMemo(() => {
        const recSecs = filteredRecordings.reduce((acc, r) => acc + (r.duration || 0), 0);
        const noteSecs = filteredNotes.length * 5 * 60;
        if (breakdownTimeframe === 'all') {
            const khatmaSecs = totalPagesRead * 2 * 60;
            return Math.round((recSecs + noteSecs + khatmaSecs) / 60);
        }
        // For 7d/30d: only recordings + notes (we can track these by date)
        return Math.round((recSecs + noteSecs) / 60);
    }, [filteredRecordings, filteredNotes, breakdownTimeframe, totalPagesRead]);

    // 4. Overall Stats (always all-time)
    const totalRecordingSeconds = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
    const totalTimeMinutes = useMemo(() => {
        const recSecs = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
        const noteSecs = notes.length * 5 * 60;
        const khatmaSecs = totalPagesRead * 2 * 60;
        return Math.round((recSecs + noteSecs + khatmaSecs) / 60);
    }, [recordings, notes, totalPagesRead]);

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
        },
        loading,
    };
};

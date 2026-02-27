import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useStreaks } from '../../features/auth/infrastructure/StreakContext';
import { useKhatma } from '../../features/khatma/infrastructure/KhatmaContext';
import { useAdhkar } from '../../features/adhkar/infrastructure/AdhkarContext';
import { useRepositories } from '../di/RepositoryContext';
import { Colors } from '../theme/DesignSystem';
import { Recording } from '../domain/entities/Recording';
import { Note } from '../../features/notes/domain/Note';

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
    stats: {
        currentStreak: number;
        longestStreak: number;
        totalTimeMinutes: number;
        totalTimeFormatted: string;
        pagesRead: number;
        recordingsCount: number;
        totalRecordingMinutes: number;
        favoritesCount: number;
    };
    loading: boolean;
}

export const useInsightsData = (): InsightMetrics => {
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

    // 1. Calculate Activity (Last 7 Days) — distribute reading across active days
    const getDailyActivity = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityMap = new Map<string, number>();
        const today = new Date();
        const result: { date: string; label: string; value: number }[] = [];

        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = days[d.getDay()];

            activityMap.set(dateStr, 0);
            result.push({ date: dateStr, label: dayLabel, value: 0 });
        }

        // Sum durations (Recordings) - explicit duration
        recordings.forEach(r => {
            const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                const mins = Math.round((r.duration || 0) / 60);
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + mins);
            }
        });

        // Sum durations (Notes) - implied 5 mins per note
        notes.forEach(n => {
            const dateStr = new Date(n.updatedAt).toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 5);
            }
        });

        // Distribute Khatma reading across active days (from activityHistory)
        // Instead of dumping all pages on today, spread across days user was active
        if (totalPagesRead > 0 && streak?.activityHistory) {
            const last7Dates = Array.from(activityMap.keys());
            const activeDatesIn7 = last7Dates.filter(d => (streak.activityHistory[d] || 0) > 0);

            if (activeDatesIn7.length > 0) {
                // Estimate: distribute total reading minutes across active days
                const totalReadingMins = totalPagesRead * 2; // ~2 min/page
                const minsPerDay = Math.round(totalReadingMins / Math.max(activeDatesIn7.length, 7));
                activeDatesIn7.forEach(dateStr => {
                    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + minsPerDay);
                });
            } else {
                // Fallback: add to today
                const todayStr = today.toISOString().split('T')[0];
                if (activityMap.has(todayStr)) {
                    const readingMins = Math.min(totalPagesRead * 2, 30); // Cap at 30 to be reasonable
                    activityMap.set(todayStr, (activityMap.get(todayStr) || 0) + readingMins);
                }
            }
        }

        // Add Adhkar session estimate (~5min per completed session)
        const adhkarPeriods: ('morning' | 'evening' | 'night')[] = ['morning', 'evening', 'night'];
        const todayStr = today.toISOString().split('T')[0];
        adhkarPeriods.forEach(period => {
            const pct = getCompletionPercentage(period);
            if (pct > 0 && activityMap.has(todayStr)) {
                const adhkarMins = Math.round(5 * (pct / 100)); // ~5 min for full session
                activityMap.set(todayStr, (activityMap.get(todayStr) || 0) + adhkarMins);
            }
        });

        // Map back to result array
        return result.map(item => ({
            label: item.label,
            value: activityMap.get(item.date) || 0,
        }));
    };

    // 2. Heatmap Data — merge streak activityHistory with Khatma reading days
    const getHeatmapData = () => {
        const heatmap = new Map<string, number>();

        // Add streak activity history
        if (streak?.activityHistory) {
            for (const [date, count] of Object.entries(streak.activityHistory)) {
                heatmap.set(date, (heatmap.get(date) || 0) + count);
            }
        }

        // Add Khatma reading days (each completed juz = activity on that day)
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

        return Array.from(heatmap.entries()).map(([date, count]) => ({
            date,
            count,
        }));
    };

    // 3. Topic Breakdown — Real app features: Reading, Adhkar, Recording, Notes
    const getTopicBreakdown = () => {
        const khatmaReadingUnits = Math.max(completedSurahs.length, Math.floor(totalPagesRead / 20));

        // Calculate Adhkar units from today's completion
        const adhkarPeriods: ('morning' | 'evening' | 'night')[] = ['morning', 'evening', 'night'];
        const adhkarUnits = adhkarPeriods.reduce((sum, period) => {
            const pct = getCompletionPercentage(period);
            return sum + (pct > 0 ? Math.ceil(pct / 25) : 0); // 1 unit per 25% completion
        }, 0);

        const totalItems = khatmaReadingUnits + adhkarUnits + recordings.length + notes.length;

        if (totalItems === 0)
            return [
                { value: 1, color: Colors.chartEmpty, text: '0%', label: 'None' },
            ];

        const readingPct = Math.round((khatmaReadingUnits / totalItems) * 100);
        const adhkarPct = Math.round((adhkarUnits / totalItems) * 100);
        const recordingPct = Math.round((recordings.length / totalItems) * 100);
        const notesPct = Math.round((notes.length / totalItems) * 100);

        return [
            {
                value: readingPct || 0,
                color: Colors.chartReading,
                text: `${readingPct}%`,
                label: 'Reading',
            },
            {
                value: adhkarPct || 0,
                color: Colors.chartReciting,
                text: `${adhkarPct}%`,
                label: 'Adhkar',
            },
            {
                value: recordingPct || 0,
                color: Colors.chartReflection,
                text: `${recordingPct}%`,
                label: 'Recording',
            },
            {
                value: notesPct || 0,
                color: '#60A5FA', // Soft blue for notes
                text: `${notesPct}%`,
                label: 'Notes',
                focused: notesPct > 30,
            },
        ].filter(item => item.value > 0);
    };

    // 4. Total Stats — include all tracked time
    const getTotalTime = () => {
        const recordingSeconds = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
        const noteSeconds = notes.length * 5 * 60; // 5 mins per note
        const khatmaSeconds = totalPagesRead * 2 * 60; // ~2 min per page
        return Math.round((recordingSeconds + noteSeconds + khatmaSeconds) / 60);
    };

    const totalRecordingSeconds = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
    const totalTimeMinutes = getTotalTime();

    return {
        dailyActivity: getDailyActivity(),
        heatmapData: getHeatmapData(),
        topicBreakdown: getTopicBreakdown(),
        stats: {
            currentStreak: streak?.currentStreak || 0,
            longestStreak: streak?.longestStreak || 0,
            totalTimeMinutes,
            totalTimeFormatted: formatTime(totalTimeMinutes),
            pagesRead: totalPagesRead,
            recordingsCount: recordings.length,
            totalRecordingMinutes: Math.round(totalRecordingSeconds / 60),
            favoritesCount: completedSurahs.length,
        },
        loading,
    };
};

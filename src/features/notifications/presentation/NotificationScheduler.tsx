/**
 * NotificationScheduler — Headless component that lives in the provider tree
 * and reactively schedules all push notifications based on user settings and context.
 *
 * 3-Slot Strategy (max 3 notifications/day):
 *   Slot 1 (Daily):     Daily Quran reminder at user-chosen time
 *   Slot 2 (Afternoon): Contextual nudge — Khatma > Streak > Hadith > Re-engagement
 *   Slot 3 (Adhkar):    ONE adhkar reminder — the next upcoming period only
 *
 * Adhkar logic: we pick the single next upcoming window so only 1 adhkar
 * notification fires per day (not 3). Morning wins in the AM, evening in the
 * PM before 9, night after 9 PM / before morning next day.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import { useStreaks } from '../../auth/infrastructure/StreakContext';
import { useKhatma } from '../../khatma/infrastructure/KhatmaContext';
import { NotificationService } from '../infrastructure/NotificationService';

/** Adhkar time windows */
const MORNING_HOUR = 10;
const MORNING_MINUTE = 30;
const EVENING_HOUR = 19;   // 7:30 PM — safely after Maghrib, avoids daily reminder collision
const EVENING_MINUTE = 30;
const NIGHT_HOUR = 21;
const NIGHT_MINUTE = 0;

/** Contextual nudge fires in the afternoon */
const CONTEXTUAL_HOUR = 14;
const CONTEXTUAL_MINUTE = 0;

/**
 * Returns the single adhkar period whose reminder should fire NEXT from now.
 * Each iOS DAILY trigger fires once every 24h at its configured time, so we
 * only schedule one — the next one the user hasn't seen yet today.
 *
 * Order:  morning (10:30) → evening (19:30) → night (21:00) → morning next day
 */
function nextAdhkarPeriod(): 'morning' | 'evening' | 'night' {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const morningMinutes = MORNING_HOUR * 60 + MORNING_MINUTE;
    const eveningMinutes = EVENING_HOUR * 60 + EVENING_MINUTE;
    const nightMinutes = NIGHT_HOUR * 60 + NIGHT_MINUTE;

    if (totalMinutes < morningMinutes) return 'morning';
    if (totalMinutes < eveningMinutes) return 'evening';
    if (totalMinutes < nightMinutes) return 'night';
    // Past night time — schedule morning for tomorrow (still fires correctly
    // as a DAILY trigger at 10:30 next morning)
    return 'morning';
}

export function NotificationScheduler() {
    const { settings } = useSettings();
    const { streak } = useStreaks();
    const { completedJuz, loading: khatmaLoading } = useKhatma();

    // Prevent redundant scheduling during the same render cycle
    const schedulingRef = useRef(false);
    const lastScheduledRef = useRef('');

    useEffect(() => {
        if (khatmaLoading) return;

        // Create a fingerprint of all values that affect scheduling
        const fingerprint = [
            settings.dailyReminderEnabled,
            settings.reminderHour,
            settings.reminderMinute,
            settings.khatmaReminderEnabled,
            settings.streakReminderEnabled,
            settings.adhkarReminderEnabled,
            settings.hadithNotificationsEnabled,
            streak.currentStreak,
            completedJuz.length,
        ].join('|');

        // Skip if nothing changed
        if (fingerprint === lastScheduledRef.current) return;
        lastScheduledRef.current = fingerprint;

        scheduleAllNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        settings.dailyReminderEnabled,
        settings.reminderHour,
        settings.reminderMinute,
        settings.khatmaReminderEnabled,
        settings.streakReminderEnabled,
        settings.adhkarReminderEnabled,
        settings.hadithNotificationsEnabled,
        streak.currentStreak,
        completedJuz.length,
        khatmaLoading,
    ]);

    // Re-schedule when app comes to foreground (catches midnight rollover).
    // We clear the fingerprint AND call scheduleAllNotifications directly so
    // the adhkar period is re-evaluated against the current time.
    const scheduleRef = useRef(scheduleAllNotifications);
    scheduleRef.current = scheduleAllNotifications;

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                lastScheduledRef.current = ''; // Force re-evaluation on next dep change
                scheduleRef.current();         // Also re-run immediately for time-based adhkar
            }
        });
        return () => subscription.remove();
    }, []);

    async function scheduleAllNotifications() {
        if (schedulingRef.current) return;
        schedulingRef.current = true;

        try {
            // Cancel everything first for a clean slate
            await NotificationService.cancelAllReminders();

            // ── Slot 1: Daily Quran Reminder ─────────────────────────
            if (settings.dailyReminderEnabled) {
                await NotificationService.scheduleDailyReminder(
                    settings.reminderHour,
                    settings.reminderMinute,
                );
            }

            // ── Slot 2: Contextual Nudge ─────────────────────────────
            // Schedule if at least one contextual category is enabled
            const hasContextual = settings.khatmaReminderEnabled
                || settings.streakReminderEnabled
                || settings.hadithNotificationsEnabled;
            if (hasContextual) {
                const juzRemaining = 30 - completedJuz.length;
                await NotificationService.scheduleContextualNudge({
                    juzRemaining,
                    streak: streak.currentStreak,
                    khatmaEnabled: settings.khatmaReminderEnabled,
                    streakEnabled: settings.streakReminderEnabled,
                    hadithEnabled: settings.hadithNotificationsEnabled,
                    hour: CONTEXTUAL_HOUR,
                    minute: CONTEXTUAL_MINUTE,
                });
            }

            // ── Slot 3: Adhkar Reminder (ONE per day — next upcoming period) ──
            // We intentionally schedule only the NEXT upcoming adhkar window
            // to keep total daily notifications at max 3 (not 5).
            if (settings.adhkarReminderEnabled) {
                const period = nextAdhkarPeriod();
                const hour = period === 'morning' ? MORNING_HOUR
                    : period === 'evening' ? EVENING_HOUR
                        : NIGHT_HOUR;
                const minute = period === 'morning' ? MORNING_MINUTE
                    : period === 'evening' ? EVENING_MINUTE
                        : NIGHT_MINUTE;
                await NotificationService.scheduleAdhkarReminder(period, hour, minute);
            }


        } catch (error) {
            if (__DEV__) console.warn('NotificationScheduler: failed to schedule', error);
        } finally {
            schedulingRef.current = false;
        }
    }

    // Headless — renders nothing
    return null;
}

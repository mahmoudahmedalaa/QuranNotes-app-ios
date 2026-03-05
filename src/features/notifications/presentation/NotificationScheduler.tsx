/**
 * NotificationScheduler — Headless component that lives in the provider tree
 * and reactively schedules all push notifications based on user settings and context.
 *
 * 3-Slot Strategy (max 3 notifications/day):
 *   Slot 1 (Morning):   Daily Quran reminder at user-chosen time
 *   Slot 2 (Afternoon): Contextual nudge — Khatma > Streak > Re-engagement
 *   Slot 3 (Evening):   Adhkar reminder at Maghrib-ish time
 *   Slot 4 (Morning):   Daily Hadith reminder at user-chosen time (Pro only)
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import { useStreaks } from '../../auth/infrastructure/StreakContext';
import { useKhatma } from '../../khatma/infrastructure/KhatmaContext';
import { NotificationService } from '../infrastructure/NotificationService';

/** Default adhkar times (used when prayer times aren't available) */
const DEFAULT_MORNING_HOUR = 6;
const DEFAULT_MORNING_MINUTE = 0;
const DEFAULT_EVENING_HOUR = 18;
const DEFAULT_EVENING_MINUTE = 15;
const DEFAULT_NIGHT_HOUR = 21;
const DEFAULT_NIGHT_MINUTE = 0;

/** Contextual nudge fires in the afternoon */
const CONTEXTUAL_HOUR = 14;
const CONTEXTUAL_MINUTE = 0;

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
            settings.hadithNotificationHour,
            settings.hadithNotificationMinute,
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
        settings.hadithNotificationHour,
        settings.hadithNotificationMinute,
        streak.currentStreak,
        completedJuz.length,
        khatmaLoading,
    ]);

    // Re-schedule when app comes to foreground (catches midnight rollover)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                lastScheduledRef.current = ''; // Force re-evaluation
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
            // Only schedule if at least one contextual category is enabled
            const hasContextual = settings.khatmaReminderEnabled || settings.streakReminderEnabled;
            if (settings.dailyReminderEnabled && hasContextual) {
                const juzRemaining = 30 - completedJuz.length;
                await NotificationService.scheduleContextualNudge({
                    juzRemaining,
                    streak: streak.currentStreak,
                    khatmaEnabled: settings.khatmaReminderEnabled,
                    streakEnabled: settings.streakReminderEnabled,
                    hour: CONTEXTUAL_HOUR,
                    minute: CONTEXTUAL_MINUTE,
                });
            }

            // ── Slot 3: Adhkar Reminders ─────────────────────────────
            if (settings.adhkarReminderEnabled) {
                await NotificationService.scheduleAdhkarReminder(
                    'morning',
                    DEFAULT_MORNING_HOUR,
                    DEFAULT_MORNING_MINUTE,
                );
                await NotificationService.scheduleAdhkarReminder(
                    'evening',
                    DEFAULT_EVENING_HOUR,
                    DEFAULT_EVENING_MINUTE,
                );
                await NotificationService.scheduleAdhkarReminder(
                    'night',
                    DEFAULT_NIGHT_HOUR,
                    DEFAULT_NIGHT_MINUTE,
                );
            }

            // ── Slot 4: Daily Hadith Reminder ────────────────────────
            if (settings.hadithNotificationsEnabled) {
                await NotificationService.scheduleHadithReminder(
                    settings.hadithNotificationHour,
                    settings.hadithNotificationMinute,
                );
            }
        } catch (error) {
            console.warn('NotificationScheduler: failed to schedule', error);
        } finally {
            schedulingRef.current = false;
        }
    }

    // Headless — renders nothing
    return null;
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type NotificationType = 'daily' | 'streak' | 'khatma' | 'adhkar';

export class NotificationService {
    // ── Daily gentle nudges ──────────────────────────────────────────
    private static DAILY_REMINDERS: { title: string; body: string }[] = [
        // Warm, natural nudges (no Quran verses, no em-dashes)
        { title: 'Time for Quran', body: 'A few verses today can bring peace to your whole evening.' },
        { title: 'Your daily reflection', body: 'Even one ayah read with thought is worth more than a hundred read without.' },
        { title: 'Quran time', body: 'The best conversations are the ones between you and Allah\'s words.' },
        { title: 'A moment of peace', body: 'Step away from the noise. Your Quran is waiting.' },
        { title: 'Feed your soul', body: 'Your body ate today. Don\'t forget to nourish your heart too.' },
        { title: 'Just 5 minutes', body: 'That\'s all it takes to reconnect. Open where you left off.' },
        { title: 'Make time for peace', body: 'Reading Quran is more than words on a page. Start with today\'s verse.' },
        { title: 'Open your heart', body: 'The Quran has something for you today. All you have to do is begin.' },
        { title: 'Start fresh today', body: 'Every day is a new chance to connect with the Quran.' },
        { title: 'You\'re still on track', body: 'Progress isn\'t perfection. One ayah today keeps your heart close.' },
        { title: 'Pause and breathe', body: 'Before the world gets loud, let the Quran speak to you first.' },
        { title: 'Your companion', body: 'The Quran is a companion that never leaves you, a light that never dims.' },
        // Gentle motivation
        { title: 'Your quiet moment', body: 'Somewhere between all the noise, there\'s a verse waiting for you.' },
        { title: 'Small steps, big reward', body: 'You don\'t need to read a whole Juz. Just one page today is enough.' },
        { title: 'Back to your bookmark', body: 'You left off somewhere beautiful. Pick up where you stopped.' },
        { title: 'Tonight\'s peace', body: 'End your day with a few verses. Your heart will thank you.' },
        { title: 'A fresh page', body: 'No pressure, no rush. Just you and the Quran whenever you\'re ready.' },
        { title: 'Your daily dose', body: 'A few minutes with the Quran can shift your entire mood.' },
        { title: 'Read at your pace', body: 'There\'s no deadline. Even one verse today counts.' },
        { title: 'Unwind with Quran', body: 'Instead of scrolling, try a verse or two. You\'ll feel the difference.' },
        // Warm connection
        { title: 'Closer today', body: 'Every verse you read brings you a little closer. Open your Quran.' },
        { title: 'Nourish your heart', body: 'The Quran is food for the soul. Take a moment to read.' },
        { title: 'Peaceful reminder', body: 'Your Quran reading is waiting. Even a short session brings barakah.' },
        { title: 'Reflect and connect', body: 'Take a quiet moment today. Read, reflect, and feel the calm.' },
        { title: 'Your evening calm', body: 'Wind down with a few verses tonight. Let the words settle in your heart.' },
        { title: 'A gift to yourself', body: 'Reading Quran is one of the best things you can do for yourself today.' },
        { title: 'Keep the connection', body: 'You\'ve been doing well. Keep the Quran part of your daily rhythm.' },
        { title: 'Gentle reminder', body: 'The Quran is always there for you. All you have to do is open it.' },
        { title: 'Your daily anchor', body: 'Let the Quran ground you today. Just a few minutes can make a difference.' },
        { title: 'Worth your time', body: 'Of all the things competing for your attention, the Quran deserves a moment.' },
    ];

    // ── Re-engagement messages (for users who haven't opened in 3+ days) ──
    private static RE_ENGAGEMENT_REMINDERS: { title: string; body: string }[] = [
        { title: 'We missed you', body: 'Your Quran journey is still here, right where you left it.' },
        { title: 'It\'s been a while', body: 'No guilt, just grace. Open to any page and start fresh.' },
        { title: 'Come back gently', body: 'The door is always open. Even one verse today makes a difference.' },
        { title: 'Still here for you', body: 'Life gets busy, we get it. Your reading is waiting whenever you\'re ready.' },
        { title: 'Pick up anytime', body: 'There\'s no right or wrong time to come back. Today is as good as any.' },
    ];

    // ── Streak-aware messages ────────────────────────────────────────
    private static STREAK_MESSAGES: { title: string; body: (streak: number) => string }[] = [
        { title: 'Keep it going!', body: (s) => `You're on a ${s}-day streak! One verse today keeps it alive.` },
        { title: 'Streak check 🔥', body: (s) => `${s} days straight! Consistency is the most beloved deed, even if small.` },
        { title: 'Momentum builder', body: (s) => `${s} days and counting. Your consistency is building something beautiful.` },
        { title: 'Look at you!', body: (s) => `${s} days with Quran. That's ${s} days of growing closer.` },
        { title: 'Beautiful habit', body: (s) => `${s} straight days of Quran. This is the kind of habit that changes everything.` },
        { title: 'Mashallah!', body: (s) => `${s} days strong! Keep this beautiful connection going.` },
        { title: 'Proud of you', body: (s) => `${s} days in a row. That takes real commitment. Keep it up.` },
        { title: 'Your rhythm', body: (s) => `${s} days of Quran. You've built a rhythm. Just one page to keep it.` },
        { title: 'Day ${s} ✨', body: (s) => `Another day, another verse. ${s} days of consistency is no small thing.` },
        { title: 'Still going!', body: (s) => `${s}-day streak! Your future self will be grateful you kept reading.` },
    ];

    // ── Khatma progress nudges ───────────────────────────────────────
    private static KHATMA_MESSAGES: { title: string; body: (juzRemaining: number) => string }[] = [
        { title: 'Khatma progress', body: (r) => `Only ${r} Juz left to complete the Quran! You've got this.` },
        { title: 'Getting closer', body: (r) => r <= 5 ? `${r} Juz remaining. You can almost see the finish line!` : `${r} Juz remaining. Keep going at your own pace.` },
        { title: 'Your Khatma awaits', body: (r) => `${r} Juz to go. Every page brings you closer to completing the entire Quran.` },
        { title: 'Keep reading!', body: (r) => `${r} Juz left in your Khatma. A little each day takes you all the way.` },
        { title: 'Steady progress', body: (r) => r <= 10 ? `${r} Juz left! You're well past the halfway mark.` : `${r} Juz to go. Every Juz you finish is an achievement.` },
        { title: 'So close!', body: (r) => r <= 5 ? `Just ${r} Juz left! The end of your Khatma is within reach.` : `${r} Juz remaining. Steady and beautiful progress.` },
        { title: 'Final stretch', body: (r) => r <= 3 ? `Only ${r} Juz to go! Imagine the feeling of completing the entire Quran.` : `${r} Juz left. Stay consistent and you'll finish sooner than you think.` },
        { title: 'Your journey', body: (r) => `${r} Juz remaining in your Khatma. Every page is a step closer to completion.` },
    ];

    // ── Adhkar reminders ─────────────────────────────────────────────
    private static ADHKAR_MORNING: { title: string; body: string }[] = [
        { title: 'Morning Adhkar ☀️', body: 'Start your day with remembrance. Your morning adhkar are ready.' },
        { title: 'Good morning', body: 'A few minutes of dhikr can set the tone for your whole day.' },
        { title: 'Rise with remembrance', body: 'The morning is a fresh start. Begin it with Allah\'s name.' },
        { title: 'Morning peace', body: 'Before the day gets busy, take a moment for your adhkar.' },
        { title: 'Sabah al-khayr', body: 'Your morning adhkar are waiting. Protection and peace in just a few minutes.' },
        { title: 'Start strong', body: 'A day that starts with dhikr is a day under Allah\'s care.' },
        { title: 'Your morning routine', body: 'Coffee, adhkar, and clarity. Your morning ritual awaits.' },
        { title: 'Dawn blessings', body: 'The early hours carry special barakah. Read your morning adhkar.' },
    ];

    private static ADHKAR_EVENING: { title: string; body: string }[] = [
        { title: 'Evening Adhkar 🌙', body: 'Wind down your day with remembrance. Your evening adhkar are ready.' },
        { title: 'Time to reflect', body: 'The day is ending. Take a peaceful moment for your evening dhikr.' },
        { title: 'Evening peace', body: 'As the sun sets, let your heart settle with the evening adhkar.' },
        { title: 'Masa al-khayr', body: 'End your day with protection and peace. Your adhkar are waiting.' },
        { title: 'Night blessings', body: 'A few minutes of evening dhikr before the night. Your heart will feel it.' },
        { title: 'Unwind with dhikr', body: 'Instead of scrolling before bed, try your evening adhkar.' },
        { title: 'Your evening ritual', body: 'Calm, peaceful, and grounding. Your evening adhkar are ready.' },
        { title: 'Close the day right', body: 'End your day the way it should end: with gratitude and remembrance.' },
    ];

    private static ADHKAR_NIGHT: { title: string; body: string }[] = [
        { title: 'Bedtime Adhkar 🌙', body: 'Before you sleep, recite your night adhkar for protection and peace.' },
        { title: 'Night remembrance', body: 'The Prophet (ﷺ) never slept without his bedtime adhkar. Your turn.' },
        { title: 'Sleep in peace', body: 'A few minutes of dhikr before sleep brings tranquility to your night.' },
        { title: 'End your day right', body: 'Your night adhkar are waiting. Sleep under Allah\'s protection tonight.' },
        { title: 'Before you rest', body: 'Recite your bedtime supplications and let your heart find calm.' },
        { title: 'Night protection', body: 'The bedtime adhkar are a shield. Take a moment before you sleep.' },
        { title: 'Peaceful sleep', body: 'Wind down with the Sunnah. Your night adhkar bring serenity.' },
        { title: 'Your night routine', body: 'Phone down, heart up. A few adhkar before sleep can transform your rest.' },
    ];

    // ── Notification identifiers ─────────────────────────────────────
    private static DAILY_ID = 'daily-quran-reminder';
    private static STREAK_ID = 'streak-reminder';
    private static KHATMA_ID = 'khatma-nudge';
    private static CONTEXTUAL_ID = 'contextual-nudge';
    private static ADHKAR_MORNING_ID = 'adhkar-morning';
    private static ADHKAR_EVENING_ID = 'adhkar-evening';
    private static ADHKAR_NIGHT_ID = 'adhkar-night';

    // ── Slot 1: Daily Reminder ───────────────────────────────────────
    static async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
        await this.cancelDailyReminder();

        const reminder = this.DAILY_REMINDERS[Math.floor(Math.random() * this.DAILY_REMINDERS.length)];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: reminder.title,
                body: reminder.body,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: this.DAILY_ID,
        });
    }

    static async cancelDailyReminder(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(this.DAILY_ID).catch(() => { });
    }

    // ── Slot 2: Contextual Nudge (Khatma > Streak > Re-engagement) ──
    /**
     * Schedule the afternoon contextual nudge. Picks the best message
     * based on user state priority:
     *   1. Khatma progress (if active and has remaining Juz)
     *   2. Streak (if streak >= 2 days)
     *   3. Re-engagement (if user hasn't been active in 3+ days)
     *   4. Fallback to a gentle daily reminder
     */
    static async scheduleContextualNudge(
        options: {
            juzRemaining: number;
            streak: number;
            khatmaEnabled: boolean;
            streakEnabled: boolean;
            hour?: number;
            minute?: number;
        },
    ): Promise<void> {
        await this.cancelContextualNudge();

        const { juzRemaining, streak, khatmaEnabled, streakEnabled } = options;
        const hour = options.hour ?? 14;
        const minute = options.minute ?? 0;

        let content: { title: string; body: string };

        // Priority 1: Khatma nudge
        if (khatmaEnabled && juzRemaining > 0 && juzRemaining < 30) {
            const msg = this.KHATMA_MESSAGES[Math.floor(Math.random() * this.KHATMA_MESSAGES.length)];
            content = { title: msg.title, body: msg.body(juzRemaining) };
        }
        // Priority 2: Streak reminder
        else if (streakEnabled && streak >= 2) {
            const msg = this.STREAK_MESSAGES[Math.floor(Math.random() * this.STREAK_MESSAGES.length)];
            content = { title: msg.title, body: msg.body(streak) };
        }
        // Priority 3: Re-engagement
        else {
            content = this.RE_ENGAGEMENT_REMINDERS[Math.floor(Math.random() * this.RE_ENGAGEMENT_REMINDERS.length)];
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: content.title,
                body: content.body,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: this.CONTEXTUAL_ID,
        });
    }

    static async cancelContextualNudge(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(this.CONTEXTUAL_ID).catch(() => { });
        // Also cancel legacy IDs from the old approach
        await Notifications.cancelScheduledNotificationAsync(this.STREAK_ID).catch(() => { });
        await Notifications.cancelScheduledNotificationAsync(this.KHATMA_ID).catch(() => { });
    }

    static async scheduleAdhkarReminder(
        period: 'morning' | 'evening' | 'night',
        hour: number,
        minute: number,
    ): Promise<void> {
        const id = period === 'morning'
            ? this.ADHKAR_MORNING_ID
            : period === 'evening'
                ? this.ADHKAR_EVENING_ID
                : this.ADHKAR_NIGHT_ID;
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });

        const pool = period === 'morning'
            ? this.ADHKAR_MORNING
            : period === 'evening'
                ? this.ADHKAR_EVENING
                : this.ADHKAR_NIGHT;
        const msg = pool[Math.floor(Math.random() * pool.length)];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: msg.title,
                body: msg.body,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: id,
        });
    }

    static async cancelAdhkarReminders(): Promise<void> {
        await Promise.all([
            Notifications.cancelScheduledNotificationAsync(this.ADHKAR_MORNING_ID).catch(() => { }),
            Notifications.cancelScheduledNotificationAsync(this.ADHKAR_EVENING_ID).catch(() => { }),
            Notifications.cancelScheduledNotificationAsync(this.ADHKAR_NIGHT_ID).catch(() => { }),
        ]);
    }

    // ── Cancel All ───────────────────────────────────────────────────
    static async cancelAllReminders(): Promise<void> {
        await Promise.all([
            this.cancelDailyReminder(),
            this.cancelContextualNudge(),
            this.cancelAdhkarReminders(),
        ]);
    }

    // ── Permissions ──────────────────────────────────────────────────
    static async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    }

    static async registerForPushNotificationsAsync(): Promise<string | undefined> {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return;
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
            })).data;
        }

        return token;
    }

    // ── Listeners ────────────────────────────────────────────────────
    static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }
}

// Default handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

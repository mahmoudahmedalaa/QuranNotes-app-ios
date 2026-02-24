import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type NotificationType = 'daily' | 'streak' | 'khatma';

export class NotificationService {
    // ── Daily gentle nudges ──────────────────────────────────────────
    private static DAILY_REMINDERS: { title: string; body: string }[] = [
        { title: 'Time for Quran', body: 'A few verses today can bring peace to your whole evening.' },
        { title: 'Your daily reflection', body: 'Even one ayah read with thought is worth more than a hundred read without.' },
        { title: 'Quran time', body: 'The best conversations are the ones between you and Allah\'s words.' },
        { title: 'A moment of peace', body: 'Step away from the noise. Your Quran is waiting.' },
        { title: 'Feed your soul', body: 'Your body ate today — don\'t forget to nourish your heart too.' },
        { title: 'Just 5 minutes', body: 'That\'s all it takes to reconnect. Open where you left off.' },
        { title: 'Make time for peace', body: 'The Quran is not just read — it\'s lived. Start with today\'s verse.' },
        { title: 'Open your heart', body: 'The Quran has something for you today. All you have to do is begin.' },
        { title: 'The Prophet ﷺ said…', body: 'The best among you is the one who learns the Quran and teaches it.' },
        { title: 'The Prophet ﷺ said…', body: 'Read the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection.' },
        { title: 'Closer to Allah', body: 'And when My servants ask about Me — indeed I am near.' },
        { title: 'Hearts find rest', body: 'Indeed, in the remembrance of Allah do hearts find rest.' },
        { title: 'Made easy for you', body: 'Allah made the Quran easy for remembrance — will you remember?' },
        { title: 'A blessed Book', body: 'This is a blessed Book revealed to you, that you might reflect upon its verses.' },
        { title: 'Words of wisdom', body: 'We have sent it down as an Arabic Quran so that you might understand.' },
        { title: 'Light upon light', body: 'Allah guides to His light whom He wills.' },
        { title: 'Healing words', body: 'The Quran is a healing for what is in the hearts.' },
        { title: 'Find your gratitude', body: 'If you are grateful, I will surely increase you in favor.' },
        { title: 'Strength from within', body: 'Allah does not burden a soul beyond that it can bear.' },
        { title: 'We missed you', body: 'Your Quran journey is still here, right where you left it.' },
        { title: 'It\'s been a while', body: 'No guilt, just grace. Open to any page — Allah is always ready.' },
        { title: 'Come back gently', body: 'The door is always open. Even one verse today makes a difference.' },
        { title: 'Start fresh today', body: 'Every day is a new chance to connect with the Quran.' },
        { title: 'You\'re still on track', body: 'Progress isn\'t perfection. One ayah today keeps your heart close.' },
        { title: 'Pause and breathe', body: 'Before the world gets loud, let the Quran speak to you first.' },
        { title: 'A conversation with Allah', body: 'When you read the Quran, Allah is speaking to you.' },
        { title: 'Seek His guidance', body: 'A guidance for the righteous — open your Quran today.' },
        { title: 'The best reminder', body: 'The Quran is a reminder. And whoever wills will remember it.' },
        { title: 'Your companion', body: 'The Quran is a companion that never leaves you, a light that never dims.' },
        { title: 'Plot twist', body: 'You opened your phone to scroll — but what if you recited instead?' },
    ];

    // ── Streak-aware messages ────────────────────────────────────────
    private static STREAK_MESSAGES: { title: string; body: (streak: number) => string }[] = [
        { title: 'Keep it alive!', body: (s) => `You're on a ${s}-day streak! Don't let it slip — just one verse today.` },
        { title: 'Streak check!', body: (s) => `${s} days straight! Allah loves the deeds most consistent, even if small.` },
        { title: 'Momentum builder', body: (s) => `${s} days and counting. Your consistency is building something beautiful.` },
        { title: 'Don\'t break the chain', body: (s) => `${s}-day streak on the line. 5 minutes is all you need to keep it.` },
        { title: 'Incredible streak!', body: (s) => `${s} days in a row! The Prophet ﷺ loved consistency. So does Allah.` },
        { title: 'Look at you!', body: (s) => `${s} days with Quran. That's ${s} days closer to Allah.` },
        { title: 'Streak warrior', body: (s) => `${s}-day streak! "Whoever recites a letter from the Book of Allah earns a good deed."` },
        { title: 'Almost there!', body: (s) => `${s} days — don't stop now. Your future self will thank you.` },
        { title: 'Precious habit', body: (s) => `${s} straight days of Quran. This is the habit that changes everything.` },
        { title: 'Mashallah!', body: (s) => `${s} days strong! Keep this beautiful connection with Allah's words.` },
    ];

    // ── Khatma progress nudges ───────────────────────────────────────
    private static KHATMA_MESSAGES: { title: string; body: (juzRemaining: number) => string }[] = [
        { title: 'Khatma progress', body: (r) => `Only ${r} Juz left to complete the Quran! You've got this.` },
        { title: 'Almost there!', body: (r) => `${r} Juz remaining. Keep going — the finish line is closer than you think.` },
        { title: 'Your Khatma awaits', body: (r) => `${r} Juz to go. Every page brings you closer to completing the entire Quran.` },
        { title: 'Keep reading!', body: (r) => `${r} Juz left in your Khatma. A little each day takes you all the way.` },
        { title: 'Quran completion', body: (r) => `You're making incredible progress — only ${r} Juz remain in your Khatma!` },
        { title: 'So close!', body: (r) => r <= 5 ? `Just ${r} Juz left! The end of your Khatma is within reach.` : `${r} Juz remaining — steady and beautiful progress.` },
        { title: 'Final stretch', body: (r) => r <= 3 ? `Only ${r} Juz to go! Imagine the feeling of completing the entire Quran.` : `${r} Juz left. Stay consistent and you'll finish sooner than you think.` },
        { title: 'Barakah awaits', body: (r) => `${r} Juz remaining. The one who completes the Quran earns immense reward.` },
    ];

    // ── Notification identifiers ─────────────────────────────────────
    private static DAILY_ID = 'daily-quran-reminder';
    private static STREAK_ID = 'streak-reminder';
    private static KHATMA_ID = 'khatma-nudge';

    // ── Daily Reminder ───────────────────────────────────────────────
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

    // ── Streak Reminder ──────────────────────────────────────────────
    /**
     * Schedule a daily streak reminder. Fires 2 hours after the daily reminder
     * (or at 8 PM if no daily reminder set) to catch users who haven't read yet.
     */
    static async scheduleStreakReminder(
        currentStreak: number,
        hour: number = 20,
        minute: number = 0,
    ): Promise<void> {
        await this.cancelStreakReminder();

        if (currentStreak < 2) return; // Only nag if they have a streak worth protecting

        const msg = this.STREAK_MESSAGES[Math.floor(Math.random() * this.STREAK_MESSAGES.length)];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: msg.title,
                body: msg.body(currentStreak),
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: this.STREAK_ID,
        });
    }

    static async cancelStreakReminder(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(this.STREAK_ID).catch(() => { });
    }

    // ── Khatma Nudge ─────────────────────────────────────────────────
    /**
     * Schedule a Khatma progress nudge. Fires once daily at the specified time.
     * Only schedules if there are remaining Juz to complete.
     */
    static async scheduleKhatmaNudge(
        juzRemaining: number,
        hour: number = 21,
        minute: number = 0,
    ): Promise<void> {
        await this.cancelKhatmaNudge();

        if (juzRemaining <= 0) return; // Khatma complete — no nudge needed

        const msg = this.KHATMA_MESSAGES[Math.floor(Math.random() * this.KHATMA_MESSAGES.length)];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: msg.title,
                body: msg.body(juzRemaining),
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: this.KHATMA_ID,
        });
    }

    static async cancelKhatmaNudge(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(this.KHATMA_ID).catch(() => { });
    }

    // ── Cancel All ───────────────────────────────────────────────────
    static async cancelAllReminders(): Promise<void> {
        await Promise.all([
            this.cancelDailyReminder(),
            this.cancelStreakReminder(),
            this.cancelKhatmaNudge(),
        ]);
    }

    // ── Test Notification ────────────────────────────────────────────
    /**
     * Send a test notification in 3 seconds so the user can preview the look & feel.
     */
    static async sendTestNotification(type: NotificationType = 'daily'): Promise<void> {
        let content: { title: string; body: string };

        switch (type) {
            case 'streak': {
                const msg = this.STREAK_MESSAGES[Math.floor(Math.random() * this.STREAK_MESSAGES.length)];
                content = { title: msg.title, body: msg.body(7) };
                break;
            }
            case 'khatma': {
                const msg = this.KHATMA_MESSAGES[Math.floor(Math.random() * this.KHATMA_MESSAGES.length)];
                content = { title: msg.title, body: msg.body(12) };
                break;
            }
            default: {
                content = this.DAILY_REMINDERS[Math.floor(Math.random() * this.DAILY_REMINDERS.length)];
                break;
            }
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: content.title,
                body: content.body,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 3,
            },
        });
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

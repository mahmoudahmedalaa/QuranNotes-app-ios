/**
 * TadabburRepository — AsyncStorage CRUD for Tadabbur sessions & reflections.
 * All keys are scoped per-user to prevent cross-account data bleed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Reflection,
    TadabburSession,
    ReflectionStats,
} from '../domain/entities/Reflection';

// ─── Storage key helpers ────────────────────────────────────────────────────

function keys(uid: string) {
    return {
        SESSIONS: `tadabbur_sessions_${uid}`,
        REFLECTIONS: `tadabbur_reflections_${uid}`,
        STATS: `tadabbur_stats_${uid}`,
        ONBOARDING_SEEN: `tadabbur_onboarding_seen_${uid}`,
        WEEKLY_COUNT: `tadabbur_weekly_${uid}`,
    };
}

function weekKey(): string {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

const TadabburRepository = {
    // ── Sessions ────────────────────────────────────────────────────────────

    async getSessions(uid: string): Promise<TadabburSession[]> {
        try {
            const raw = await AsyncStorage.getItem(keys(uid).SESSIONS);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    async saveSession(uid: string, session: TadabburSession): Promise<void> {
        const existing = await this.getSessions(uid);
        const updated = [session, ...existing].slice(0, 200); // Keep recent 200
        await AsyncStorage.setItem(keys(uid).SESSIONS, JSON.stringify(updated));
    },

    // ── Reflections ─────────────────────────────────────────────────────────

    async getReflections(uid: string): Promise<Reflection[]> {
        try {
            const raw = await AsyncStorage.getItem(keys(uid).REFLECTIONS);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    async saveReflection(uid: string, reflection: Reflection): Promise<void> {
        const existing = await this.getReflections(uid);
        const updated = [reflection, ...existing].slice(0, 500);
        await AsyncStorage.setItem(keys(uid).REFLECTIONS, JSON.stringify(updated));
    },

    async saveReflections(uid: string, reflections: Reflection[]): Promise<void> {
        const existing = await this.getReflections(uid);
        const updated = [...reflections, ...existing].slice(0, 500);
        await AsyncStorage.setItem(keys(uid).REFLECTIONS, JSON.stringify(updated));
    },

    async deleteReflection(uid: string, reflectionId: string): Promise<void> {
        const existing = await this.getReflections(uid);
        const filtered = existing.filter((r) => r.id !== reflectionId);
        await AsyncStorage.setItem(keys(uid).REFLECTIONS, JSON.stringify(filtered));
    },

    // ── Stats ───────────────────────────────────────────────────────────────

    async getStats(uid: string): Promise<ReflectionStats> {
        try {
            const raw = await AsyncStorage.getItem(keys(uid).STATS);
            if (raw) return JSON.parse(raw);
        } catch { /* fallthrough */ }
        return {
            userId: uid,
            totalSessions: 0,
            totalReflections: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            surahsCovered: [],
            lastSessionDate: '',
        };
    },

    async saveStats(uid: string, stats: ReflectionStats): Promise<void> {
        await AsyncStorage.setItem(keys(uid).STATS, JSON.stringify(stats));
    },

    // ── Weekly count (for free gating) ──────────────────────────────────────

    async getWeeklySessionCount(uid: string): Promise<number> {
        try {
            const raw = await AsyncStorage.getItem(keys(uid).WEEKLY_COUNT);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.week === weekKey()) return parsed.count;
            }
        } catch { /* fallthrough */ }
        return 0;
    },

    async incrementWeeklyCount(uid: string): Promise<number> {
        const current = await this.getWeeklySessionCount(uid);
        const next = current + 1;
        await AsyncStorage.setItem(
            keys(uid).WEEKLY_COUNT,
            JSON.stringify({ week: weekKey(), count: next }),
        );
        return next;
    },

    // ── Onboarding ──────────────────────────────────────────────────────────

    async hasSeenOnboarding(uid: string): Promise<boolean> {
        try {
            const val = await AsyncStorage.getItem(keys(uid).ONBOARDING_SEEN);
            return val === 'true';
        } catch {
            return false;
        }
    },

    async markOnboardingSeen(uid: string): Promise<void> {
        await AsyncStorage.setItem(keys(uid).ONBOARDING_SEEN, 'true');
    },
};

export default TadabburRepository;

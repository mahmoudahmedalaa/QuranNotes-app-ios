import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Free-tier daily limits ──
const FREE_AI_EXPLANATIONS_PER_DAY = 3;
const FREE_AI_QUESTIONS_PER_DAY = 1;

const STORAGE_KEY = 'tafsir_ai_usage';

interface DailyUsage {
    date: string; // YYYY-MM-DD
    explanations: number;
    questions: number;
}

function getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

async function getUsage(): Promise<DailyUsage> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const usage: DailyUsage = JSON.parse(raw);
            // Auto-reset if it's a new day
            if (usage.date === getTodayDateString()) {
                return usage;
            }
        }
    } catch (e) {
        if (__DEV__) console.warn('[TafsirUsage] Error reading usage:', e);
    }
    // New day or first launch → fresh counters
    return { date: getTodayDateString(), explanations: 0, questions: 0 };
}

async function saveUsage(usage: DailyUsage): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (e) {
        if (__DEV__) console.warn('[TafsirUsage] Error saving usage:', e);
    }
}

/**
 * Check if the free user can use an AI feature today.
 * Pro users should bypass this check entirely.
 */
export async function canUseAI(type: 'explanation' | 'question'): Promise<boolean> {
    const usage = await getUsage();
    if (type === 'explanation') {
        return usage.explanations < FREE_AI_EXPLANATIONS_PER_DAY;
    }
    return usage.questions < FREE_AI_QUESTIONS_PER_DAY;
}

/**
 * Increment the usage counter after a successful AI call.
 * Only call this for free users.
 */
export async function incrementUsage(type: 'explanation' | 'question'): Promise<void> {
    const usage = await getUsage();
    if (type === 'explanation') {
        usage.explanations += 1;
    } else {
        usage.questions += 1;
    }
    await saveUsage(usage);
}

/**
 * Get remaining free uses for display ("2 of 3 remaining").
 */
export async function getRemainingUses(): Promise<{
    explanationsRemaining: number;
    questionsRemaining: number;
    explanationsLimit: number;
    questionsLimit: number;
}> {
    const usage = await getUsage();
    return {
        explanationsRemaining: Math.max(0, FREE_AI_EXPLANATIONS_PER_DAY - usage.explanations),
        questionsRemaining: Math.max(0, FREE_AI_QUESTIONS_PER_DAY - usage.questions),
        explanationsLimit: FREE_AI_EXPLANATIONS_PER_DAY,
        questionsLimit: FREE_AI_QUESTIONS_PER_DAY,
    };
}

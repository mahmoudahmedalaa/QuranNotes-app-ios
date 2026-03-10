/**
 * ReviewService — Smart In-App Review Prompts
 *
 * Uses expo-store-review (wraps SKStoreReviewController on iOS,
 * ReviewManager API on Android) to prompt at high-delight moments.
 *
 * Trigger points (in order of emotional impact):
 *   1. Khatma completion — user just finished the entire Quran
 *   2. Adhkar streak milestone — 3, 7, 14, 30 day streaks
 *   3. Reading streak milestone — 7, 14, 30 day streaks
 *   4. First highlight saved (onboarding delight)
 *
 * Rate-limiting:
 *   - Max 1 prompt per 90 days (Apple's own limit is ~3/year)
 *   - A 2-second delay after the trigger for emotional breathing room
 *   - Tracks prompt count to never annoy repeat users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazy-load expo-store-review so the app doesn't crash if the
// native module isn't linked yet (needs a native rebuild).
let _storeReview: typeof import('expo-store-review') | null = null;
const getStoreReview = async () => {
    if (!_storeReview) {
        try {
            _storeReview = await import('expo-store-review');
        } catch {
            if (__DEV__) console.warn('[ReviewService] expo-store-review native module not available');
            return null;
        }
    }
    return _storeReview;
};

// ── Configuration ──────────────────────────────────────────────────────
const STORAGE_KEY = '@review_prompt_meta';
const MIN_DAYS_BETWEEN_PROMPTS = 90;
const PROMPT_DELAY_MS = 2000; // Let the delight moment breathe
const MAX_LIFETIME_PROMPTS = 6; // Don't annoy power users

// Streak thresholds that trigger a review prompt
const ADHKAR_STREAK_MILESTONES = [3, 7, 14, 30];
const READING_STREAK_MILESTONES = [7, 14, 30];

// ── Types ──────────────────────────────────────────────────────────────
interface ReviewMeta {
    /** ISO date of last prompt */
    lastPromptDate: string | null;
    /** Total number of times prompted */
    promptCount: number;
    /** Milestones already triggered (to avoid re-prompting) */
    triggeredMilestones: string[];
}

type ReviewTrigger =
    | 'khatma_complete'
    | 'adhkar_streak'
    | 'reading_streak'
    | 'first_highlight';

// ── Service ────────────────────────────────────────────────────────────
class ReviewServiceClass {
    private meta: ReviewMeta | null = null;

    /** Load persisted review metadata */
    private async loadMeta(): Promise<ReviewMeta> {
        if (this.meta) return this.meta;

        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.meta = JSON.parse(raw);
                return this.meta!;
            }
        } catch {
            // Ignore parse errors
        }

        this.meta = {
            lastPromptDate: null,
            promptCount: 0,
            triggeredMilestones: [],
        };
        return this.meta;
    }

    /** Persist metadata */
    private async saveMeta(): Promise<void> {
        if (!this.meta) return;
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.meta));
        } catch {
            // Silently fail — not critical
        }
    }

    /** Check if enough time has passed and we haven't exceeded limits */
    private canPrompt(meta: ReviewMeta): boolean {
        // Lifetime cap
        if (meta.promptCount >= MAX_LIFETIME_PROMPTS) return false;

        // Cooldown period
        if (meta.lastPromptDate) {
            const last = new Date(meta.lastPromptDate).getTime();
            const now = Date.now();
            const daysSinceLastPrompt = (now - last) / (1000 * 60 * 60 * 24);
            if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;
        }

        return true;
    }

    /** Build a unique milestone key to prevent re-triggering */
    private milestoneKey(trigger: ReviewTrigger, value?: number): string {
        return value ? `${trigger}_${value}` : trigger;
    }

    /**
     * Main entry point — call this from trigger points.
     * Returns true if the prompt was shown (or attempted).
     */
    async maybeRequestReview(
        trigger: ReviewTrigger,
        milestoneValue?: number,
    ): Promise<boolean> {
        try {
            const StoreReview = await getStoreReview();
            if (!StoreReview) return false;

            const isAvailable = await StoreReview.isAvailableAsync();
            if (!isAvailable) return false;

            const meta = await this.loadMeta();

            // Rate limit
            if (!this.canPrompt(meta)) return false;

            // Avoid re-triggering the same milestone
            const key = this.milestoneKey(trigger, milestoneValue);
            if (meta.triggeredMilestones.includes(key)) return false;

            // Add delay for emotional breathing room
            await new Promise(resolve => setTimeout(resolve, PROMPT_DELAY_MS));

            // Request the review
            await StoreReview.requestReview();

            // Update metadata
            meta.lastPromptDate = new Date().toISOString();
            meta.promptCount += 1;
            meta.triggeredMilestones.push(key);
            this.meta = meta;
            await this.saveMeta();

            if (__DEV__) console.log(`[ReviewService] Prompted for review (trigger: ${key})`);
            return true;
        } catch (e) {
            if (__DEV__) console.warn('[ReviewService] Failed to request review:', e);
            return false;
        }
    }

    // ── Convenience methods for each trigger point ──────────────────────

    /**
     * Call when user completes a Khatma (all 30 Juz).
     * Highest emotional impact — the user just finished the Quran!
     */
    async onKhatmaComplete(): Promise<void> {
        await this.maybeRequestReview('khatma_complete');
    }

    /**
     * Call when adhkar streak updates.
     * Only prompts at milestone days: 3, 7, 14, 30.
     */
    async onAdhkarStreakUpdate(currentStreak: number): Promise<void> {
        if (ADHKAR_STREAK_MILESTONES.includes(currentStreak)) {
            await this.maybeRequestReview('adhkar_streak', currentStreak);
        }
    }

    /**
     * Call when reading streak updates.
     * Only prompts at milestone days: 7, 14, 30.
     */
    async onReadingStreakUpdate(currentStreak: number): Promise<void> {
        if (READING_STREAK_MILESTONES.includes(currentStreak)) {
            await this.maybeRequestReview('reading_streak', currentStreak);
        }
    }

    /**
     * Call when user saves their first highlight.
     * Small delight moment — "this app is useful!"
     */
    async onFirstHighlight(totalHighlights: number): Promise<void> {
        if (totalHighlights === 1) {
            await this.maybeRequestReview('first_highlight');
        }
    }

    /**
     * Utility: check if reviews are supported on this platform.
     */
    async isSupported(): Promise<boolean> {
        try {
            const StoreReview = await getStoreReview();
            if (!StoreReview) return false;
            return await StoreReview.isAvailableAsync();
        } catch {
            return false;
        }
    }

    /**
     * Utility: Check if the user has the store installed
     * (useful for showing "Rate us" link in settings).
     */
    async hasStoreUrl(): Promise<boolean> {
        try {
            const StoreReview = await getStoreReview();
            if (!StoreReview) return false;
            return await StoreReview.hasAction();
        } catch {
            return false;
        }
    }

    /**
     * Open the app's store page directly
     * (fallback for manual "Rate us" button in settings).
     */
    async openStorePage(): Promise<void> {
        try {
            // This will open the App Store / Play Store page
            if (Platform.OS === 'ios') {
                const StoreReview = await getStoreReview();
                if (StoreReview) {
                    await StoreReview.requestReview();
                }
            }
        } catch (e) {
            if (__DEV__) console.warn('[ReviewService] Failed to open store page:', e);
        }
    }
}

export const ReviewService = new ReviewServiceClass();

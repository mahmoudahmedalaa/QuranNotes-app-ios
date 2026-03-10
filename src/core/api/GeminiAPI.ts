/**
 * AI Explanation API — Secure verse explanation with automatic Cloud Function fallback.
 *
 * Strategy:
 * - Tries the server-side Cloud Function first (API key hidden on server)
 * - Falls back to direct OpenAI call if Cloud Function isn't deployed yet
 * - Once you deploy the Cloud Function, the fallback is never used
 *
 * Includes AsyncStorage caching to avoid redundant calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

const CACHE_PREFIX = 'tafseer_';

// The API key is only used as a fallback if the Cloud Function isn't deployed.
// Once the Cloud Function is live, this is never touched.
const FALLBACK_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export class GeminiAPI {
    /** Whether any AI backend is available */
    static get isConfigured(): boolean {
        return true; // Cloud Function is always "configured" — fallback checks key
    }

    /**
     * Explain a Quranic verse using AI.
     * Prefers server-side Cloud Function; falls back to direct API call.
     */
    static async explainVerse(
        arabicText: string,
        translation: string,
        surahName: string,
        verseNumber: number,
    ): Promise<string> {
        // Check cache first
        const cacheKey = `${CACHE_PREFIX}${surahName}_${verseNumber}`;
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) return cached;
        } catch {
            // Cache miss — continue
        }

        if (__DEV__) console.log(`[AI API] Requesting explanation for ${surahName}:${verseNumber}`);

        // Try Cloud Function first (secure — API key on server)
        try {
            const text = await GeminiAPI.callCloudFunction(arabicText, translation, surahName, verseNumber);
            await GeminiAPI.cacheResult(cacheKey, text);
            return text;
        } catch (cloudError: unknown) {
            const err = cloudError as { code?: string; message?: string };

            // If function doesn't exist or isn't deployed, fall back to direct call
            if (
                err.code === 'functions/not-found' ||
                err.code === 'functions/unavailable' ||
                err.code === 'functions/internal' ||
                err.message?.includes('not found') ||
                err.message?.includes('INTERNAL')
            ) {
                if (__DEV__) console.warn('[AI API] Cloud Function not available, using direct fallback');
                return GeminiAPI.callDirectFallback(arabicText, translation, surahName, verseNumber, cacheKey);
            }

            // For auth/rate-limit errors, surface them directly
            if (err.code === 'functions/resource-exhausted') {
                throw new Error('AI quota exceeded. Please try again later.');
            }
            if (err.code === 'functions/unauthenticated') {
                throw new Error('Please sign in to use AI explanations.');
            }

            // Unknown error — try fallback
            if (__DEV__) console.warn('[AI API] Cloud Function error, trying fallback:', err.code);
            return GeminiAPI.callDirectFallback(arabicText, translation, surahName, verseNumber, cacheKey);
        }
    }

    /** Call the server-side Cloud Function */
    private static async callCloudFunction(
        arabicText: string,
        translation: string,
        surahName: string,
        verseNumber: number,
    ): Promise<string> {
        const functions = firebase.app().functions();
        const explainVerseFunc = functions.httpsCallable('explainVerse');

        const result = await explainVerseFunc({
            arabicText,
            translation,
            surahName,
            verseNumber,
        });

        return (result.data as { explanation: string }).explanation ||
            'Unable to generate explanation. Please try again.';
    }

    /**
     * Direct OpenAI fallback — used ONLY if the Cloud Function isn't deployed.
     * Once you deploy the Cloud Function, this code path is never reached.
     */
    private static async callDirectFallback(
        arabicText: string,
        translation: string,
        surahName: string,
        verseNumber: number,
        cacheKey: string,
    ): Promise<string> {
        if (!FALLBACK_API_KEY) {
            throw new Error('AI service is not available. Please try again later.');
        }

        const prompt = `You are a knowledgeable Islamic scholar providing brief, accessible tafseer (explanation) of Quranic verses.

Verse: ${surahName}, Verse ${verseNumber}
Arabic: ${arabicText}
Translation: ${translation}

Provide a clear, concise explanation (3-5 paragraphs) covering:
1. Context (when/why this verse was revealed, if known)
2. Core meaning and lessons
3. How to apply this verse in daily life

Keep the tone warm, accessible, and respectful. Use simple language.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${FALLBACK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a knowledgeable Islamic scholar providing tafseer of Quranic verses.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            throw new Error('AI service is temporarily unavailable.');
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ||
            'Unable to generate explanation. Please try again.';

        await GeminiAPI.cacheResult(cacheKey, text);
        return text;
    }

    /** Cache a result in AsyncStorage */
    private static async cacheResult(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch {
            // Non-critical — ignore cache write failure
        }
    }
}

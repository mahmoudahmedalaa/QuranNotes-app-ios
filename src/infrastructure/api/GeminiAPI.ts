/**
 * GeminiAPI — Calls the Google Gemini API for verse explanations.
 * Includes AsyncStorage caching to avoid redundant API calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'tafseer_';

export class GeminiAPI {
    private static API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    private static BASE_URL =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    /** Whether the Gemini API is configured */
    static get isConfigured(): boolean {
        return this.API_KEY.length > 0;
    }

    /**
     * Explain a Quranic verse using Gemini AI.
     * Caches the result in AsyncStorage keyed by surah+verse.
     */
    static async explainVerse(
        arabicText: string,
        translation: string,
        surahName: string,
        verseNumber: number,
    ): Promise<string> {
        if (!this.API_KEY) {
            throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
        }

        // Check cache first
        const cacheKey = `${CACHE_PREFIX}${surahName}_${verseNumber}`;
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) return cached;
        } catch {
            // Cache miss — continue to API
        }

        const prompt = `You are a knowledgeable Islamic scholar providing brief, accessible tafseer (explanation) of Quranic verses.

Verse: ${surahName}, Verse ${verseNumber}
Arabic: ${arabicText}
Translation: ${translation}

Provide a clear, concise explanation (3-5 paragraphs) covering:
1. Context (when/why this verse was revealed, if known)
2. Core meaning and lessons
3. How to apply this verse in daily life

Keep the tone warm, accessible, and respectful. Use simple language. Include relevant hadith references if applicable. Do NOT include the Arabic text or translation in your response — just the explanation.`;

        console.log(`[GeminiAPI] Calling with key: ${this.API_KEY.substring(0, 8)}...${this.API_KEY.substring(this.API_KEY.length - 4)}`);

        const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.warn(`[GeminiAPI] Error ${response.status}:`, errorBody);

            if (response.status === 429) {
                throw new Error('AI quota exceeded. The free tier limit has been reached. Please try again later or enable billing on Google Cloud.');
            }
            if (response.status === 403) {
                throw new Error('API key is invalid or has been revoked. Please check your Gemini API key.');
            }
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Unable to generate explanation. Please try again.';

        // Cache the result
        try {
            await AsyncStorage.setItem(cacheKey, text);
        } catch {
            // Non-critical — ignore cache write failure
        }

        return text;
    }
}

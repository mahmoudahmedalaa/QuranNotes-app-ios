/**
 * AI Explanation API — Calls OpenAI API for verse explanations.
 * Includes AsyncStorage caching to avoid redundant API calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'tafseer_';

export class GeminiAPI {
    private static API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    private static BASE_URL = 'https://api.openai.com/v1/chat/completions';
    private static MODEL = 'gpt-4o-mini';

    /** Whether the AI API is configured */
    static get isConfigured(): boolean {
        return this.API_KEY.length > 0;
    }

    /**
     * Explain a Quranic verse using AI.
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

        console.log(`[AI API] Calling OpenAI ${this.MODEL}`);

        const response = await fetch(this.BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`,
            },
            body: JSON.stringify({
                model: this.MODEL,
                messages: [
                    { role: 'system', content: 'You are a knowledgeable Islamic scholar providing tafseer of Quranic verses.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.warn(`[AI API] Error ${response.status}:`, errorBody);

            if (response.status === 429) {
                throw new Error('AI quota exceeded. Please try again later.');
            }
            if (response.status === 401) {
                throw new Error('API key is invalid. Please check your OpenAI API key.');
            }
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const text =
            data.choices?.[0]?.message?.content ||
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

/**
 * TranslationEdition — Curated list of Quran translation editions
 * from the Al-Quran Cloud API (https://alquran.cloud/api)
 * All editions are free, no auth required.
 */

export interface TranslationEdition {
    identifier: string;     // API edition ID, e.g. "en.sahih"
    language: string;       // ISO 639-1 code, e.g. "en"
    languageName: string;   // Human-readable, e.g. "English"
    name: string;           // Translator name (native), e.g. "Saheeh International"
    englishName: string;    // Translator name (English)
    flag: string;           // Emoji flag
    direction: 'ltr' | 'rtl';
}

/**
 * Curated list of the best translation editions per language.
 * Ordered by largest Muslim population first.
 */
export const SUPPORTED_EDITIONS: TranslationEdition[] = [
    // English
    { identifier: 'en.sahih', language: 'en', languageName: 'English', name: 'Saheeh International', englishName: 'Saheeh International', flag: '🇬🇧', direction: 'ltr' },
    { identifier: 'en.hilali', language: 'en', languageName: 'English', name: 'Hilali & Khan', englishName: 'Hilali & Khan', flag: '🇬🇧', direction: 'ltr' },
    { identifier: 'en.yusufali', language: 'en', languageName: 'English', name: 'Yusuf Ali', englishName: 'Abdullah Yusuf Ali', flag: '🇬🇧', direction: 'ltr' },
    // French
    { identifier: 'fr.hamidullah', language: 'fr', languageName: 'Français', name: 'Hamidullah', englishName: 'Muhammad Hamidullah', flag: '🇫🇷', direction: 'ltr' },
    // Turkish
    { identifier: 'tr.diyanet', language: 'tr', languageName: 'Türkçe', name: 'Diyanet İşleri', englishName: 'Diyanet Isleri', flag: '🇹🇷', direction: 'ltr' },
    // Indonesian
    { identifier: 'id.indonesian', language: 'id', languageName: 'Bahasa Indonesia', name: 'Bahasa Indonesia', englishName: 'Indonesian Ministry of Religious Affairs', flag: '🇮🇩', direction: 'ltr' },
    // Urdu
    { identifier: 'ur.jalandhry', language: 'ur', languageName: 'اردو', name: 'جالندھری', englishName: 'Fateh Muhammad Jalandhry', flag: '🇵🇰', direction: 'rtl' },
    // Bengali
    { identifier: 'bn.bengali', language: 'bn', languageName: 'বাংলা', name: 'মুহিউদ্দীন খান', englishName: 'Muhiuddin Khan', flag: '🇧🇩', direction: 'ltr' },
    // Russian
    { identifier: 'ru.kuliev', language: 'ru', languageName: 'Русский', name: 'Кулиев', englishName: 'Elmir Kuliev', flag: '🇷🇺', direction: 'ltr' },
    // German
    { identifier: 'de.bubenheim', language: 'de', languageName: 'Deutsch', name: 'Bubenheim & Elyas', englishName: 'Bubenheim & Elyas', flag: '🇩🇪', direction: 'ltr' },
    // Spanish
    { identifier: 'es.cortes', language: 'es', languageName: 'Español', name: 'Cortes', englishName: 'Julio Cortes', flag: '🇪🇸', direction: 'ltr' },
    // Malay
    { identifier: 'ms.basmeih', language: 'ms', languageName: 'Bahasa Melayu', name: 'Basmeih', englishName: 'Abdullah Muhammad Basmeih', flag: '🇲🇾', direction: 'ltr' },
    // Italian
    { identifier: 'it.piccardo', language: 'it', languageName: 'Italiano', name: 'Piccardo', englishName: 'Hamza Roberto Piccardo', flag: '🇮🇹', direction: 'ltr' },
    // Dutch
    { identifier: 'nl.siregar', language: 'nl', languageName: 'Nederlands', name: 'Siregar', englishName: 'Siregar', flag: '🇳🇱', direction: 'ltr' },
    // Bosnian
    { identifier: 'bs.korkut', language: 'bs', languageName: 'Bosanski', name: 'Korkut', englishName: 'Besim Korkut', flag: '🇧🇦', direction: 'ltr' },
    // Persian
    { identifier: 'fa.makarem', language: 'fa', languageName: 'فارسی', name: 'مکارم شیرازی', englishName: 'Naser Makarem Shirazi', flag: '🇮🇷', direction: 'rtl' },
    // Swedish
    { identifier: 'sv.bernstrom', language: 'sv', languageName: 'Svenska', name: 'Bernström', englishName: 'Knut Bernström', flag: '🇸🇪', direction: 'ltr' },
    // Hindi
    { identifier: 'hi.hindi', language: 'hi', languageName: 'हिन्दी', name: 'फ़ारूक़ ख़ान & नदवी', englishName: 'Suhel Farooq Khan', flag: '🇮🇳', direction: 'ltr' },
    // Somali
    { identifier: 'so.abduh', language: 'so', languageName: 'Soomaali', name: 'Abduh', englishName: 'Mahmud Muhammad Abduh', flag: '🇸🇴', direction: 'ltr' },
];

/**
 * Get unique languages from editions (for language-first picker)
 */
export function getAvailableLanguages(): { language: string; languageName: string; flag: string; editions: TranslationEdition[] }[] {
    const map = new Map<string, { languageName: string; flag: string; editions: TranslationEdition[] }>();

    for (const edition of SUPPORTED_EDITIONS) {
        const existing = map.get(edition.language);
        if (existing) {
            existing.editions.push(edition);
        } else {
            map.set(edition.language, {
                languageName: edition.languageName,
                flag: edition.flag,
                editions: [edition],
            });
        }
    }

    return Array.from(map.entries()).map(([language, data]) => ({
        language,
        ...data,
    }));
}

/**
 * Find an edition by identifier
 */
export function getEditionById(identifier: string): TranslationEdition | undefined {
    return SUPPORTED_EDITIONS.find(e => e.identifier === identifier);
}

/**
 * Default edition
 */
export const DEFAULT_EDITION = SUPPORTED_EDITIONS[0]; // en.sahih

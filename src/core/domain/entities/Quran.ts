export interface Verse {
    number: number; // Verse number in surah
    text: string; // Arabic Uthmani
    translation: string; // User's chosen language
    transliteration?: string; // Latin script pronunciation (optional)
    surahNumber: number;
    juz: number;
    page: number;
}

export interface Surah {
    number: number;
    name: string; // Arabic name
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: 'Meccan' | 'Medinan';
    verses: Verse[];
}

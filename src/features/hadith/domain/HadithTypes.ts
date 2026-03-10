/**
 * HadithTypes — Domain types for the Daily Hadith feature.
 * Uses curated local data (no API calls).
 */

export interface CuratedHadith {
    /** Unique ID for history tracking */
    id: string;
    /** Arabic text of the hadith (matn only, no isnad) */
    arabicText: string;
    /** English translation (clean text, no "Narrated X:" prefix) */
    englishText: string;
    /** Narrator name (e.g. "Abu Hurairah") */
    narrator: string;
    /** Source collection (e.g. "Sahih al-Bukhari") */
    collection: string;
    /** Hadith reference number */
    reference: string;
    /** Topic category */
    topic: string;
    /** 1-line practical reflection/takeaway */
    reflection: string;
}

export interface HadithTopic {
    id: string;
    name: string;
    hadiths: CuratedHadith[];
}

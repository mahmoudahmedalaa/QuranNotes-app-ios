import { Surah, Verse } from '../../domain/entities/Quran';

/** Shape of a single Ayah returned by Al-Quran Cloud API */
interface ApiAyah {
    number: number;
    numberInSurah: number;
    text: string;
    juz: number;
    page: number;
}

/** Shape of a single edition (Arabic or English) for a Surah detail call */
interface ApiEdition {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
    ayahs: ApiAyah[];
}

/** Shape of a Surah list item */
interface ApiSurahListItem {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export class QuranMapper {
    static toDomain(apiResponse: { data: ApiEdition[] }, includeTransliteration: boolean = false): Surah {
        const ArabicEdition = apiResponse.data[0];
        const TranslationEdition = apiResponse.data[1];
        const TransliterationEdition = includeTransliteration ? apiResponse.data[2] : null;

        const verses: Verse[] = ArabicEdition.ayahs.map((ayah: ApiAyah, index: number) => ({
            number: ayah.numberInSurah,
            text: ayah.text,
            translation: TranslationEdition.ayahs[index].text,
            transliteration: TransliterationEdition?.ayahs[index]?.text,
            surahNumber: ArabicEdition.number,
            juz: ayah.juz,
            page: ayah.page,
        }));

        return {
            number: ArabicEdition.number,
            name: ArabicEdition.name,
            englishName: ArabicEdition.englishName,
            englishNameTranslation: ArabicEdition.englishNameTranslation,
            numberOfAyahs: ArabicEdition.numberOfAyahs,
            revelationType: ArabicEdition.revelationType as 'Meccan' | 'Medinan',
            verses: verses,
        };
    }

    static toDomainList(apiResponse: { data: ApiSurahListItem[] }): Surah[] {
        // For the surah list endpoint
        return apiResponse.data.map((surah: ApiSurahListItem) => ({
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            englishNameTranslation: surah.englishNameTranslation,
            numberOfAyahs: surah.numberOfAyahs,
            revelationType: surah.revelationType as 'Meccan' | 'Medinan',
            verses: [], // List view doesn't need verses
        }));
    }
}

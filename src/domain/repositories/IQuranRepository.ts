import { Surah } from '../entities/Quran';

export interface IQuranRepository {
    getSurah(surahNumber: number, translationEdition?: string, includeTransliteration?: boolean): Promise<Surah>;
    getAllSurahs(): Promise<Surah[]>; // For the surah list
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surah } from '../../../core/domain/entities/Quran';

export class LocalQuranRepository {
    private readonly STORAGE_KEY = 'quran_cache_';
    private readonly LIST_KEY = 'quran_list_cache';

    async getSurah(surahNumber: number, editionKey?: string): Promise<Surah> {
        const key = editionKey
            ? `${this.STORAGE_KEY}${editionKey}_${surahNumber}`
            : `${this.STORAGE_KEY}${surahNumber}`;
        let data: string | null = null;
        try {
            data = await AsyncStorage.getItem(key);
        } catch (e) {
            if (__DEV__) console.error('Error reading local surah', e);
            throw e;
        }

        if (!data) throw new Error(`Surah ${surahNumber} not found`);
        return JSON.parse(data);
    }

    async saveSurah(surah: Surah, editionKey?: string): Promise<void> {
        const key = editionKey
            ? `${this.STORAGE_KEY}${editionKey}_${surah.number}`
            : `${this.STORAGE_KEY}${surah.number}`;
        try {
            await AsyncStorage.setItem(key, JSON.stringify(surah));
        } catch (e) {
            if (__DEV__) console.error('Error saving local surah', e);
        }
    }

    async getAllSurahs(): Promise<Surah[]> {
        try {
            const data = await AsyncStorage.getItem(this.LIST_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            if (__DEV__) console.error('Error reading local surah list', e);
            return [];
        }
    }

    async saveSurahsList(surahs: Surah[]): Promise<void> {
        try {
            await AsyncStorage.setItem(this.LIST_KEY, JSON.stringify(surahs));
        } catch (e) {
            if (__DEV__) console.error('Error saving local surah list', e);
        }
    }
}

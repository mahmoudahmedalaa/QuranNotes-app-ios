import { IQuranRepository } from '../domain/repositories/IQuranRepository';
import { Surah } from '../../../core/domain/entities/Quran';
import { LocalQuranRepository } from './LocalQuranRepository';
import { RemoteQuranRepository } from '../../../core/data/remote/RemoteQuranRepository';

export class QuranRepository implements IQuranRepository {
    constructor(
        private localRepo: LocalQuranRepository,
        private remoteRepo: RemoteQuranRepository,
    ) { }

    async getSurah(
        surahNumber: number,
        translationEdition: string = 'en.sahih',
        includeTransliteration: boolean = false,
    ): Promise<Surah> {
        // Build edition-aware cache key so switching languages triggers a refetch
        const cacheKey = `${translationEdition}${includeTransliteration ? '+translit' : ''}`;

        // 1. Try local (only for matching edition)
        try {
            const local = await this.localRepo.getSurah(surahNumber, cacheKey);
            if (local) {
                return local;
            }
        } catch (e) {
            // Ignore error and fall back to remote
        }

        // 2. Fetch remote with the requested edition
        const remote = await this.remoteRepo.getSurah(surahNumber, translationEdition, includeTransliteration);

        // 3. Save local with edition-aware key
        await this.localRepo.saveSurah(remote, cacheKey);

        return remote;
    }

    async getAllSurahs(): Promise<Surah[]> {
        // 1. Try local
        const local = await this.localRepo.getAllSurahs();
        if (local && local.length > 0) {
            return local;
        }

        // 2. Fetch remote
        const remote = await this.remoteRepo.getAllSurahs();

        // 3. Save local
        await this.localRepo.saveSurahsList(remote);

        return remote;
    }
}

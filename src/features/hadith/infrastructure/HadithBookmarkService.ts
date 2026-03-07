/**
 * HadithBookmarkService — Persistence layer for bookmarked hadiths.
 * Uses AsyncStorage for local persistence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'hadith_bookmarks';

export class HadithBookmarkService {
    /** Get all bookmarked hadith IDs */
    static async getBookmarks(): Promise<string[]> {
        try {
            const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /** Add a hadith to bookmarks */
    static async addBookmark(hadithId: string): Promise<void> {
        const bookmarks = await this.getBookmarks();
        if (!bookmarks.includes(hadithId)) {
            bookmarks.push(hadithId);
            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
    }

    /** Remove a hadith from bookmarks */
    static async removeBookmark(hadithId: string): Promise<void> {
        const bookmarks = await this.getBookmarks();
        const filtered = bookmarks.filter(id => id !== hadithId);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    }

    /** Check if a hadith is bookmarked */
    static async isBookmarked(hadithId: string): Promise<boolean> {
        const bookmarks = await this.getBookmarks();
        return bookmarks.includes(hadithId);
    }

    /** Get bookmark count */
    static async getBookmarkCount(): Promise<number> {
        const bookmarks = await this.getBookmarks();
        return bookmarks.length;
    }

    /** Clear all bookmarks (used on logout/login to prevent leaking between accounts) */
    static async clearAll(): Promise<void> {
        try {
            await AsyncStorage.removeItem(BOOKMARKS_KEY);
        } catch (e) {
            if (__DEV__) console.warn('[HadithBookmarkService] clearAll failed:', e);
        }
    }
}

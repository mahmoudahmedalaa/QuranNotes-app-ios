/**
 * SecureStorage — Encrypted wrapper around expo-secure-store for iOS Keychain.
 *
 * Use this instead of AsyncStorage for any sensitive or personal user data:
 *   - Personal notes content
 *   - Mood history (emotionally sensitive)
 *
 * Includes automatic migration: on first read, checks AsyncStorage for
 * existing data under the original key and migrates it to SecureStore.
 *
 * expo-secure-store limitations:
 *   - Max 2048 bytes per value (use chunking for larger data)
 *   - iOS Keychain backed (hardware-encrypted, survives app reinstall)
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHUNK_SIZE = 2000; // Leave some headroom under the 2048 limit
const CHUNK_COUNT_SUFFIX = '__chunk_count';
const MIGRATED_PREFIX = '__migrated_';

export class SecureStorage {
    /**
     * Store a value securely in the iOS Keychain.
     * Handles values larger than 2048 bytes via chunking.
     */
    static async setItem(key: string, value: string): Promise<void> {
        try {
            if (value.length <= CHUNK_SIZE) {
                // Small value — store directly in SecureStore
                await SecureStore.setItemAsync(key, value);
                // Clean up any old chunks if this was previously chunked
                await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => { });
            } else {
                // Large value — chunk it
                const chunks = Math.ceil(value.length / CHUNK_SIZE);
                await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks));

                for (let i = 0; i < chunks; i++) {
                    const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk);
                }
            }

            // Mark as migrated so we don't re-check AsyncStorage next time
            await AsyncStorage.setItem(`${MIGRATED_PREFIX}${key}`, 'true');
        } catch (error) {
            if (__DEV__) console.warn('[SecureStorage] setItem failed, falling back to AsyncStorage:', error);
            // Fallback to AsyncStorage if SecureStore fails (e.g., simulator issues)
            await AsyncStorage.setItem(key, value);
        }
    }

    /**
     * Retrieve a securely stored value from the iOS Keychain.
     * On first read, automatically migrates data from AsyncStorage if it exists.
     */
    static async getItem(key: string): Promise<string | null> {
        try {
            // Check if this was chunked
            const chunkCountStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);

            if (chunkCountStr) {
                // Reassemble chunks
                const chunks = parseInt(chunkCountStr, 10);
                let value = '';
                for (let i = 0; i < chunks; i++) {
                    const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
                    if (chunk === null) {
                        if (__DEV__) console.warn(`[SecureStorage] Missing chunk ${i} for key ${key}`);
                        return null;
                    }
                    value += chunk;
                }
                return value;
            }

            // Try direct read from SecureStore
            const value = await SecureStore.getItemAsync(key);
            if (value !== null) return value;

            // ── AUTO-MIGRATION ──────────────────────────────────────
            // First access: check if data exists in AsyncStorage under the
            // ORIGINAL key (not prefixed) and migrate it to SecureStore.
            const alreadyMigrated = await AsyncStorage.getItem(`${MIGRATED_PREFIX}${key}`);
            if (alreadyMigrated) return null; // Already checked, nothing there

            const legacyData = await AsyncStorage.getItem(key);
            if (legacyData) {
                if (__DEV__) console.log(`[SecureStorage] Migrating "${key}" from AsyncStorage → SecureStore`);
                // Migrate to SecureStore
                await SecureStorage.setItem(key, legacyData);
                // Don't delete from AsyncStorage yet — keeps as backup
                return legacyData;
            }

            // Nothing found anywhere
            await AsyncStorage.setItem(`${MIGRATED_PREFIX}${key}`, 'true');
            return null;
        } catch (error) {
            if (__DEV__) console.warn('[SecureStorage] getItem failed, trying AsyncStorage fallback:', error);
            // Last resort: read from AsyncStorage directly (original key)
            return AsyncStorage.getItem(key);
        }
    }

    /**
     * Delete a securely stored value.
     */
    static async deleteItem(key: string): Promise<void> {
        try {
            // Delete direct value
            await SecureStore.deleteItemAsync(key);

            // Delete any chunks
            const chunkCountStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
            if (chunkCountStr) {
                const chunks = parseInt(chunkCountStr, 10);
                for (let i = 0; i < chunks; i++) {
                    await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
                }
                await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
            }

            // Clean up migration marker and legacy data
            await AsyncStorage.removeItem(`${MIGRATED_PREFIX}${key}`);
            await AsyncStorage.removeItem(key);
        } catch (error) {
            if (__DEV__) console.warn('[SecureStorage] deleteItem failed:', error);
        }
    }
}

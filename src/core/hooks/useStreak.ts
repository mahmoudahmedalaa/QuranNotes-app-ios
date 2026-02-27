import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStreak, INITIAL_STREAK } from '../domain/entities/UserStreak';
import { StreakService } from '../application/services/StreakService';
import { useAuth } from '../../features/auth/infrastructure/AuthContext';

const LEGACY_KEY = 'reflection_streaks';
const getStorageKey = (uid?: string) => uid ? `reflection_streaks_${uid}` : LEGACY_KEY;

export const useStreak = () => {
    const { user } = useAuth();
    const [streak, setStreak] = useState<UserStreak>(INITIAL_STREAK);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreak();

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                loadStreak();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [user?.id]);

    const loadStreak = async () => {
        try {
            const scopedKey = getStorageKey(user?.id);
            let data = await AsyncStorage.getItem(scopedKey);

            // Migration: if no user-scoped data exists, try the legacy global key
            if (!data && user?.id) {
                const legacyData = await AsyncStorage.getItem(LEGACY_KEY);
                if (legacyData) {
                    // Migrate: copy to user-scoped key, remove legacy
                    await AsyncStorage.setItem(scopedKey, legacyData);
                    await AsyncStorage.removeItem(LEGACY_KEY);
                    data = legacyData;
                }
            }

            if (data) {
                let parsed: UserStreak = JSON.parse(data);
                // Validate if streak is still active
                parsed = StreakService.validateStreak(parsed, new Date());
                setStreak(parsed);
                // Update storage if validated (e.g. if it was reset)
                await AsyncStorage.setItem(scopedKey, JSON.stringify(parsed));
            }
        } catch (error) {
            console.error('Failed to load streak:', error);
        } finally {
            setLoading(false);
        }
    };

    const recordActivity = async () => {
        try {
            const newStreak = StreakService.calculateNewStreak(streak, new Date());
            setStreak(newStreak);
            await AsyncStorage.setItem(getStorageKey(user?.id), JSON.stringify(newStreak));
        } catch (error) {
            console.error('Failed to record activity:', error);
        }
    };

    return {
        streak,
        loading,
        recordActivity,
        refreshStreak: loadStreak,
    };
};

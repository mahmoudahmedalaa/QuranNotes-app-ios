import { UserStreak } from '../../domain/entities/UserStreak';

export class StreakService {
    /**
     * Calculates the updated streak based on a new activity date.
     */
    static calculateNewStreak(currentStreak: UserStreak, activityDate: Date): UserStreak {
        const todayStr = this.formatDate(activityDate);
        const lastDateStr = currentStreak.lastReflectionDate;

        if (lastDateStr === todayStr) {
            // Already reflected today, just increment total count
            return {
                ...currentStreak,
                totalReflections: currentStreak.totalReflections + 1,
            };
        }

        const yesterday = new Date(activityDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDate(yesterday);

        let newCurrentStreak = 1;
        if (lastDateStr === yesterdayStr) {
            // Consecutive day
            newCurrentStreak = currentStreak.currentStreak + 1;
        }

        const newLongestStreak = Math.max(newCurrentStreak, currentStreak.longestStreak);

        const newHistory = { ...currentStreak.activityHistory };
        newHistory[todayStr] = (newHistory[todayStr] || 0) + 1;

        return {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastReflectionDate: todayStr,
            totalReflections: currentStreak.totalReflections + 1,
            activityHistory: newHistory,
        };
    }

    /**
     * Checks if a streak is still active or should be reset.
     * Should be called on app launch.
     */
    static validateStreak(streak: UserStreak, currentDate: Date): UserStreak {
        if (!streak.lastReflectionDate) return streak;

        const todayStr = this.formatDate(currentDate);
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDate(yesterday);

        if (streak.lastReflectionDate !== todayStr && streak.lastReflectionDate !== yesterdayStr) {
            // Streak broken (missed yesterday and today isn't updated yet)
            return {
                ...streak,
                currentStreak: 0,
            };
        }

        return streak;
    }

    private static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

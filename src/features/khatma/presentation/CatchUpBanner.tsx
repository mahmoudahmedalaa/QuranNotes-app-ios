/**
 * CatchUpBanner — Motivational, contextual message below the progress ring.
 *
 * Messages are calming & encouraging, never stressful.
 * They rotate based on progress milestones, pages read, and remaining juz.
 * No redundant "X of 30" — the ring already shows that.
 */
import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Spacing } from '../../../core/theme/DesignSystem';

const ACCENT = {
    gold: '#F5A623',
    green: '#10B981',
};

interface CatchUpBannerProps {
    isComplete: boolean;
    completedCount: number;
    totalPagesRead?: number;
}

export const CatchUpBanner: React.FC<CatchUpBannerProps> = ({
    isComplete,
    completedCount,
    totalPagesRead = 0,
}) => {
    const theme = useTheme();

    const message = useMemo(() => {
        if (isComplete) return 'Alhamdulillah — your Khatma is complete 🤲';

        const remaining = 30 - completedCount;

        // ── Milestone messages ──
        if (completedCount === 0)
            return 'Every journey begins with a single page ✨';

        if (completedCount === 1)
            return 'Your first Juz — a blessed beginning';

        if (completedCount === 5)
            return 'Five Juz down — MashAllah!';

        if (completedCount === 10)
            return 'A third of the way — SubhanAllah 🌙';

        if (completedCount === 15)
            return 'Halfway there — may Allah reward your effort 💫';

        if (completedCount === 20)
            return 'Two-thirds complete — the finish line is near';

        if (completedCount === 25)
            return 'Five more to go — almost there!';

        if (completedCount >= 28)
            return `Just ${remaining} left — you can do this 🤲`;

        // ── Contextual rotating messages ──
        // Rotate based on completedCount to feel dynamic
        const pool: string[] = [];

        if (totalPagesRead > 0) {
            pool.push(`${totalPagesRead} pages read — MashAllah`);
        }

        if (remaining <= 10) {
            pool.push(`${remaining} Juz to go — keep it up`);
        }

        pool.push('Every page brings you closer ✨');
        pool.push('Read at your own pace — no rush 🌿');
        pool.push('Consistency is what matters most');

        if (completedCount > 5) {
            pool.push('Steady progress — keep going');
        }

        if (completedCount > 12) {
            pool.push('More than a third — well on your way');
        }

        // Pick one based on completedCount for stable display
        return pool[completedCount % pool.length];
    }, [isComplete, completedCount, totalPagesRead]);

    const textColor = isComplete
        ? ACCENT.green
        : completedCount >= 25
            ? ACCENT.green
            : completedCount >= 15
                ? ACCENT.gold
                : theme.colors.onSurfaceVariant;

    return (
        <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
        >
            <Text style={[styles.message, { color: textColor }]}>
                {message}
            </Text>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    message: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 16,
        paddingBottom: Spacing.xs,
        lineHeight: 18,
    },
});

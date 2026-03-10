/**
 * StreakBadge — Inline reading streak indicator
 * Shows "N-day streak" when streak > 0
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius } from '../../../core/theme/DesignSystem';

const ACCENT = {
    amber: '#F59E0B',
    amberLight: '#F59E0B20',
};

interface StreakBadgeProps {
    streakDays: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streakDays }) => {

    if (streakDays <= 0) return null;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
        >
            <View style={[styles.badge, { backgroundColor: ACCENT.amberLight }]}>
                <Ionicons name="flame" size={16} color={ACCENT.amber} />
                <Text style={[styles.text, { color: ACCENT.amber }]}>
                    {streakDays}-day streak
                </Text>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        alignSelf: 'center',
    },
    text: {
        fontSize: 13,
        fontWeight: '700',
    },
});

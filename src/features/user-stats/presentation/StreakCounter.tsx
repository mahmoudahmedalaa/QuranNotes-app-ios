import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStreaks } from '../../auth/infrastructure/StreakContext';
import { Spacing, BorderRadius, Shadows, BrandTokens } from '../../../core/theme/DesignSystem';
import { MotiView } from 'moti';

export const StreakCounter: React.FC = () => {
    const { streak, loading } = useStreaks();
    const theme = useTheme();

    if (loading || streak.currentStreak === 0) return null;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: -10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}>
            <Surface
                style={[styles.container, { backgroundColor: theme.colors.surface }]}
                elevation={1}>
                <View style={styles.content}>
                    <MotiView
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: ['0deg', '10deg', '0deg'],
                        }}
                        transition={{
                            loop: true,
                            duration: 2000,
                            type: 'timing',
                        }}>
                        <MaterialCommunityIcons name="fire" size={18} color={theme.colors.primary} />
                    </MotiView>
                    <View style={styles.textContainer}>
                        <Text style={[styles.count, { color: theme.colors.primary }]}>{streak.currentStreak}</Text>
                        <Text style={[styles.label, { color: theme.colors.primary }]}>Day Reflection Streak</Text>
                    </View>
                </View>
            </Surface>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        ...Shadows.sm,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
        alignSelf: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Spacing.xs,
    },
    count: {
        fontWeight: '900',
        fontSize: 15,
        marginRight: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: BrandTokens.light.textSecondary,
    },
});

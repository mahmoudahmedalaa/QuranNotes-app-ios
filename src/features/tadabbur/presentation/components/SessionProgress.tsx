/**
 * SessionProgress — Progress dots indicating verse progression in a Tadabbur session.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface SessionProgressProps {
    total: number;
    current: number;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({ total, current }) => {
    const theme = useTheme();
    const activeColor = theme.dark ? '#A78BFA' : '#8B5CF6';
    const inactiveColor = theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(98,70,234,0.15)';
    const completedColor = theme.dark ? '#7C3AED' : '#6246EA';

    return (
        <View style={styles.container}>
            {Array.from({ length: total }, (_, i) => {
                const isActive = i === current;
                const isCompleted = i < current;

                return (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: isActive
                                    ? activeColor
                                    : isCompleted
                                        ? completedColor
                                        : inactiveColor,
                                width: isActive ? 24 : 8,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
});

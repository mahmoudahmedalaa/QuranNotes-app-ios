/**
 * SourcePicker — Horizontal pill/chip row for selecting tafsir source.
 *
 * Displays [Ibn Kathir] [Al-Sa'di] as toggleable pills.
 * Gold accent for active pill, matches existing design language.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { TafsirSource, TAFSIR_SOURCE_LABELS } from '../domain/types';
import { Spacing, BorderRadius } from '../../../core/theme/DesignSystem';

const GOLD = '#D4A853';
const SOURCES: TafsirSource[] = ['ibn_kathir', 'al_sadi'];

interface SourcePickerProps {
    selected: TafsirSource;
    onSelect: (source: TafsirSource) => void;
}

export const SourcePicker: React.FC<SourcePickerProps> = ({ selected, onSelect }) => {
    const theme = useTheme();

    const handlePress = (source: TafsirSource) => {
        if (source !== selected) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(source);
        }
    };

    return (
        <View style={styles.container}>
            {SOURCES.map((source) => {
                const isActive = source === selected;
                return (
                    <Pressable
                        key={source}
                        onPress={() => handlePress(source)}
                        style={({ pressed }) => [
                            styles.pill,
                            {
                                backgroundColor: isActive
                                    ? `${GOLD}20`
                                    : theme.dark ? '#27272A' : '#F1F5F9',
                                borderColor: isActive ? GOLD : 'transparent',
                            },
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        {isActive && <View style={[styles.dot, { backgroundColor: GOLD }]} />}
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isActive
                                        ? GOLD
                                        : theme.colors.onSurfaceVariant,
                                },
                            ]}
                        >
                            {TAFSIR_SOURCE_LABELS[source]}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
});

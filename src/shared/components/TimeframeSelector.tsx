import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../../core/theme/DesignSystem';

export type TimeframePeriod = '7d' | '30d' | 'all';

interface TimeframeOption {
    value: TimeframePeriod;
    label: string;
}

const DEFAULT_OPTIONS: TimeframeOption[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' },
];

interface TimeframeSelectorProps {
    selected: TimeframePeriod;
    onSelect: (period: TimeframePeriod) => void;
    options?: TimeframeOption[];
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
    selected,
    onSelect,
    options = DEFAULT_OPTIONS,
}) => {
    const theme = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);

    const selectedLabel = options.find(o => o.value === selected)?.label || 'All time';

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={() => setShowDropdown(!showDropdown)}
                style={[
                    styles.trigger,
                    { backgroundColor: theme.dark ? '#27272A' : '#F1F0F7' },
                ]}
            >
                <Text style={[styles.triggerText, { color: theme.colors.onSurface }]}>
                    {selectedLabel}
                </Text>
                <Ionicons
                    name={showDropdown ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                />
            </Pressable>

            {showDropdown && (
                <Modal
                    visible={showDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDropdown(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
                        <View style={styles.backdrop}>
                            <View
                                style={[
                                    styles.centeredDropdown,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderColor: theme.dark ? '#3F3F46' : '#E2E8F0',
                                    },
                                ]}
                            >
                                <Text style={[styles.dropdownTitle, { color: theme.colors.onSurfaceVariant }]}>
                                    Select timeframe
                                </Text>
                                {options.map((option) => (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => {
                                            onSelect(option.value);
                                            setShowDropdown(false);
                                        }}
                                        style={[
                                            styles.option,
                                            selected === option.value && {
                                                backgroundColor: theme.colors.primary + '12',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {
                                                    color: selected === option.value
                                                        ? theme.colors.primary
                                                        : theme.colors.onSurface,
                                                    fontWeight: selected === option.value ? '700' : '500',
                                                },
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                        {selected === option.value && (
                                            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: BorderRadius.lg,
    },
    triggerText: {
        fontSize: 12,
        fontWeight: '600',
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    centeredDropdown: {
        width: 220,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingVertical: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    dropdownTitle: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        marginHorizontal: 6,
        borderRadius: BorderRadius.md,
    },
    optionText: {
        fontSize: 15,
    },
});

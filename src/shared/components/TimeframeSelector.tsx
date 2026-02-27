import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Menu, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius } from '../../core/theme/DesignSystem';

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
    const [visible, setVisible] = useState(false);

    const selectedLabel = options.find(o => o.value === selected)?.label || 'All time';

    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchor={
                <Pressable
                    onPress={() => setVisible(true)}
                    style={[
                        styles.trigger,
                        { backgroundColor: theme.dark ? '#27272A' : '#F1F0F7' },
                    ]}
                >
                    <Text style={[styles.triggerText, { color: theme.colors.onSurface }]}>
                        {selectedLabel}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={12}
                        color={theme.colors.onSurfaceVariant}
                    />
                </Pressable>
            }
            contentStyle={{
                backgroundColor: theme.colors.surface,
                borderRadius: BorderRadius.lg,
            }}
        >
            {options.map((option) => (
                <Menu.Item
                    key={option.value}
                    onPress={() => {
                        onSelect(option.value);
                        setVisible(false);
                    }}
                    title={option.label}
                    titleStyle={{
                        color: selected === option.value
                            ? theme.colors.primary
                            : theme.colors.onSurface,
                        fontWeight: selected === option.value ? '700' : '400',
                        fontSize: 14,
                    }}
                    leadingIcon={selected === option.value ? 'check' : undefined}
                />
            ))}
        </Menu>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    },
    triggerText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

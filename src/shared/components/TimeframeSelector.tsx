import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
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
    const buttonRef = useRef<View>(null);
    const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const selectedLabel = options.find(o => o.value === selected)?.label || 'All time';

    const openDropdown = () => {
        buttonRef.current?.measureInWindow((x, y, w, h) => {
            setButtonLayout({ x, y, w, h });
            setShowDropdown(true);
        });
    };

    return (
        <>
            <Pressable
                ref={buttonRef}
                onPress={openDropdown}
                style={[
                    styles.trigger,
                    { backgroundColor: theme.colors.surfaceVariant + '80' },
                ]}
            >
                <Text style={[styles.triggerText, { color: theme.colors.onSurfaceVariant }]}>
                    {selectedLabel}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                />
            </Pressable>

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
                                styles.dropdown,
                                {
                                    backgroundColor: theme.colors.surface,
                                    top: buttonLayout.y + buttonLayout.h + 4,
                                    right: 16,
                                    borderColor: theme.dark ? '#333' : '#E2E8F0',
                                },
                            ]}
                        >
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
                                            backgroundColor: theme.colors.primary + '15',
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
                                        <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.md,
    },
    triggerText: {
        fontSize: 12,
        fontWeight: '600',
    },
    backdrop: {
        flex: 1,
    },
    dropdown: {
        position: 'absolute',
        minWidth: 150,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
    },
    optionText: {
        fontSize: 14,
    },
});

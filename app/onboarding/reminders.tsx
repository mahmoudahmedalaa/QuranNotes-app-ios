import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import { useSettings } from '../../src/features/settings/infrastructure/SettingsContext';
import { NotificationService } from '../../src/features/notifications/infrastructure/NotificationService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
    Spacing,
    BorderRadius,
    Shadows,
    Gradients,
} from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

export default function OnboardingReminders() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep } = useOnboarding();
    const { updateSettings } = useSettings();

    const [enabled, setEnabled] = useState(true); // Opted-in by default
    const [navigating, setNavigating] = useState(false);
    const [selectedChip, setSelectedChip] = useState<string>('Dhuhr');
    const [pickerDate, setPickerDate] = useState(() => {
        const d = new Date();
        d.setHours(12, 30, 0, 0); // Default to 12:30 PM for Dhuhr
        return d;
    });

    const handleToggle = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEnabled(value);
    };

    const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setPickerDate(selectedDate);
            setSelectedChip('Custom');
        }
    };

    const navigateNext = () => {
        goToStep(8);
        router.push('/onboarding/premium');
    };

    const handleContinue = async () => {
        if (navigating) return; // Prevent double-tap
        setNavigating(true);

        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const hour = pickerDate.getHours();
            const minute = pickerDate.getMinutes();

            if (enabled) {
                try {
                    const granted = await NotificationService.requestPermissions();
                    if (granted) {
                        try {
                            await NotificationService.scheduleDailyReminder(hour, minute);
                        } catch (scheduleErr) {
                            if (__DEV__) console.warn('[Onboarding] Failed to schedule reminder:', scheduleErr);
                        }
                        try {
                            await updateSettings({
                                dailyReminderEnabled: true,
                                reminderHour: hour,
                                reminderMinute: minute,
                            });
                        } catch (settingsErr) {
                            if (__DEV__) console.warn('[Onboarding] Failed to save settings:', settingsErr);
                        }
                    }
                } catch (permErr) {
                    if (__DEV__) console.warn('[Onboarding] Notification permission error:', permErr);
                }
            }

            navigateNext();
        } catch (err) {
            if (__DEV__) console.warn('[Onboarding] handleContinue error:', err);
            // Still navigate even if something failed
            navigateNext();
        }
    };

    const handleSkip = () => {
        if (navigating) return;
        setNavigating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigateNext();
    };

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor:
                                        i < 6
                                            ? theme.colors.primary
                                            : theme.colors.surfaceVariant,
                                    width: i === 5 ? 20 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Header with Icon */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.header}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(91,127,255,0.1)' },
                        ]}>
                        <Ionicons name="notifications" size={40} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                        Daily Quran Reminder
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        A gentle nudge to keep your heart connected to Allah&apos;s words
                    </Text>
                </MotiView>

                {/* Main Card — scrollable to prevent overflow */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentInner}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 300 }}
                    >
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: theme.colors.surface },
                                Shadows.md,
                            ]}>
                            {/* Toggle Row */}
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <Text style={[styles.toggleTitle, { color: theme.colors.onSurface }]}>
                                        Daily Reminders
                                    </Text>
                                    <Text style={[styles.toggleDesc, { color: theme.colors.onSurfaceVariant }]}>
                                        Get notified to read Quran daily
                                    </Text>
                                </View>
                                <Switch
                                    value={enabled}
                                    onValueChange={handleToggle}
                                    trackColor={{ false: '#48484A', true: theme.colors.primary }}
                                    thumbColor={enabled ? '#FFF' : '#F4F4F4'}
                                />
                            </View>

                            {/* Time Picker — visible when enabled */}
                            {enabled && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <View style={[styles.timeSeparator, { backgroundColor: theme.colors.outlineVariant }]} />

                                    {/* Prayer Time Selection */}
                                    <View style={styles.suggestedTimes}>
                                        <Text style={[styles.suggestedLabel, { color: theme.colors.onSurfaceVariant }]}>
                                            Set by prayer time:
                                        </Text>
                                        {[
                                            { label: 'Fajr', icon: 'partly-sunny-outline', key: 'Fajr', hour: 5, minute: 30, desc: '5:30 AM' },
                                            { label: 'Dhuhr', icon: 'sunny-outline', key: 'Dhuhr', hour: 12, minute: 30, desc: '12:30 PM' },
                                            { label: 'Asr', icon: 'time-outline', key: 'Asr', hour: 15, minute: 30, desc: '3:30 PM' },
                                            { label: 'Maghrib', icon: 'partly-sunny-outline', key: 'Maghrib', hour: 18, minute: 15, desc: '6:15 PM' },
                                            { label: 'Isha', icon: 'moon-outline', key: 'Isha', hour: 21, minute: 0, desc: '9:00 PM' },
                                        ].map((time) => {
                                            const isActive = selectedChip === time.key;
                                            return (
                                                <Pressable
                                                    key={time.key}
                                                    style={({ pressed }) => [
                                                        styles.prayerRow,
                                                        isActive && { backgroundColor: theme.colors.primaryContainer },
                                                        pressed && { opacity: 0.7 },
                                                    ]}
                                                    onPress={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        setSelectedChip(time.key);
                                                        const d = new Date();
                                                        d.setHours(time.hour, time.minute, 0, 0);
                                                        setPickerDate(d);
                                                    }}>
                                                    <View style={styles.prayerIconContainer}>
                                                        <Ionicons name={time.icon as any} size={20} color={theme.colors.onSurfaceVariant} />
                                                    </View>
                                                    <Text style={[styles.prayerLabel, { color: theme.colors.onSurface }]}>
                                                        {time.label}
                                                    </Text>
                                                    <Text style={[styles.prayerTime, { color: theme.colors.onSurfaceVariant }]}>
                                                        {time.desc}
                                                    </Text>
                                                    {isActive && (
                                                        <Ionicons
                                                            name="checkmark-circle"
                                                            size={20}
                                                            color={theme.colors.primary}
                                                            style={{ marginLeft: Spacing.xs }}
                                                        />
                                                    )}
                                                </Pressable>
                                            );
                                        })}

                                        {/* Custom Time */}
                                        <View style={[styles.customDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                                        <View style={styles.customTimeRow}>
                                            <View style={styles.prayerIconContainer}>
                                                <Ionicons name="time-outline" size={20} color={theme.colors.onSurfaceVariant} />
                                            </View>
                                            <Text style={[styles.prayerLabel, {
                                                color: selectedChip === 'Custom' ? theme.colors.primary : theme.colors.onSurface,
                                                fontWeight: selectedChip === 'Custom' ? '700' : '500',
                                            }]}>
                                                Custom Time
                                            </Text>
                                            <DateTimePicker
                                                value={pickerDate}
                                                mode="time"
                                                is24Hour={false}
                                                onChange={handleTimeChange}
                                                display="default"
                                                themeVariant={theme.dark ? 'dark' : 'light'}
                                            />
                                        </View>
                                    </View>
                                </MotiView>
                            )}
                        </View>
                    </MotiView>
                </ScrollView>

                {/* CTA Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 600 }}
                    style={styles.ctaContainer}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.ctaButton}
                        labelStyle={styles.ctaLabel}
                        contentStyle={{ height: 54 }}>
                        {enabled ? 'Set Reminder & Continue' : 'Continue'}
                    </Button>
                    <Pressable onPress={handleSkip} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
                            Skip for now
                        </Text>
                    </Pressable>
                </MotiView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingTop: Spacing.md,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    contentInner: {
        paddingBottom: Spacing.md,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    toggleTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    toggleDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    timeSeparator: {
        height: StyleSheet.hairlineWidth,
        marginVertical: Spacing.md,
    },
    timeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    timeLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    suggestedTimes: {
        marginTop: Spacing.lg,
    },
    suggestedLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: 2,
    },
    prayerIconContainer: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    prayerLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginLeft: Spacing.sm,
    },
    prayerTime: {
        fontSize: 13,
        fontWeight: '400',
    },
    customDivider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: Spacing.sm,
    },
    customTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
    },
    ctaContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    ctaButton: {
        borderRadius: BorderRadius.xl,
    },
    ctaLabel: {
        fontSize: 17,
        fontWeight: '700',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '500',
    },
});

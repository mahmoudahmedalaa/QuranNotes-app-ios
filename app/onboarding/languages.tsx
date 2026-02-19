import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/infrastructure/onboarding/OnboardingContext';
import { useSettings } from '../../src/infrastructure/settings/SettingsContext';
import { getAvailableLanguages, getEditionById } from '../../src/domain/entities/TranslationEdition';
import {
    Spacing,
    BorderRadius,
    Shadows,
    Gradients,
} from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

export default function OnboardingLanguages() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep } = useOnboarding();
    const { settings, updateSettings } = useSettings();

    const languages = getAvailableLanguages();
    const currentEdition = getEditionById(settings.translationEdition);

    const handleContinue = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(12);
        router.push('/onboarding/premium');
    };

    const handleSelectEdition = (identifier: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings({ translationEdition: identifier });
    };

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(step => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor:
                                        step <= 11
                                            ? theme.colors.primary
                                            : theme.colors.surfaceVariant,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Header */}
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
                        <Text style={{ fontSize: 44 }}>🌍</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                        Read in Your Language
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Choose your preferred translation — you can always change this later in Settings
                    </Text>
                </MotiView>

                {/* Language Picker */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 300 }}
                    style={styles.content}>
                    <ScrollView
                        style={[
                            styles.card,
                            { backgroundColor: theme.colors.surface },
                            Shadows.md,
                        ]}
                        contentContainerStyle={styles.cardContent}
                        showsVerticalScrollIndicator={false}>
                        {languages.map((lang) => (
                            <View key={lang.language}>
                                {lang.editions.map((edition, index) => {
                                    const isActive = settings.translationEdition === edition.identifier;
                                    return (
                                        <Pressable
                                            key={edition.identifier}
                                            style={({ pressed }) => [
                                                styles.languageRow,
                                                isActive && { backgroundColor: theme.colors.primaryContainer },
                                                pressed && { opacity: 0.7 },
                                            ]}
                                            onPress={() => handleSelectEdition(edition.identifier)}>
                                            <Text style={styles.flag}>{edition.flag}</Text>
                                            <View style={styles.languageInfo}>
                                                <Text style={[styles.languageName, { color: theme.colors.onSurface }]}>
                                                    {edition.languageName}
                                                </Text>
                                                <Text style={[styles.translatorName, { color: theme.colors.onSurfaceVariant }]}>
                                                    {edition.name}
                                                </Text>
                                            </View>
                                            {isActive && (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    color={theme.colors.primary}
                                                />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </MotiView>

                {/* CTA */}
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
                        {currentEdition ? `Continue with ${currentEdition.languageName}` : 'Continue'}
                    </Button>
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
        gap: 5,
        paddingTop: Spacing.md,
    },
    progressDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
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
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.8,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.xl,
        maxHeight: 360,
    },
    cardContent: {
        padding: Spacing.sm,
    },
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: 2,
    },
    flag: {
        fontSize: 22,
        width: 32,
        textAlign: 'center',
    },
    languageInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    languageName: {
        fontSize: 15,
        fontWeight: '600',
    },
    translatorName: {
        fontSize: 12,
        marginTop: 1,
        opacity: 0.8,
    },
    ctaContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.md,
    },
    ctaButton: {
        borderRadius: BorderRadius.xl,
    },
    ctaLabel: {
        fontSize: 17,
        fontWeight: '700',
    },
});

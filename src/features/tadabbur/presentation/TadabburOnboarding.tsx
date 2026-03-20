/**
 * TadabburOnboarding — First-time overlay explaining how Tadabbur Mode works.
 * Shown once, then dismissed permanently.
 *
 * v2 — Islamic-grounded guide:
 *  - Connects each step to Quranic/Prophetic tradition
 *  - User must tap "I'm Ready" — no auto-dismiss
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTadabbur } from '../infrastructure/TadabburContext';

const STEPS = [
    {
        icon: 'book-open-variant' as const,
        title: 'Listen & Read',
        description: 'A verse is recited and displayed for you.',
    },
    {
        icon: 'meditation' as const,
        title: 'Pause & Contemplate',
        description: 'Sit in silence and let the words settle.',
    },
    {
        icon: 'pen' as const,
        title: 'Reflect & Write',
        description: 'Write what the verse means to you.',
    },
];

export const TadabburOnboarding: React.FC = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { dismissOnboarding } = useTadabbur();

    const handleDismiss = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dismissOnboarding();
    };

    return (
        <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
                styles.overlay,
                {
                    backgroundColor: theme.dark
                        ? '#09090B'
                        : '#F8F5FF',
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                },
            ]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <MotiView
                        from={{ opacity: 0, translateY: -10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 500 }}
                    >
                        <Text
                            style={[
                                styles.bismillah,
                                { color: theme.dark ? '#A78BFA' : '#6246EA' },
                            ]}
                        >
                            بِسْمِ اللَّهِ
                        </Text>
                    </MotiView>

                    <Text
                        style={[
                            styles.title,
                            { color: theme.dark ? '#FAFAFA' : '#1C1033' },
                        ]}
                    >
                        Welcome to Tadabbur
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            { color: theme.dark ? '#A1A1AA' : '#64748B' },
                        ]}
                    >{`A guided journey to deeply reflect on Allah's words — the way it was meant to be recited.`}</Text>

                    {/* Steps */}
                    <View style={styles.steps}>
                        {STEPS.map((step, i) => (
                            <MotiView
                                key={step.title}
                                from={{ opacity: 0, translateX: -12 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{
                                    type: 'timing',
                                    duration: 400,
                                    delay: 300 + i * 200,
                                }}
                            >
                                <View style={styles.stepRow}>
                                    <View
                                        style={[
                                            styles.stepIcon,
                                            {
                                                backgroundColor: theme.dark
                                                    ? 'rgba(167,139,250,0.15)'
                                                    : 'rgba(98,70,234,0.1)',
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={step.icon}
                                            size={22}
                                            color={
                                                theme.dark ? '#A78BFA' : '#6246EA'
                                            }
                                        />
                                    </View>
                                    <View style={styles.stepText}>
                                        <Text
                                            style={[
                                                styles.stepTitle,
                                                {
                                                    color: theme.dark
                                                        ? '#FAFAFA'
                                                        : '#1C1033',
                                                },
                                            ]}
                                        >
                                            {step.title}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.stepDesc,
                                                {
                                                    color: theme.dark
                                                        ? '#A1A1AA'
                                                        : '#64748B',
                                                },
                                            ]}
                                        >
                                            {step.description}
                                        </Text>
                                    </View>
                                </View>
                            </MotiView>
                        ))}
                    </View>

                    {/* Quranic reminder */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 600, delay: 900 }}
                    >
                        <View
                            style={[
                                styles.quoteBox,
                                {
                                    backgroundColor: theme.dark
                                        ? 'rgba(167,139,250,0.08)'
                                        : 'rgba(139,92,246,0.06)',
                                    borderColor: theme.dark
                                        ? 'rgba(167,139,250,0.2)'
                                        : 'rgba(139,92,246,0.15)',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.quoteArabic,
                                    { color: theme.dark ? '#A78BFA' : '#6246EA' },
                                ]}
                            >
                                كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ
                            </Text>
                            <Text
                                style={[
                                    styles.quoteEnglish,
                                    { color: theme.dark ? '#A1A1AA' : '#64748B' },
                                ]}
                            >{`"A blessed Book We have revealed to you, so that they may contemplate its verses." — Surah Sad (38:29)`}</Text>
                        </View>
                    </MotiView>

                    {/* CTA */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 400, delay: 1100 }}
                        style={styles.ctaWrapper}
                    >
                        <Pressable
                            onPress={handleDismiss}
                            style={({ pressed }) => [
                                styles.startBtn,
                                {
                                    backgroundColor: theme.dark
                                        ? '#A78BFA'
                                        : '#6246EA',
                                    opacity: pressed ? 0.85 : 1,
                                },
                            ]}
                        >
                            <Text style={styles.startBtnText}>{`I'm Ready`}</Text>
                        </Pressable>
                        <Text
                            style={[
                                styles.takeYourTime,
                                { color: theme.dark ? '#71717A' : '#94A3B8' },
                            ]}
                        >
                            Take your time — there is no rush
                        </Text>
                    </MotiView>
                </View>
            </ScrollView>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    content: {
        paddingHorizontal: 28,
        alignItems: 'center',
        width: '100%',
    },
    bismillah: {
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    steps: {
        width: '100%',
        gap: 22,
        marginBottom: 28,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    stepIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepText: {
        flex: 1,
        gap: 3,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    stepDesc: {
        fontSize: 13,
        lineHeight: 19,
    },
    quoteBox: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
        marginBottom: 32,
        alignItems: 'center',
        gap: 8,
    },
    quoteArabic: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 30,
    },
    quoteEnglish: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 19,
        fontStyle: 'italic',
    },
    ctaWrapper: {
        width: '100%',
        alignItems: 'center',
        gap: 10,
    },
    startBtn: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
    },
    startBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    takeYourTime: {
        fontSize: 13,
        fontStyle: 'italic',
    },
});

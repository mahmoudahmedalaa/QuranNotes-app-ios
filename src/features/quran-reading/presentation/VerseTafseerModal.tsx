/**
 * VerseTafseerModal — Bottom sheet modal for AI verse explanations.
 * Glassmorphic dark card with gold accent header.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { GeminiAPI } from '../../../core/api/GeminiAPI';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const GOLD = '#D4A853';
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface VerseTafseerModalProps {
    visible: boolean;
    onDismiss: () => void;
    arabicText: string;
    translation: string;
    surahName: string;
    verseNumber: number;
}

export const VerseTafseerModal: React.FC<VerseTafseerModalProps> = ({
    visible,
    onDismiss,
    arabicText,
    translation,
    surahName,
    verseNumber,
}) => {
    const theme = useTheme();
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;

        setLoading(true);
        setError(null);
        setExplanation('');

        GeminiAPI.explainVerse(arabicText, translation, surahName, verseNumber)
            .then((text) => {
                setExplanation(text);
                setLoading(false);
            })
            .catch((err) => {
                const message = err?.message || 'Unable to generate explanation.';
                if (message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
                    setError('AI explanations are not available. Please configure the API key.');
                } else if (message.includes('quota')) {
                    setError(message);
                } else if (message.includes('API key')) {
                    setError(message);
                } else {
                    setError('Unable to generate explanation. Please try again.');
                }
                setLoading(false);
            });
    }, [visible, arabicText, translation, surahName, verseNumber]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onDismiss}
        >
            <View style={styles.backdrop}>
                <Pressable style={styles.backdropPress} onPress={onDismiss} />

                <MotiView
                    from={{ translateY: 400 }}
                    animate={{ translateY: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={[styles.sheet, { backgroundColor: theme.colors.surface }, Shadows.lg]}
                >
                    {/* Handle indicator */}
                    <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

                    {/* Header */}
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="lightbulb-on" size={22} color={GOLD} />
                        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                            Verse Explanation
                        </Text>
                        <IconButton
                            icon="close"
                            size={20}
                            onPress={onDismiss}
                            iconColor={theme.colors.onSurfaceVariant}
                        />
                    </View>

                    {/* Verse reference */}
                    <View style={[styles.verseRef, { backgroundColor: `${GOLD}15` }]}>
                        <Text style={[styles.verseRefText, { color: GOLD }]}>
                            {surahName} · Verse {verseNumber}
                        </Text>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={GOLD} />
                                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                                    Generating explanation...
                                </Text>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.error} />
                                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        {!loading && !error && explanation && (
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: 'timing', duration: 500 }}
                            >
                                <Text style={[styles.explanationText, { color: theme.colors.onSurface }]}>
                                    {explanation}
                                </Text>
                            </MotiView>
                        )}
                    </ScrollView>

                    {/* Disclaimer */}
                    <View style={[styles.disclaimer, { borderTopColor: theme.colors.outlineVariant }]}>
                        <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
                            Powered by AI — always verify with a qualified scholar
                        </Text>
                    </View>
                </MotiView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdropPress: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        minHeight: SCREEN_HEIGHT * 0.55,
        maxHeight: SCREEN_HEIGHT * 0.8,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        paddingBottom: Spacing.xl,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
    },
    verseRef: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        alignSelf: 'flex-start',
    },
    verseRefText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        marginTop: Spacing.md,
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
    },
    explanationText: {
        fontSize: 15,
        lineHeight: 26,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    disclaimerText: {
        fontSize: 11,
        fontWeight: '500',
    },
});

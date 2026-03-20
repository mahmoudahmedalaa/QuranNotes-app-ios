/**
 * TadabburVerseBlock — Displays the Arabic verse(s) with translation.
 * Fetches real verse text from the Quran API via TadabburContext.
 * User taps "Reflect on this" to move to the pause/response phase.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTadabbur } from '../infrastructure/TadabburContext';

export const TadabburVerseBlock: React.FC = () => {
    const theme = useTheme();
    const { dispatch, currentPassage, versesLoading } = useTadabbur();

    if (!currentPassage) return null;

    const verseRange =
        currentPassage.startVerse === currentPassage.endVerse
            ? `Ayah ${currentPassage.startVerse}`
            : `Ayat ${currentPassage.startVerse}–${currentPassage.endVerse}`;

    // Use enriched surah name or fall back to number
    const surahLabel = currentPassage.surahName
        ? `${currentPassage.surahName} (${currentPassage.surahNameArabic ?? ''})`
        : `Surah ${currentPassage.surahNumber}`;

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch({ type: 'VERSE_COMPLETE' });
    };

    const handleSkip = () => {
        dispatch({ type: 'SKIP_VERSE' });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
            >
                <Text style={[styles.header, { color: theme.dark ? '#A78BFA' : '#6246EA' }]}>
                    {surahLabel} · {verseRange}
                </Text>
            </MotiView>

            {/* Verse content area */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 600, delay: 200 }}
                >
                    <View
                        style={[
                            styles.verseCard,
                            {
                                backgroundColor: theme.dark ? 'rgba(167,139,250,0.06)' : 'rgba(98,70,234,0.04)',
                                borderColor: theme.dark ? 'rgba(167,139,250,0.15)' : 'rgba(98,70,234,0.1)',
                            },
                        ]}
                    >
                        {versesLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.dark ? '#A78BFA' : '#6246EA'} />
                                <Text style={[styles.loadingText, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                                    Loading verses…
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Arabic text */}
                                <Text style={[styles.arabicVerse, { color: theme.dark ? '#E9E5FF' : '#1C1033' }]}>
                                    {currentPassage.arabicText
                                        ? `﴿ ${currentPassage.arabicText} ﴾`
                                        : `Surah ${currentPassage.surahNumber}:${currentPassage.startVerse}–${currentPassage.endVerse}`}
                                </Text>

                                {/* Translation */}
                                {currentPassage.translationText && (
                                    <Text
                                        style={[
                                            styles.translationText,
                                            { color: theme.dark ? '#D4D4D8' : '#374151' },
                                        ]}
                                    >
                                        {currentPassage.translationText}
                                    </Text>
                                )}

                                {/* Reference */}
                                <Text style={[styles.reference, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                                    {surahLabel} · {verseRange}
                                </Text>
                            </>
                        )}
                    </View>
                </MotiView>
            </ScrollView>

            {/* Action buttons */}
            <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 400 }}
                style={styles.actions}
            >
                <Pressable
                    onPress={handleContinue}
                    disabled={versesLoading}
                    style={({ pressed }) => [
                        styles.continueBtn,
                        {
                            backgroundColor: theme.dark ? '#A78BFA' : '#6246EA',
                            opacity: pressed ? 0.85 : versesLoading ? 0.5 : 1,
                        },
                    ]}
                >
                    <MaterialCommunityIcons name="meditation" size={20} color="#FFFFFF" />
                    <Text style={styles.continueBtnText}>Reflect on this</Text>
                </Pressable>

                <Pressable onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                        Skip
                    </Text>
                </Pressable>
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    header: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 0.3,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    verseCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 28,
        alignItems: 'center',
        gap: 16,
    },
    arabicVerse: {
        fontSize: 26,
        lineHeight: 46,
        textAlign: 'center',
        fontWeight: '500',
    },
    translationText: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 8,
    },
    reference: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 32,
    },
    loadingText: {
        fontSize: 14,
    },
    actions: {
        alignItems: 'center',
        gap: 14,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
        width: '100%',
        justifyContent: 'center',
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    skipBtn: {
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

/**
 * TadabburResponsePhase — Displays reflection prompts for the current verse.
 * User selects a prompt, then chooses text or voice (Pro) to record their reflection.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PromptCard } from './components/PromptCard';
import { ReflectionInput } from './components/ReflectionInput';
import { VoiceReflectionRecorder } from './components/VoiceReflectionRecorder';
import { useTadabbur } from '../infrastructure/TadabburContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { useRouter } from 'expo-router';
import type { Reflection } from '../domain/entities/Reflection';
import { useAuth } from '../../auth/infrastructure/AuthContext';

type ResponseMode = 'text' | 'voice';

export const TadabburResponsePhase: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { dispatch, currentPassage, currentPrompt, setCurrentPrompt } = useTadabbur();
    const { user } = useAuth();
    const { isPro } = usePro();
    const [reflectionText, setReflectionText] = useState('');
    const [responseMode, setResponseMode] = useState<ResponseMode>('text');

    if (!currentPassage) return null;

    const prompts = currentPassage.prompts || [];

    const handleSelectPrompt = (prompt: typeof prompts[0]) => {
        Haptics.selectionAsync();
        setCurrentPrompt(prompt);
    };

    const handleSubmitText = () => {
        if (!reflectionText.trim() || !currentPrompt) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const reflection: Reflection = {
            id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sessionId: '',  // Will be filled by context on session completion
            userId: user?.id || 'anonymous',
            surahNumber: currentPassage.surahNumber,
            verseNumber: currentPassage.startVerse,
            type: 'text',
            content: reflectionText.trim(),
            promptUsed: currentPrompt.text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'local',
        };

        dispatch({ type: 'RESPONSE_SUBMITTED', reflection });
        setReflectionText('');
        setCurrentPrompt(null);
    };

    const handleVoiceComplete = (uri: string, durationMs: number) => {
        if (!currentPrompt) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const reflection: Reflection = {
            id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sessionId: '',
            userId: user?.id || 'anonymous',
            surahNumber: currentPassage.surahNumber,
            verseNumber: currentPassage.startVerse,
            type: 'voice',
            audioUri: uri,
            audioDuration: Math.round(durationMs / 1000),
            promptUsed: currentPrompt.text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'local',
        };

        dispatch({ type: 'RESPONSE_SUBMITTED', reflection });
        setCurrentPrompt(null);
        setResponseMode('text');
    };

    const handleSkip = () => {
        dispatch({ type: 'SKIP_VERSE' });
        setCurrentPrompt(null);
    };

    const handleVoiceToggle = () => {
        if (!isPro) {
            router.push('/paywall');
            return;
        }
        Haptics.selectionAsync();
        setResponseMode((prev) => (prev === 'text' ? 'voice' : 'text'));
    };

    const accentColor = theme.dark ? '#A78BFA' : '#6246EA';
    const dimColor = theme.dark ? '#A1A1AA' : '#64748B';

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* If no prompt selected yet, show prompt selection */}
                {!currentPrompt ? (
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 400 }}
                    >
                        <Text style={[styles.heading, { color: theme.dark ? '#E9E5FF' : '#1C1033' }]}>
                            Choose a prompt to reflect on
                        </Text>
                        <View style={styles.promptList}>
                            {prompts.map((p, i) => (
                                <Pressable key={p.id} onPress={() => handleSelectPrompt(p)}>
                                    <PromptCard prompt={p} index={i} />
                                </Pressable>
                            ))}
                        </View>
                    </MotiView>
                ) : (
                    /* Prompt selected — show prompt + response input */
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400 }}
                    >
                        {/* Selected prompt */}
                        <PromptCard prompt={currentPrompt} />

                        {/* Voice/Text toggle (Pro feature) */}
                        <View style={styles.toggleRow}>
                            <Pressable
                                onPress={() => setResponseMode('text')}
                                style={[
                                    styles.toggleBtn,
                                    responseMode === 'text' && {
                                        backgroundColor: `${accentColor}15`,
                                        borderColor: accentColor,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={16}
                                    color={responseMode === 'text' ? accentColor : dimColor}
                                />
                                <Text
                                    style={[
                                        styles.toggleText,
                                        { color: responseMode === 'text' ? accentColor : dimColor },
                                    ]}
                                >
                                    Text
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={handleVoiceToggle}
                                style={[
                                    styles.toggleBtn,
                                    responseMode === 'voice' && isPro && {
                                        backgroundColor: `${accentColor}15`,
                                        borderColor: accentColor,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="microphone-outline"
                                    size={16}
                                    color={
                                        responseMode === 'voice' && isPro
                                            ? accentColor
                                            : dimColor
                                    }
                                />
                                <Text
                                    style={[
                                        styles.toggleText,
                                        {
                                            color:
                                                responseMode === 'voice' && isPro
                                                    ? accentColor
                                                    : dimColor,
                                        },
                                    ]}
                                >
                                    Voice
                                </Text>
                                {!isPro && (
                                    <View style={styles.proPill}>
                                        <Text style={styles.proPillText}>PRO</Text>
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        {/* Response input based on mode */}
                        {responseMode === 'text' ? (
                            <View style={styles.inputArea}>
                                <ReflectionInput
                                    value={reflectionText}
                                    onChangeText={setReflectionText}
                                    placeholder="Share your thoughts…"
                                />
                            </View>
                        ) : (
                            <VoiceReflectionRecorder
                                onRecordingComplete={handleVoiceComplete}
                                onCancel={() => setResponseMode('text')}
                            />
                        )}
                    </MotiView>
                )}
            </ScrollView>

            {/* Bottom actions */}
            <View style={styles.actions}>
                {currentPrompt && responseMode === 'text' && (
                    <Pressable
                        onPress={handleSubmitText}
                        disabled={!reflectionText.trim()}
                        style={({ pressed }) => [
                            styles.submitBtn,
                            {
                                backgroundColor: reflectionText.trim()
                                    ? accentColor
                                    : `${accentColor}4D`,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <Text style={styles.submitText}>Save Reflection</Text>
                    </Pressable>
                )}
                <Pressable onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: dimColor }]}>
                        Skip this verse
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    heading: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    promptList: {
        gap: 12,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    proPill: {
        backgroundColor: 'rgba(167,139,250,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
        marginLeft: 4,
    },
    proPillText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#A78BFA',
        letterSpacing: 0.5,
    },
    inputArea: {
        marginTop: 12,
    },
    actions: {
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
    },
    submitBtn: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    submitText: {
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

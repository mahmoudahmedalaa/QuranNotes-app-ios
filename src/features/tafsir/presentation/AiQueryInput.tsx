/**
 * AiQueryInput — Text input with send button for asking AI about a verse.
 *
 * Features:
 * - "Ask about this verse..." placeholder
 * - Send button with loading state
 * - Error display with retry
 * - Keyboard-aware via standard RN KeyboardAvoidingView (handled by parent)
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, BorderRadius } from '../../../core/theme/DesignSystem';

const GOLD = '#D4A853';

interface AiQueryInputProps {
    onSubmit: (question: string) => void;
    loading: boolean;
    disabled?: boolean;
}

export const AiQueryInput: React.FC<AiQueryInputProps> = ({ onSubmit, loading, disabled }) => {
    const theme = useTheme();
    const [question, setQuestion] = useState('');

    const handleSubmit = () => {
        const trimmed = question.trim();
        if (!trimmed || loading || disabled) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSubmit(trimmed);
        setQuestion('');
    };

    const canSubmit = question.trim().length > 0 && !loading && !disabled;

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.inputRow,
                    {
                        backgroundColor: theme.dark ? '#27272A' : '#F1F5F9',
                        borderColor: theme.colors.outlineVariant,
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name="message-text-outline"
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={[styles.input, { color: theme.colors.onSurface }]}
                    placeholder="Ask about this verse..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={question}
                    onChangeText={setQuestion}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="send"
                    editable={!loading && !disabled}
                    multiline={false}
                    maxLength={300}
                />
                <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                        styles.sendButton,
                        {
                            backgroundColor: canSubmit ? GOLD : 'transparent',
                            opacity: pressed && canSubmit ? 0.8 : 1,
                        },
                    ]}
                    disabled={!canSubmit}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={GOLD} />
                    ) : (
                        <MaterialCommunityIcons
                            name="send"
                            size={16}
                            color={canSubmit ? '#FFFFFF' : theme.colors.onSurfaceVariant}
                        />
                    )}
                </Pressable>
            </View>
            {disabled && (
                <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                    AI features require an internet connection
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        paddingLeft: Spacing.sm,
    },
    inputIcon: {
        marginLeft: 4,
    },
    input: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        paddingHorizontal: Spacing.sm,
    },
    sendButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    hint: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
    },
});

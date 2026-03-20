/**
 * PromptCard — Styled card for displaying a reflection prompt/question.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReflectionPrompt, PromptCategory } from '../../domain/entities/Reflection';

const CATEGORY_ICON: Record<PromptCategory, string> = {
    personal: 'heart-outline',
    gratitude: 'hand-heart',
    action: 'lightning-bolt',
    contemplation: 'thought-bubble-outline',
};

interface PromptCardProps {
    prompt: ReflectionPrompt;
    index?: number;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, index = 0 }) => {
    const theme = useTheme();
    const iconName = CATEGORY_ICON[prompt.category] || 'thought-bubble-outline';

    return (
        <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 80 }}
        >
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: prompt.aiGenerated
                            ? (theme.dark ? 'rgba(167,139,250,0.12)' : 'rgba(98,70,234,0.08)')
                            : (theme.dark ? 'rgba(167,139,250,0.08)' : 'rgba(98,70,234,0.06)'),
                        borderColor: prompt.aiGenerated
                            ? (theme.dark ? 'rgba(167,139,250,0.3)' : 'rgba(98,70,234,0.18)')
                            : (theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(98,70,234,0.12)'),
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name={iconName as any}
                    size={20}
                    color={theme.dark ? '#A78BFA' : '#8B5CF6'}
                    style={styles.icon}
                />
                <View style={styles.textContainer}>
                    <Text
                        style={[
                            styles.text,
                            { color: theme.dark ? '#FAFAFA' : '#1C1033' },
                        ]}
                    >
                        {prompt.text}
                    </Text>
                </View>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    icon: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },

    text: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
});

/**
 * ReflectionInput — Text area with character counter for typed reflections.
 */
import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const MAX_CHARS = 2000;

interface ReflectionInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const ReflectionInput: React.FC<ReflectionInputProps> = ({
    value,
    onChangeText,
    placeholder = 'Write your reflection…',
}) => {
    const theme = useTheme();
    const remaining = MAX_CHARS - value.length;

    return (
        <View style={styles.container}>
            <TextInput
                value={value}
                onChangeText={(t) => {
                    if (t.length <= MAX_CHARS) onChangeText(t);
                }}
                placeholder={placeholder}
                placeholderTextColor={theme.dark ? 'rgba(255,255,255,0.35)' : 'rgba(28,16,51,0.35)'}
                style={[
                    styles.input,
                    {
                        color: theme.dark ? '#FAFAFA' : '#1C1033',
                        backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(98,70,234,0.05)',
                        borderColor: theme.dark ? 'rgba(167,139,250,0.3)' : 'rgba(98,70,234,0.15)',
                    },
                ]}
                multiline
                textAlignVertical="top"
                autoCorrect
                spellCheck
            />
            <Text
                style={[
                    styles.counter,
                    { color: remaining < 100 ? '#EF4444' : (theme.dark ? '#A1A1AA' : '#64748B') },
                ]}
            >
                {remaining}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        minHeight: 160,
        maxHeight: 300,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
        ...Platform.select({
            ios: { paddingTop: 16 },
        }),
    },
    counter: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 6,
        marginRight: 4,
    },
});

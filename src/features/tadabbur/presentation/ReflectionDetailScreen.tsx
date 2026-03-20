/**
 * ReflectionDetailScreen — Single reflection viewer with delete option.
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTadabbur } from '../infrastructure/TadabburContext';
import { Spacing } from '../../../core/theme/DesignSystem';

export const ReflectionDetailScreen: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { reflections, deleteReflection } = useTadabbur();

    const reflection = reflections.find((r) => r.id === id);

    if (!reflection) {
        return (
            <View style={[styles.container, { backgroundColor: theme.dark ? '#09090B' : '#F8F5FF' }]}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.dark ? '#FAFAFA' : '#1C1033'} />
                        </Pressable>
                    </View>
                    <View style={styles.notFound}>
                        <Text style={{ color: theme.dark ? '#A1A1AA' : '#64748B' }}>Reflection not found</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const date = new Date(reflection.createdAt);
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const handleDelete = () => {
        Alert.alert(
            'Delete Reflection',
            'Are you sure you want to delete this reflection? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        await deleteReflection(reflection.id);
                        router.back();
                    },
                },
            ],
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.dark ? '#09090B' : '#F8F5FF' }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.dark ? '#FAFAFA' : '#1C1033'} />
                    </Pressable>
                    <Pressable onPress={handleDelete} hitSlop={12}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.dark ? '#EF4444' : '#E53E3E'} />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Surah reference */}
                    <MotiView
                        from={{ opacity: 0, translateY: -6 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400 }}
                    >
                        <Text style={[styles.surahRef, { color: theme.dark ? '#A78BFA' : '#6246EA' }]}>
                            Surah {reflection.surahNumber}:{reflection.verseNumber}
                        </Text>
                        <Text style={[styles.date, { color: theme.dark ? '#71717A' : '#94A3B8' }]}>
                            {dateStr}
                        </Text>
                    </MotiView>

                    {/* Prompt */}
                    <MotiView
                        from={{ opacity: 0, translateY: 8 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 100 }}
                        style={[
                            styles.promptCard,
                            {
                                backgroundColor: theme.dark ? 'rgba(167,139,250,0.08)' : 'rgba(98,70,234,0.05)',
                                borderColor: theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(98,70,234,0.1)',
                            },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="thought-bubble-outline"
                            size={18}
                            color={theme.dark ? '#A78BFA' : '#8B5CF6'}
                        />
                        <Text style={[styles.promptText, { color: theme.dark ? '#E9E5FF' : '#1C1033' }]}>
                            {reflection.promptUsed}
                        </Text>
                    </MotiView>

                    {/* Reflection content */}
                    <MotiView
                        from={{ opacity: 0, translateY: 8 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 200 }}
                    >
                        <Text style={[styles.content, { color: theme.dark ? '#FAFAFA' : '#1C1033' }]}>
                            {reflection.content || '(No text saved)'}
                        </Text>
                    </MotiView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 80,
        gap: 16,
    },
    surahRef: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    date: {
        fontSize: 13,
        marginTop: 4,
    },
    promptCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 8,
    },
    promptText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    content: {
        fontSize: 17,
        lineHeight: 28,
        marginTop: 4,
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

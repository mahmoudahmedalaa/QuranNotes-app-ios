/**
 * ReflectionsListScreen — Chronological list of past reflections.
 * Accessible from the Library tab or Tadabbur card.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useTadabbur } from '../infrastructure/TadabburContext';
import type { Reflection } from '../domain/entities/Reflection';
import { Spacing } from '../../../core/theme/DesignSystem';

export const ReflectionsListScreen: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { reflections } = useTadabbur();

    const handleBack = () => router.back();
    const handleOpenReflection = (id: string) => {
        router.push({ pathname: '/reflection-detail' as any, params: { id } });
    };

    const renderItem = useCallback(
        ({ item, index }: { item: Reflection; index: number }) => {
            const date = new Date(item.createdAt);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

            return (
                <MotiView
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                >
                    <Pressable
                        onPress={() => handleOpenReflection(item.id)}
                        style={({ pressed }) => [
                            styles.card,
                            {
                                backgroundColor: theme.dark ? '#18181B' : '#FFFFFF',
                                borderColor: theme.dark ? 'rgba(167,139,250,0.15)' : 'rgba(98,70,234,0.08)',
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.surahRef, { color: theme.dark ? '#A78BFA' : '#6246EA' }]}>
                                Surah {item.surahNumber}:{item.verseNumber}
                            </Text>
                            <Text style={[styles.date, { color: theme.dark ? '#71717A' : '#94A3B8' }]}>
                                {dateStr}
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            style={[styles.content, { color: theme.dark ? '#FAFAFA' : '#1C1033' }]}
                        >
                            {item.content || '(No text)'}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={[styles.prompt, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}
                        >
                            {item.promptUsed}
                        </Text>
                    </Pressable>
                </MotiView>
            );
        },
        [theme.dark],
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={56}
                color={theme.dark ? '#3F3F46' : '#CBD5E1'}
            />
            <Text style={[styles.emptyTitle, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                No reflections yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.dark ? '#71717A' : '#94A3B8' }]}>
                Start a Tadabbur session to begin your reflection journey
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.dark ? '#09090B' : '#F8F5FF' }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} hitSlop={12}>
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color={theme.dark ? '#FAFAFA' : '#1C1033'}
                        />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.dark ? '#FAFAFA' : '#1C1033' }]}>
                        My Reflections
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* List */}
                <FlatList
                    data={reflections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={EmptyState}
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    listContent: {
        padding: Spacing.md,
        gap: 12,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    surahRef: {
        fontSize: 14,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
    },
    prompt: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

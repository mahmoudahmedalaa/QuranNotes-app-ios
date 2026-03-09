import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Modal, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Colors } from '../../theme/DesignSystem';
import * as Haptics from 'expo-haptics';

interface SurahPickerProps {
    visible: boolean;
    onDismiss: () => void;
    onSelect: (surahNumber: number) => void;
    surahs: { number: number; name: string; englishName: string }[];
}

// ── Fuzzy search helpers ────────────────────────────────────────────────

/**
 * Normalize a string for fuzzy matching of Arabic transliterations.
 * Handles: hyphens, doubled vowels, common letter variants, diacritics.
 *
 * Examples:
 *   "Al-Ahzaab" → "alahzab"
 *   "Al Ahzab"  → "alahzab"
 *   "Yaseen"    → "yasin"
 *   "At-Tawbah" → "atawbah" (matches "tawba", "tawbah", etc.)
 */
function normalize(str: string): string {
    return str
        .toLowerCase()
        .replace(/[-''`_]/g, '')        // strip hyphens, apostrophes, underscores
        .replace(/\s+/g, '')            // strip spaces
        // Collapse doubled vowels: aa→a, ee→i, oo→u, ii→i, uu→u
        .replace(/aa/g, 'a')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/ii/g, 'i')
        .replace(/uu/g, 'u')
        // Common transliteration equivalences
        .replace(/th/g, 't')            // "th" → "t" (Thaaha/Taha)
        .replace(/dh/g, 'd')            // "dh" → "d"
        .replace(/sh/g, 's')            // will be careful — "sh" is common
        .replace(/kh/g, 'k')            // "kh" → "k"
        .replace(/gh/g, 'g')            // "gh" → "g"
        .replace(/ph/g, 'f')            // unlikely but safe
        // Strip trailing 'h' for cases like "tawbah" vs "tawba", "fatiha" vs "fatihah"
        .replace(/h$/, '');
}

/**
 * Score a candidate string against a query using fuzzy matching.
 * Returns a score: higher is better, 0 means no match.
 *
 * Matches:
 * 1. Exact normalized substring → highest score
 * 2. Prefix match → high score
 * 3. Character-by-character subsequence → lower score proportional to coverage
 */
function fuzzyScore(query: string, candidate: string): number {
    const nq = normalize(query);
    const nc = normalize(candidate);

    if (!nq) return 1; // empty query matches everything

    // Exact substring match (best)
    if (nc.includes(nq)) {
        // Prefer shorter candidates (more specific match)
        return 100 + (1 / nc.length) * 10;
    }

    // Check prefix
    if (nc.startsWith(nq)) {
        return 90 + (1 / nc.length) * 10;
    }

    // Subsequence match: every char of query appears in order in candidate
    let qi = 0;
    let matchCount = 0;
    for (let ci = 0; ci < nc.length && qi < nq.length; ci++) {
        if (nc[ci] === nq[qi]) {
            qi++;
            matchCount++;
        }
    }

    if (qi === nq.length) {
        // All query chars found in order — score by coverage %
        return (matchCount / nc.length) * 50;
    }

    return 0; // no match
}

// ── Component ───────────────────────────────────────────────────────────

export function SurahPicker({ visible, onDismiss, onSelect, surahs }: SurahPickerProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Auto-focus the search input when modal opens
    useEffect(() => {
        if (visible) {
            setTimeout(() => inputRef.current?.focus(), 400);
        } else {
            setSearchQuery('');
        }
    }, [visible]);

    const filteredSurahs = useMemo(() => {
        const q = searchQuery.trim();
        if (!q) return surahs;

        // Number search — exact match on surah number
        const num = parseInt(q);
        if (!isNaN(num) && num > 0 && num <= 114) {
            return surahs.filter(s => s.number === num);
        }

        // Fuzzy search on both English and Arabic names
        const scored = surahs
            .map(s => {
                const engScore = fuzzyScore(q, s.englishName);
                const araScore = fuzzyScore(q, s.name);
                // Also match on common alternate names
                const bestScore = Math.max(engScore, araScore);
                return { surah: s, score: bestScore };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);

        return scored.map(r => r.surah);
    }, [searchQuery, surahs]);

    const handleSelect = (surahNumber: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(surahNumber);
        onDismiss();
        setSearchQuery('');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onDismiss}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.header}>
                    <Text
                        variant="titleLarge"
                        style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                        Select Surah
                    </Text>
                    <Pressable onPress={onDismiss}>
                        <Text
                            variant="titleMedium"
                            style={{ color: theme.colors.primary, fontWeight: '600' }}>
                            Done
                        </Text>
                    </Pressable>
                </View>

                {/* Search input — custom for proper keyboard avoidance */}
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <MaterialCommunityIcons
                        name="magnify"
                        size={20}
                        color={theme.colors.onSurfaceVariant}
                    />
                    <TextInput
                        ref={inputRef}
                        style={[styles.searchInput, { color: theme.colors.onSurface }]}
                        placeholder="Search surah name or number..."
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                            <MaterialCommunityIcons
                                name="close-circle"
                                size={18}
                                color={theme.colors.onSurfaceVariant}
                            />
                        </Pressable>
                    )}
                </View>

                {/* Results count when filtering */}
                {searchQuery.length > 0 && (
                    <Text style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}>
                        {filteredSurahs.length} {filteredSurahs.length === 1 ? 'result' : 'results'}
                    </Text>
                )}

                {/* Surah list */}
                <FlatList
                    data={filteredSurahs}
                    keyExtractor={item => item.number.toString()}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{
                        paddingBottom: Math.max(insets.bottom, 20) + 20,
                    }}
                    renderItem={({ item }) => (
                        <>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.item,
                                    { backgroundColor: theme.colors.surface },
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => handleSelect(item.number)}>
                                <View
                                    style={[
                                        styles.numberBadge,
                                        { backgroundColor: theme.colors.primaryContainer },
                                    ]}>
                                    <Text
                                        style={[
                                            styles.numberText,
                                            { color: theme.colors.primary },
                                        ]}>
                                        {item.number}
                                    </Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text
                                        variant="titleMedium"
                                        style={{
                                            color: theme.colors.onSurface,
                                            fontWeight: '600',
                                        }}>
                                        {item.englishName}
                                    </Text>
                                    <Text
                                        variant="bodySmall"
                                        style={{ color: theme.colors.onSurfaceVariant }}>
                                        {item.name}
                                    </Text>
                                </View>
                            </Pressable>
                            <Divider
                                style={{ backgroundColor: theme.colors.outline, opacity: 0.2 }}
                            />
                        </>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons
                                name="book-search-outline"
                                size={48}
                                color={theme.colors.onSurfaceVariant}
                                style={{ opacity: 0.5 }}
                            />
                            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                No surahs found for &ldquo;{searchQuery}&rdquo;
                            </Text>
                            <Text style={[styles.emptyHint, { color: theme.colors.onSurfaceVariant }]}>
                                Try a different spelling or surah number
                            </Text>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.outline,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.outline,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    resultCount: {
        fontSize: 12,
        fontWeight: '500',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    numberBadge: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    numberText: {
        fontWeight: '700',
        fontSize: 14,
    },
    textContainer: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyHint: {
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.7,
    },
});

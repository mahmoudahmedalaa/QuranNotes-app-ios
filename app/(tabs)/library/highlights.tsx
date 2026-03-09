import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    SectionList,
    Platform,
    TextInput,
    Modal,
    FlatList,
    LayoutAnimation,
    UIManager,
    Animated as RNAnimated,
} from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import {
    useHighlights,
    HIGHLIGHT_COLORS,
    VerseHighlight,
} from '../../../src/features/notes/infrastructure/HighlightContext';
import { useQuran } from '../../../src/core/hooks/useQuran';
import { Spacing, BorderRadius, Shadows } from '../../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SortMode = 'surah' | 'date';

interface HighlightGroup {
    surahId: number;
    surahName: string;
    highlights: VerseHighlight[];
}

export default function HighlightsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { highlights, unhighlightVerse } = useHighlights();
    const { surahList, loadSurahList } = useQuran();
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

    // Filter state
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
    const [sortMode, setSortMode] = useState<SortMode>('surah');

    // Collapsible state (track which surahs are expanded)
    const [expandedSurahs, setExpandedSurahs] = useState<Set<number>>(new Set());

    // Modal visibility
    const [showSurahPicker, setShowSurahPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [surahSearch, setSurahSearch] = useState('');

    useEffect(() => {
        loadSurahList();
    }, [loadSurahList]);

    useFocusEffect(
        useCallback(() => {
            loadSurahList();
        }, [loadSurahList])
    );

    // Toggle surah expansion
    const toggleSurah = (surahId: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpandedSurahs(prev => {
            const next = new Set(prev);
            if (next.has(surahId)) {
                next.delete(surahId);
            } else {
                next.add(surahId);
            }
            return next;
        });
    };

    // Expand all / collapse all
    const expandAll = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const allIds = groups.map(g => g.surahId);
        setExpandedSurahs(new Set(allIds));
    };

    const collapseAll = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSurahs(new Set());
    };

    const hasActiveFilters = selectedColor !== null || selectedSurahId !== null;

    const clearFilters = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedColor(null);
        setSelectedSurahId(null);
    };

    // Filtered highlights — guard against malformed entries from storage/sync
    const filteredHighlights = useMemo(() => {
        let all = Object.values(highlights).filter(
            h => h && typeof h.surahId === 'number' && typeof h.verseId === 'number' && h.color && h.createdAt
        );
        if (selectedColor) {
            all = all.filter(h => h.color === selectedColor);
        }
        if (selectedSurahId !== null) {
            all = all.filter(h => h.surahId === selectedSurahId);
        }
        return all;
    }, [highlights, selectedColor, selectedSurahId]);

    // Group into surah groups
    const groups: HighlightGroup[] = useMemo(() => {
        if (!filteredHighlights.length) return [];

        if (sortMode === 'date') {
            const sorted = [...filteredHighlights].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const map = new Map<string, VerseHighlight[]>();
            sorted.forEach(h => {
                const dateKey = new Date(h.createdAt).toLocaleDateString();
                const existing = map.get(dateKey) || [];
                existing.push(h);
                map.set(dateKey, existing);
            });
            let idx = -1;
            return Array.from(map.entries()).map(([dateKey, data]) => {
                idx--;
                return {
                    surahId: idx,
                    surahName: dateKey,
                    highlights: data,
                };
            });
        }

        const map = new Map<number, VerseHighlight[]>();
        [...filteredHighlights]
            .sort((a, b) => a.verseId - b.verseId)
            .forEach(h => {
                const existing = map.get(h.surahId) || [];
                existing.push(h);
                map.set(h.surahId, existing);
            });

        return Array.from(map.entries())
            .sort(([a], [b]) => a - b)
            .map(([surahId, data]) => {
                const surah = surahList.find(s => s.number === surahId);
                return {
                    surahId,
                    surahName: surah ? `${surah.englishName} (${surah.name})` : `Surah ${surahId}`,
                    highlights: data,
                };
            });
    }, [filteredHighlights, surahList, sortMode]);

    // Auto-expand all when there are few surahs, collapse when many
    useEffect(() => {
        if (groups.length <= 3) {
            setExpandedSurahs(new Set(groups.map(g => g.surahId)));
        }
    }, [groups.length]);

    const totalHighlights = Object.keys(highlights).length;

    const getColorName = (color: string) => {
        return HIGHLIGHT_COLORS.find(c => c.color === color)?.name || 'Custom';
    };

    const getSurahName = (surahId: number) => {
        const surah = surahList.find(s => s.number === surahId);
        return surah ? surah.englishName : `Surah ${surahId}`;
    };

    const handlePress = (item: VerseHighlight) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/surah/[id]',
            params: { id: item.surahId, verse: item.verseId },
        });
    };

    const handleRemove = (item: VerseHighlight) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        unhighlightVerse(item.surahId, item.verseId);
    };

    // Filtered surah list for picker
    const filteredSurahList = useMemo(() => {
        if (!surahSearch.trim()) return surahList;
        const q = surahSearch.toLowerCase();
        return surahList.filter(
            s =>
                s.englishName.toLowerCase().includes(q) ||
                s.name.includes(surahSearch) ||
                s.number.toString() === surahSearch
        );
    }, [surahList, surahSearch]);

    // ==================== EMPTY STATE ====================
    if (totalHighlights === 0) {
        return (
            <View style={styles.empty}>
                <IconButton
                    icon="format-color-highlight"
                    size={56}
                    iconColor={theme.colors.onSurfaceVariant}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                    No highlights yet
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Highlight verses while reading to{'\n'}collect them here for quick reference.
                </Text>
            </View>
        );
    }

    // ==================== MAIN VIEW ====================
    return (
        <View style={styles.container}>
            {/* ─── Filter row: 3 equal pills ─── */}
            <View style={styles.filterRow}>
                {/* Color pill */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowColorPicker(true);
                    }}
                    style={[
                        styles.filterBtn,
                        {
                            backgroundColor: selectedColor
                                ? selectedColor + '20'
                                : theme.colors.surfaceVariant + '60',
                            borderColor: selectedColor || 'transparent',
                        },
                    ]}
                >
                    {selectedColor ? (
                        <View style={[styles.filterDot, { backgroundColor: selectedColor }]} />
                    ) : (
                        <Ionicons name="color-palette-outline" size={14} color={theme.colors.onSurfaceVariant} />
                    )}
                    <Text
                        style={[styles.filterBtnText, { color: selectedColor ? theme.colors.onSurface : theme.colors.onSurfaceVariant }]}
                        numberOfLines={1}
                    >
                        {selectedColor ? getColorName(selectedColor) : 'Color'}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color={theme.colors.onSurfaceVariant} />
                </Pressable>

                {/* Surah pill */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowSurahPicker(true);
                    }}
                    style={[
                        styles.filterBtn,
                        {
                            backgroundColor: selectedSurahId
                                ? theme.colors.primaryContainer
                                : theme.colors.surfaceVariant + '60',
                            borderColor: selectedSurahId ? theme.colors.primary + '60' : 'transparent',
                        },
                    ]}
                >
                    <Ionicons
                        name="book-outline"
                        size={14}
                        color={selectedSurahId ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                    <Text
                        style={[styles.filterBtnText, { color: selectedSurahId ? theme.colors.primary : theme.colors.onSurfaceVariant }]}
                        numberOfLines={1}
                    >
                        {selectedSurahId ? getSurahName(selectedSurahId) : 'Surah'}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color={theme.colors.onSurfaceVariant} />
                </Pressable>

                {/* Sort By pill */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSortMode(prev => (prev === 'surah' ? 'date' : 'surah'));
                    }}
                    style={[
                        styles.filterBtn,
                        { backgroundColor: theme.colors.surfaceVariant + '60', borderColor: 'transparent' },
                    ]}
                >
                    <Ionicons
                        name={sortMode === 'surah' ? 'library-outline' : 'time-outline'}
                        size={14}
                        color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                        style={[styles.filterBtnText, { color: theme.colors.onSurfaceVariant }]}
                        numberOfLines={1}
                    >
                        {sortMode === 'surah' ? 'By Surah' : 'By Date'}
                    </Text>
                    <Ionicons name="swap-vertical" size={12} color={theme.colors.onSurfaceVariant} />
                </Pressable>
            </View>

            {/* ─── Utility row: Clear + Expand/Collapse ─── */}
            {(hasActiveFilters || (groups.length > 1 && sortMode === 'surah')) && (
                <View style={styles.utilityRow}>
                    {hasActiveFilters && (
                        <Pressable onPress={clearFilters} style={styles.utilityBtn}>
                            <Ionicons name="close-circle" size={14} color={theme.colors.error} />
                            <Text style={[styles.utilityText, { color: theme.colors.error }]}>Clear filters</Text>
                        </Pressable>
                    )}
                    <View style={{ flex: 1 }} />
                    {groups.length > 1 && sortMode === 'surah' && (
                        <Pressable
                            onPress={expandedSurahs.size === groups.length ? collapseAll : expandAll}
                            style={styles.utilityBtn}
                        >
                            <Ionicons
                                name={expandedSurahs.size === groups.length ? 'contract-outline' : 'expand-outline'}
                                size={14}
                                color={theme.colors.primary}
                            />
                            <Text style={[styles.utilityText, { color: theme.colors.primary }]}>
                                {expandedSurahs.size === groups.length ? 'Collapse all' : 'Expand all'}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* ─── No results ─── */}
            {filteredHighlights.length === 0 && hasActiveFilters ? (
                <View style={styles.noResults}>
                    <Ionicons name="filter-outline" size={40} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.noResultsTitle, { color: theme.colors.onSurface }]}>
                        No matching highlights
                    </Text>
                    <Pressable
                        onPress={clearFilters}
                        style={[styles.clearAllBtn, { backgroundColor: theme.colors.primaryContainer }]}
                    >
                        <Text style={[styles.clearAllBtnText, { color: theme.colors.primary }]}>
                            Clear all filters
                        </Text>
                    </Pressable>
                </View>
            ) : (
                /* ─── Collapsible surah groups ─── */
                <FlatList
                    data={groups}
                    keyExtractor={g => String(g.surahId ?? 'unknown')}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: group }) => {
                        const isExpanded = expandedSurahs.has(group.surahId);
                        // Collect unique colors in this group for the mini dots
                        const uniqueColors = [...new Set(group.highlights.map(h => h.color))];

                        return (
                            <View style={[styles.groupContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline + '40' }, Shadows.sm]}>
                                {/* Surah header — tap to expand/collapse */}
                                <Pressable
                                    onPress={() => toggleSurah(group.surahId)}
                                    style={styles.groupHeader}
                                >
                                    <View style={styles.groupHeaderLeft}>
                                        <Text style={[styles.groupTitle, { color: theme.colors.onSurface }]}>
                                            {group.surahName}
                                        </Text>
                                        <View style={styles.groupMeta}>
                                            {/* Mini color dots */}
                                            {uniqueColors.slice(0, 4).map((c, i) => (
                                                <View
                                                    key={c}
                                                    style={[
                                                        styles.miniDot,
                                                        { backgroundColor: c, marginLeft: i > 0 ? -3 : 0 },
                                                    ]}
                                                />
                                            ))}
                                            <Text style={[styles.groupCount, { color: theme.colors.onSurfaceVariant }]}>
                                                {group.highlights.length} verse{group.highlights.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color={theme.colors.onSurfaceVariant}
                                    />
                                </Pressable>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <View style={[styles.groupContent, { borderTopColor: theme.colors.outline + '30' }]}>
                                        {group.highlights.map((item, idx) => {
                                            const itemKey = `${item.surahId}:${item.verseId}`;

                                            const renderDeleteAction = (_progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                                                const scale = dragX.interpolate({
                                                    inputRange: [-70, 0],
                                                    outputRange: [1, 0.5],
                                                    extrapolate: 'clamp',
                                                });
                                                return (
                                                    <RNAnimated.View style={[styles.swipeAction, styles.swipeDelete, { transform: [{ scale }] }]}>
                                                        <Ionicons name="trash-outline" size={18} color="#FFF" />
                                                    </RNAnimated.View>
                                                );
                                            };

                                            return (
                                                <Swipeable
                                                    key={itemKey}
                                                    ref={(ref) => { if (ref) swipeableRefs.current.set(itemKey, ref); }}
                                                    renderRightActions={renderDeleteAction}
                                                    onSwipeableOpen={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                        handleRemove(item);
                                                        swipeableRefs.current.get(itemKey)?.close();
                                                    }}
                                                    overshootRight={false}
                                                >
                                                    <Pressable
                                                        onPress={() => handlePress(item)}
                                                        style={({ pressed }) => [
                                                            styles.card,
                                                            {
                                                                backgroundColor: pressed
                                                                    ? theme.colors.surfaceVariant + '40'
                                                                    : theme.colors.surface,
                                                            },
                                                            idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outline + '25' },
                                                        ]}
                                                    >
                                                        {/* Left accent bar */}
                                                        <View
                                                            accessible={true}
                                                            accessibilityLabel={`${getColorName(item.color)} highlight`}
                                                            style={[styles.accentBar, { backgroundColor: item.color }]}
                                                        />
                                                        <Text style={[styles.verseLabel, { color: theme.colors.onSurface }]}>
                                                            {sortMode === 'date'
                                                                ? `${getSurahName(item.surahId)} · Verse ${item.verseId}`
                                                                : `Verse ${item.verseId}`}
                                                        </Text>
                                                    </Pressable>
                                                </Swipeable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            {/* ─── Color Picker Modal ─── */}
            <Modal
                visible={showColorPicker}
                animationType="slide"
                presentationStyle="formSheet"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                            Filter by Color
                        </Text>
                        <Pressable onPress={() => setShowColorPicker(false)}>
                            <Ionicons name="close-circle" size={28} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    {/* All colors option */}
                    <Pressable
                        onPress={() => {
                            setSelectedColor(null);
                            setShowColorPicker(false);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[
                            styles.colorOption,
                            {
                                backgroundColor: !selectedColor
                                    ? theme.colors.primaryContainer + '40'
                                    : 'transparent',
                            },
                        ]}
                    >
                        <Ionicons
                            name="color-palette"
                            size={22}
                            color={!selectedColor ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text
                            style={[
                                styles.colorOptionText,
                                {
                                    color: !selectedColor ? theme.colors.primary : theme.colors.onSurface,
                                    fontWeight: !selectedColor ? '700' : '500',
                                },
                            ]}
                        >
                            All Colors
                        </Text>
                        <View style={{ flex: 1 }} />
                        {!selectedColor && (
                            <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                        )}
                    </Pressable>

                    {/* Individual colors */}
                    {HIGHLIGHT_COLORS.map(hc => {
                        const count = Object.values(highlights).filter(h => h.color === hc.color).length;
                        const isSelected = selectedColor === hc.color;

                        return (
                            <Pressable
                                key={hc.color}
                                onPress={() => {
                                    setSelectedColor(hc.color);
                                    setShowColorPicker(false);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={[
                                    styles.colorOption,
                                    {
                                        backgroundColor: isSelected
                                            ? hc.color + '15'
                                            : 'transparent',
                                    },
                                ]}
                            >
                                <View style={[styles.colorSwatch, { backgroundColor: hc.color }]} />
                                <Text
                                    style={[
                                        styles.colorOptionText,
                                        {
                                            color: isSelected ? theme.colors.onSurface : theme.colors.onSurface,
                                            fontWeight: isSelected ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {hc.name}
                                </Text>
                                <View style={{ flex: 1 }} />
                                {count > 0 && (
                                    <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
                                        <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                                {isSelected && (
                                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} style={{ marginLeft: 8 }} />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </Modal>

            {/* ─── Surah Picker Modal ─── */}
            <Modal
                visible={showSurahPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSurahPicker(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                            Filter by Surah
                        </Text>
                        <Pressable onPress={() => setShowSurahPicker(false)}>
                            <Ionicons name="close-circle" size={28} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    {/* Search */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
                        <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.onSurface }]}
                            placeholder="Search surahs..."
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            value={surahSearch}
                            onChangeText={setSurahSearch}
                            autoFocus
                        />
                        {surahSearch.length > 0 && (
                            <Pressable onPress={() => setSurahSearch('')}>
                                <Ionicons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
                            </Pressable>
                        )}
                    </View>

                    {/* All surahs option */}
                    <Pressable
                        onPress={() => {
                            setSelectedSurahId(null);
                            setShowSurahPicker(false);
                            setSurahSearch('');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[
                            styles.surahOption,
                            {
                                backgroundColor: !selectedSurahId
                                    ? theme.colors.primaryContainer + '40'
                                    : 'transparent',
                            },
                        ]}
                    >
                        <Ionicons
                            name="layers-outline"
                            size={18}
                            color={!selectedSurahId ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text
                            style={[
                                styles.surahOptionText,
                                {
                                    color: !selectedSurahId ? theme.colors.primary : theme.colors.onSurface,
                                    fontWeight: !selectedSurahId ? '700' : '400',
                                },
                            ]}
                        >
                            All Surahs
                        </Text>
                        <View style={{ flex: 1 }} />
                        {!selectedSurahId && (
                            <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                        )}
                    </Pressable>

                    {/* Surah list */}
                    <FlatList
                        data={filteredSurahList}
                        keyExtractor={item => item.number.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item: surah }) => {
                            const count = Object.values(highlights).filter(h => h.surahId === surah.number).length;
                            const isSelected = selectedSurahId === surah.number;

                            return (
                                <Pressable
                                    onPress={() => {
                                        setSelectedSurahId(surah.number);
                                        setShowSurahPicker(false);
                                        setSurahSearch('');
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    style={[
                                        styles.surahOption,
                                        {
                                            backgroundColor: isSelected
                                                ? theme.colors.primaryContainer + '40'
                                                : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text style={[styles.surahNum, { color: theme.colors.onSurfaceVariant }]}>
                                        {surah.number}
                                    </Text>
                                    <View style={styles.surahOptionContent}>
                                        <Text
                                            style={[
                                                styles.surahOptionText,
                                                {
                                                    color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                                                    fontWeight: isSelected ? '700' : '500',
                                                },
                                            ]}
                                        >
                                            {surah.englishName}
                                        </Text>
                                        <Text style={[styles.surahArabic, { color: theme.colors.onSurfaceVariant }]}>
                                            {surah.name}
                                        </Text>
                                    </View>
                                    {count > 0 && (
                                        <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
                                            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                                                {count}
                                            </Text>
                                        </View>
                                    )}
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

// ═══════════════════════════════ STYLES ═══════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },


    // Filter row
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        gap: 8,
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 5,
    },
    filterBtnText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    filterDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 20,
    },

    // Utility row (clear filters + expand/collapse)
    utilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginTop: 4,
        marginBottom: 2,
    },
    utilityBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    utilityText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Groups (collapsible surah cards)
    groupContainer: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    groupHeaderLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    groupMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 6,
    },
    miniDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    groupCount: {
        fontSize: 13,
        fontWeight: '500',
    },
    groupContent: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },

    // Cards (inside expanded group)
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: Spacing.md,
    },
    accentBar: {
        width: 3,
        height: 22,
        borderRadius: 2,
        marginRight: 10,
    },
    verseLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    swipeDelete: {
        backgroundColor: '#E53935',
    },
    swipeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
        marginTop: -8,
    },

    // List
    listContent: {
        paddingTop: Spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 180 : 160,
    },

    // Empty / no results
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: Spacing.xs,
        lineHeight: 22,
    },
    noResults: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
        gap: 8,
    },
    noResultsTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    clearAllBtn: {
        marginTop: Spacing.sm,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    clearAllBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Modal shared
    modalContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 12 : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },

    // Color picker modal
    colorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        gap: 14,
    },
    colorSwatch: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    colorOptionText: {
        fontSize: 16,
    },

    // Surah picker modal
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        borderRadius: BorderRadius.md,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    surahOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        gap: 12,
    },
    surahNum: {
        fontSize: 12,
        fontWeight: '600',
        width: 24,
        textAlign: 'center',
    },
    surahOptionContent: {
        flex: 1,
    },
    surahOptionText: {
        fontSize: 15,
    },
    surahArabic: {
        fontSize: 12,
        marginTop: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

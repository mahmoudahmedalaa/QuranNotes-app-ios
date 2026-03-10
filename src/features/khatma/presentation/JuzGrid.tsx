/**
 * JuzGrid — Collapsible Juz progress grid
 *
 * Collapsed: 6 boxes showing the current working batch.
 *   - Current juz = gold, completed = green, future = gray.
 *   - The batch is a sliding window of 6:
 *     • Current juz starts at position 1.
 *     • As you complete, green fills left → right.
 *     • When all 6 in the batch are done, the window advances.
 *
 * Expanded: full 5×6 grid of all 30 juz.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Spacing, BorderRadius, Shadows, BrandTokens } from '../../../core/theme/DesignSystem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLUMNS = 6;
const GAP = 6;
const PREVIEW_COUNT = 6;

const ACCENT = {
    green: '#10B981',
    greenLight: '#10B98140',
    current: BrandTokens.light.accentPrimary,
    currentLight: BrandTokens.light.accentPrimary + '20',
    selected: BrandTokens.light.accentPrimary,
    selectedLight: BrandTokens.light.accentPrimary + '30',
};

interface JuzGridProps {
    completedJuz: number[];
    currentJuz: number;
    selectedJuz?: number | null;
    onJuzPress?: (juzNumber: number) => void;
}

export const JuzGrid: React.FC<JuzGridProps> = ({ completedJuz, currentJuz, selectedJuz, onJuzPress }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    // ── Cell state ──
    type CellState = 'completed' | 'current' | 'future';
    const isKhatmaComplete = completedJuz.length >= 30;

    const getCellState = (juzNumber: number): CellState => {
        // When khatma is fully complete, everything (including currentJuz) is completed
        if (completedJuz.includes(juzNumber)) return 'completed';
        if (juzNumber === currentJuz) return 'current';
        return 'future';
    };

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    // ── Batch window: 6 juz, current at position 1, filling left→right ──
    //
    // The batch starts at a stable anchor so green fills don't shift the window.
    // Anchor = the first juz of the "page of 6" that contains currentJuz.
    //
    // We derive: how many juz before currentJuz (in the 1..30 sequence)
    // have been completed since the last batch boundary?
    // Batch boundary = when completedJuz.length was a multiple of 6.
    //
    // Example: 22 completed, currentJuz=23
    //   recentlyDone = 22 % 6 = 4  →  batchStart = 23 - 4 = 19
    //   Window: [19✓, 20✓, 21✓, 22✓, 23🟡, 24⬜]
    //
    // When user completes 23: 23 completed, currentJuz=24
    //   recentlyDone = 23 % 6 = 5  →  batchStart = 24 - 5 = 19
    //   Window: [19✓, 20✓, 21✓, 22✓, 23✓, 24🟡]  ← gold moves right ✓
    //
    // When user completes 24: 24 completed, currentJuz=25
    //   recentlyDone = 24 % 6 = 0  →  batchStart = 25 - 0 = 25
    //   Window: [25🟡, 26⬜, 27⬜, 28⬜, 29⬜, 30⬜]  ← fresh batch ✓

    const previewJuz = useMemo(() => {
        const completedCount = completedJuz.length;

        // When all 30 are complete, show the last batch (25-30)
        if (completedCount >= 30) {
            return [25, 26, 27, 28, 29, 30];
        }

        const recentlyDone = completedCount % PREVIEW_COUNT;
        const batchStart = currentJuz - recentlyDone;

        const items: number[] = [];
        for (let i = 0; i < PREVIEW_COUNT; i++) {
            const juz = batchStart + i;
            if (juz >= 1 && juz <= 30) items.push(juz);
        }
        return items;
    }, [currentJuz, completedJuz.length]);

    // ── Cell renderer ──
    const renderCell = (juzNumber: number) => {
        const state = getCellState(juzNumber);
        const isSelected = selectedJuz === juzNumber;

        let bgColor: string;
        let textColor: string;

        switch (state) {
            case 'completed':
                bgColor = ACCENT.greenLight;
                textColor = ACCENT.green;
                break;
            case 'current':
                bgColor = ACCENT.currentLight;
                textColor = ACCENT.current;
                break;
            default:
                bgColor = theme.colors.surfaceVariant;
                textColor = theme.colors.onSurfaceVariant;
        }

        if (isSelected) {
            bgColor = ACCENT.selectedLight;
            textColor = ACCENT.selected;
        }

        return (
            <Pressable
                key={juzNumber}
                onPress={() => onJuzPress?.(juzNumber)}
                style={({ pressed }) => [
                    styles.cell,
                    { backgroundColor: bgColor },
                    isSelected && { borderWidth: 2, borderColor: ACCENT.selected },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
                ]}
                accessibilityLabel={`Juz ${juzNumber}, ${state}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
            >
                {state === 'completed' && !isSelected ? (
                    <MaterialCommunityIcons name="check" size={16} color={ACCENT.green} />
                ) : (
                    <Text style={[styles.cellText, { color: textColor, fontWeight: state === 'current' ? '800' : '700' }]}>
                        {juzNumber}
                    </Text>
                )}
            </Pressable>
        );
    };

    // ── Full grid rows (expanded) ──
    const rows: number[][] = [];
    for (let i = 0; i < 30; i += COLUMNS) {
        rows.push(Array.from({ length: COLUMNS }, (_, j) => i + j + 1));
    }

    return (
        <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 150 }}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                {/* Header — tappable to toggle */}
                <Pressable onPress={toggleExpanded} style={styles.headerRow} hitSlop={8}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                            Juz Progress
                        </Text>
                        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                            {completedJuz.length} of 30
                        </Text>
                    </View>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={theme.colors.onSurfaceVariant}
                    />
                </Pressable>

                {expanded ? (
                    /* ── Expanded: Full 5×6 Grid ── */
                    <>
                        <View style={styles.grid}>
                            {rows.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.row}>
                                    {row.map(juz => renderCell(juz))}
                                </View>
                            ))}
                        </View>

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: ACCENT.green }]} />
                                <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                                    Complete
                                </Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: ACCENT.current }]} />
                                <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                                    Current
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>
                            Tap any Juz to view its surahs
                        </Text>
                    </>
                ) : (
                    /* ── Collapsed: 6-box batch with current filling left→right ── */
                    <View style={styles.previewRow}>
                        {previewJuz.map(juz => renderCell(juz))}
                    </View>
                )}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.xs,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // ── Collapsed preview ──
    previewRow: {
        flexDirection: 'row',
        gap: GAP,
    },
    // ── Grid ──
    grid: {
        gap: GAP,
    },
    row: {
        flexDirection: 'row',
        gap: GAP,
    },
    cell: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellText: {
        fontSize: 14,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: Spacing.sm,
        paddingTop: Spacing.xs,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '500',
    },
    hintText: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 6,
        opacity: 0.6,
    },
});

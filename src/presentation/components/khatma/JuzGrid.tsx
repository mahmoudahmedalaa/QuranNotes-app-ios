/**
 * JuzGrid — Read-only 5×6 grid showing auto-derived Juz progress.
 * Green = Juz complete, Gold = current Juz, Gray = future.
 * Not tappable — purely a visual progress indicator.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Spacing, BorderRadius, Shadows } from '../../theme/DesignSystem';

const COLUMNS = 6;
const GAP = 6;

const ACCENT = {
    gold: '#F5A623',
    goldLight: '#F5A62350',
    green: '#10B981',
    greenLight: '#10B98140',
};

interface JuzGridProps {
    completedJuz: number[];
    currentJuz: number;
}

export const JuzGrid: React.FC<JuzGridProps> = ({ completedJuz, currentJuz }) => {
    const theme = useTheme();

    type CellState = 'completed' | 'current' | 'future';

    const getCellState = (juzNumber: number): CellState => {
        if (completedJuz.includes(juzNumber)) return 'completed';
        if (juzNumber === currentJuz) return 'current';
        return 'future';
    };

    const renderCell = (juzNumber: number) => {
        const state = getCellState(juzNumber);

        let bgColor: string;
        let textColor: string;

        switch (state) {
            case 'completed':
                bgColor = ACCENT.greenLight;
                textColor = ACCENT.green;
                break;
            case 'current':
                bgColor = ACCENT.goldLight;
                textColor = ACCENT.gold;
                break;
            default:
                bgColor = theme.colors.surfaceVariant;
                textColor = theme.colors.onSurfaceVariant;
        }

        return (
            <View
                key={juzNumber}
                style={[styles.cell, { backgroundColor: bgColor }]}
                accessibilityLabel={`Juz ${juzNumber}, ${state}`}
            >
                {state === 'completed' ? (
                    <MaterialCommunityIcons name="check" size={16} color={ACCENT.green} />
                ) : (
                    <Text style={[styles.cellText, { color: textColor }]}>
                        {juzNumber}
                    </Text>
                )}
            </View>
        );
    };

    // Build rows of 6
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
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                        Juz Progress
                    </Text>
                    <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                        {completedJuz.length} of 30
                    </Text>
                </View>

                {/* Grid */}
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
                        <View style={[styles.legendDot, { backgroundColor: ACCENT.greenLight }]} />
                        <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                            Complete
                        </Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: ACCENT.gold }]} />
                        <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                            Reading Now
                        </Text>
                    </View>
                </View>
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
    headerText: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
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
        fontWeight: '700',
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
});

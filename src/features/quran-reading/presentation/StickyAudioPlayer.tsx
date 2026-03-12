import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, IconButton, Divider, useTheme } from 'react-native-paper';
import { Spacing, BorderRadius } from '../../../core/theme/DesignSystem';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import { RECITERS, Reciter, hasFullSurahAudio } from '../../audio-player/domain/Reciter';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';

interface Props {
    isPlaying: boolean;
    currentVerse: { surah: number; verse: number } | null;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    verseText?: string;
}

export const StickyAudioPlayer = ({
    isPlaying,
    currentVerse,
    onPause,
    onResume,
    onStop,
    verseText,
}: Props) => {
    const { settings, updateSettings } = useSettings();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [menuOpen, setMenuOpen] = useState(false);

    const openMenu = useCallback(() => setMenuOpen(true), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const currentReciter = RECITERS.find(r => r.id === settings.reciterId);
    // Always show at least the first word of the reciter name, with fallback
    const badgeLabel = currentReciter
        ? (currentReciter.name.split(' ').slice(0, 2).join(' '))
        : 'Reciter';

    const handleSelectReciter = useCallback((reciter: Reciter) => {
        updateSettings({ reciterId: reciter.id });
        closeMenu();
    }, [updateSettings, closeMenu]);

    if (!currentVerse) return null;

    return (
        <>
            <MotiView
                from={{ translateY: 100, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={[
                    styles.wrapper,
                    { bottom: insets.bottom + 8 }
                ]}
            >
                <BlurView
                    intensity={60}
                    tint={theme.dark ? 'dark' : 'light'}
                    style={[
                        styles.container,
                        {
                            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            borderWidth: 1,
                        }
                    ]}
                >
                    <View style={styles.content}>
                        {/* ── Row 1: Now Reciting + Reciter Badge ── */}
                        <View style={styles.topRow}>
                            <Text
                                variant="labelMedium"
                                style={[styles.playingLabel, { color: theme.colors.primary }]}>
                                Now Reciting
                            </Text>
                            <TouchableOpacity onPress={openMenu} activeOpacity={0.7}>
                                <View
                                    style={[
                                        styles.reciterBadge,
                                        { backgroundColor: theme.colors.primaryContainer },
                                    ]}>
                                    <Text
                                        style={[
                                            styles.reciterText,
                                            { color: theme.colors.onPrimaryContainer },
                                        ]}
                                        numberOfLines={1}>
                                        {badgeLabel}
                                    </Text>
                                    <IconButton
                                        icon="chevron-down"
                                        size={14}
                                        iconColor={theme.colors.onPrimaryContainer}
                                        style={{ margin: 0, height: 14, width: 14 }}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* ── Row 2: Verse info + Controls ── */}
                        <View style={styles.bottomRow}>
                            <View style={styles.verseInfo}>
                                <Text
                                    variant="titleMedium"
                                    style={[styles.verseLabel, { color: theme.colors.onSurface }]}>
                                    Verse {currentVerse.verse}
                                </Text>
                                {verseText && (
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.arabicPreview,
                                            { color: theme.colors.onSurfaceVariant },
                                        ]}>
                                        {verseText}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.controls}>
                                {isPlaying ? (
                                    <IconButton
                                        icon="pause-circle"
                                        iconColor={theme.colors.primary}
                                        size={40}
                                        onPress={onPause}
                                        style={{ margin: 0 }}
                                    />
                                ) : (
                                    <IconButton
                                        icon="play-circle"
                                        iconColor={theme.colors.primary}
                                        size={40}
                                        onPress={onResume}
                                        style={{ margin: 0 }}
                                    />
                                )}
                                <IconButton
                                    icon="close"
                                    iconColor={theme.colors.onSurfaceVariant}
                                    size={22}
                                    onPress={onStop}
                                    style={{ margin: 0, marginLeft: 2 }}
                                />
                            </View>
                        </View>
                    </View>
                </BlurView>
            </MotiView>

            {/* ── Reciter Picker Modal ── */}
            <Modal
                visible={menuOpen}
                transparent
                animationType="slide"
                onRequestClose={closeMenu}
            >
                <Pressable style={styles.modalOverlay} onPress={closeMenu}>
                    <Pressable
                        style={[
                            styles.modalSheet,
                            {
                                backgroundColor: theme.colors.surface,
                                paddingBottom: insets.bottom + 16,
                            },
                        ]}
                        onPress={() => { /* prevent tap-through */ }}
                    >
                        {/* Handle bar */}
                        <View style={styles.handleBar}>
                            <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
                            Select Reciter
                        </Text>
                        <Divider />

                        <FlatList
                            data={RECITERS}
                            keyExtractor={r => r.id}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item: r }) => {
                                const isSelected = r.id === settings.reciterId;
                                const isPerVerse = !hasFullSurahAudio(r);
                                return (
                                    <TouchableOpacity
                                        onPress={() => handleSelectReciter(r)}
                                        style={[
                                            styles.reciterRow,
                                            isSelected && {
                                                backgroundColor: theme.colors.primaryContainer,
                                            },
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={[
                                                    styles.reciterRowName,
                                                    { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
                                                ]}
                                                numberOfLines={1}>
                                                {r.name}
                                            </Text>
                                            {isPerVerse && (
                                                <Text
                                                    style={[
                                                        styles.reciterRowSub,
                                                        { color: theme.colors.onSurfaceVariant },
                                                    ]}>
                                                    Per-verse mode
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <IconButton
                                                icon="check"
                                                size={20}
                                                iconColor={theme.colors.primary}
                                                style={{ margin: 0 }}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: Spacing.md,
        right: Spacing.md,
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    container: {
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'column',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    verseInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    playingLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginRight: 8,
    },
    reciterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        maxWidth: 160,
    },
    reciterText: {
        fontSize: 12,
        fontWeight: '700',
    },
    verseLabel: {
        fontWeight: '800',
    },
    arabicPreview: {
        fontSize: 13,
        marginTop: 2,
        fontStyle: 'italic',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    /* ── Modal styles ── */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 8,
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    sheetTitle: {
        fontWeight: '700',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    reciterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    reciterRowName: {
        fontSize: 16,
        fontWeight: '500',
    },
    reciterRowSub: {
        fontSize: 12,
        marginTop: 2,
    },
});

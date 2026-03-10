import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, Pressable, Platform, useWindowDimensions, Animated as RNAnimated } from 'react-native';
import { Text, useTheme, Searchbar, IconButton, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotes } from '../../../src/core/hooks/useNotes';
import { useFolders } from '../../../src/features/notes/infrastructure/FolderContext';
import { Note } from '../../../src/features/notes/domain/Note';
import { DEFAULT_FOLDER } from '../../../src/core/domain/entities/Folder';
import { Spacing, BorderRadius, Shadows } from '../../../src/core/theme/DesignSystem';
import { ModernDropdown } from '../../../src/core/components/common/ModernDropdown';
import * as Haptics from 'expo-haptics';
import RenderHtml, { HTMLElementModel, HTMLContentModel } from 'react-native-render-html';

// Utility to cleanly strip HTML, CSS junk, and markdown wrappers for note previews
const stripHtmlTags = (html: string) => {
    if (!html) return '';
    let text = html.replace(/[a-z0-9.]+\s*\{[^}]*\}/gi, '');
    text = text.replace(/<br\s*[\/]?>/gi, ' ');
    text = text.replace(/<\/p>/gi, ' ');
    text = text.replace(/<[^>]*>?/gm, '');
    text = text.replace(/\*\*/g, '');
    text = text.replace(/(?<!\w)_|_(?!\w)/g, '');
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    text = text.replace(/\s{2,}/g, ' ');
    return text.trim();
};

export default function NotesScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const { notes, loading, fetchAllNotes, togglePin, deleteNote } = useNotes();
    const { folders } = useFolders();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

    useEffect(() => {
        fetchAllNotes();
    }, [fetchAllNotes]);

    useFocusEffect(
        useCallback(() => {
            fetchAllNotes();
        }, [fetchAllNotes])
    );

    const filteredNotes = useMemo(() => {
        const filtered = notes.filter(note => {
            const plainTextContent = stripHtmlTags(note.content);
            const matchesSearch = plainTextContent.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder =
                selectedFolders.length === 0 ||
                selectedFolders.includes(note.folderId || DEFAULT_FOLDER.id);
            return matchesSearch && matchesFolder;
        });
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, [notes, searchQuery, selectedFolders]);

    const folderOptions = folders.map(f => ({ label: f.name, value: f.id }));

    const handleNotePress = (item: Note) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/note/edit',
            params: { surah: item.surahId, verse: item.verseId, id: item.id },
        });
    };

    const hasVisibleContent = (content: string) => {
        if (!content) return false;
        const stripped = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        return stripped.length > 0;
    };

    const isHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

    const isStandaloneNote = (item: Note) => !item.surahId || item.surahId === 0;

    const getAccentColor = (item: Note) => {
        const folder = folders.find(f => f.id === item.folderId);
        if (folder) return folder.color;
        return theme.colors.primary;
    };

    const renderItem = ({ item }: { item: Note }) => {
        const folder = folders.find(f => f.id === item.folderId);
        const standalone = isStandaloneNote(item);
        const showRichPreview = isHtml(item.content) && hasVisibleContent(item.content);
        const cardContentWidth = screenWidth - Spacing.md * 2 - Spacing.lg * 2 - 40;
        const accentColor = getAccentColor(item);

        const renderRightActions = (_progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
            const scale = dragX.interpolate({
                inputRange: [-80, 0],
                outputRange: [1, 0.5],
                extrapolate: 'clamp',
            });
            return (
                <RNAnimated.View style={[styles.swipeAction, styles.swipePin, { transform: [{ scale }] }]}>
                    <IconButton
                        icon={item.isPinned ? 'pin-off' : 'pin'}
                        iconColor="#FFF"
                        size={22}
                    />
                    <Text style={styles.swipeText}>{item.isPinned ? 'Unpin' : 'Pin'}</Text>
                </RNAnimated.View>
            );
        };

        const renderLeftActions = (_progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
            const scale = dragX.interpolate({
                inputRange: [0, 80],
                outputRange: [0.5, 1],
                extrapolate: 'clamp',
            });
            return (
                <RNAnimated.View style={[styles.swipeAction, styles.swipeDelete, { transform: [{ scale }] }]}>
                    <IconButton icon="delete-outline" iconColor="#FFF" size={22} />
                    <Text style={styles.swipeText}>Delete</Text>
                </RNAnimated.View>
            );
        };

        return (
            <Swipeable
                ref={(ref) => { if (ref) swipeableRefs.current.set(item.id, ref); }}
                renderRightActions={renderRightActions}
                renderLeftActions={renderLeftActions}
                onSwipeableOpen={(direction) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (direction === 'right') {
                        togglePin(item.id);
                    } else if (direction === 'left') {
                        deleteNote(item.id);
                    }
                    swipeableRefs.current.get(item.id)?.close();
                }}
                overshootLeft={false}
                overshootRight={false}
            >
                <Pressable
                    onPress={() => handleNotePress(item)}
                    style={({ pressed }) => [
                        styles.card,
                        { backgroundColor: item.isPinned ? theme.colors.primaryContainer + '50' : theme.colors.surface },
                        item.isPinned && [
                            styles.pinnedCard,
                            { borderColor: theme.colors.primary + '20' },
                        ],
                        Shadows.sm,
                        pressed && styles.cardPressed,
                    ]}>
                    {/* Accent bar on the left */}
                    <LinearGradient
                        colors={[accentColor, accentColor + '80'] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.accentBar}
                    />

                    <View style={styles.cardInner}>
                        {/* Header row */}
                        <View style={styles.cardHeader}>
                            <View style={styles.headerLeft}>
                                {item.isPinned && (
                                    <IconButton
                                        icon="pin"
                                        size={18}
                                        iconColor={theme.colors.primary}
                                        style={styles.pinIcon}
                                    />
                                )}
                                <View
                                    style={[
                                        styles.verseBadge,
                                        { backgroundColor: theme.colors.primaryContainer },
                                    ]}>
                                    <Text style={[styles.verseBadgeText, { color: theme.colors.primary }]}>
                                        {standalone ? '📝 Note' : `Surah ${item.surahId}${item.verseId ? ` : ${item.verseId}` : ''}`}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                                {new Date(item.updatedAt).toLocaleDateString()}
                            </Text>
                        </View>

                        {/* Folder badge */}
                        {folder && (
                            <View style={styles.folderRow}>
                                <View
                                    style={[styles.folderBadge, { backgroundColor: folder.color + '15' }]}>
                                    <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
                                    <Text style={[styles.folderBadgeText, { color: folder.color }]}>
                                        {folder.name}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Content body */}
                        <View style={styles.cardBody}>
                            <View style={styles.noteContentWrap}>
                                {showRichPreview ? (
                                    <View style={styles.htmlPreview}>
                                        <RenderHtml
                                            contentWidth={cardContentWidth}
                                            source={{ html: item.content }}
                                            baseStyle={{
                                                fontSize: 15,
                                                lineHeight: 23,
                                                color: theme.colors.onSurface,
                                            }}
                                            customHTMLElementModels={{
                                                font: HTMLElementModel.fromCustomModel({
                                                    tagName: 'font',
                                                    contentModel: HTMLContentModel.mixed,
                                                }),
                                            }}
                                            renderers={{
                                                font: ({ TDefaultRenderer, tnode, ...props }: any) => {
                                                    const colorAttr = tnode.attributes?.color;
                                                    return (
                                                        <TDefaultRenderer
                                                            tnode={tnode}
                                                            {...props}
                                                            style={[props.style, colorAttr ? { color: colorAttr } : undefined]}
                                                        />
                                                    );
                                                },
                                            }}
                                            tagsStyles={{
                                                h1: { fontSize: 18, fontWeight: '700', marginVertical: 2 },
                                                h2: { fontSize: 16, fontWeight: '600', marginVertical: 2 },
                                                p: { marginVertical: 1 },
                                                blockquote: {
                                                    borderLeftWidth: 3,
                                                    borderLeftColor: theme.colors.primary,
                                                    paddingLeft: 8,
                                                    fontStyle: 'italic',
                                                    color: theme.colors.onSurfaceVariant,
                                                    marginVertical: 2,
                                                },
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <Text
                                        numberOfLines={3}
                                        style={[styles.noteContent, { color: theme.colors.onSurfaceVariant }]}>
                                        {stripHtmlTags(item.content) || 'Empty note'}
                                    </Text>
                                )}
                            </View>
                            <IconButton
                                icon="chevron-right"
                                size={20}
                                iconColor={theme.colors.outline}
                                style={styles.cardActionIcon}
                            />
                        </View>
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <Searchbar
                    placeholder="Search notes..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
                    inputStyle={{ fontSize: 14, paddingVertical: 0 }}
                    iconColor={theme.colors.onSurfaceVariant}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                />
            </View>

            <View style={styles.folderFilter}>
                <ModernDropdown
                    label="Filter by folder"
                    value={selectedFolders}
                    options={folderOptions}
                    onSelect={value => setSelectedFolders(value as string[])}
                    multiSelect
                    icon="folder"
                />
            </View>

            {/* Note count summary */}
            {filteredNotes.length > 0 && (
                <View style={styles.noteCountRow}>
                    <Text style={[styles.noteCountText, { color: theme.colors.onSurfaceVariant }]}>
                        {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                    </Text>
                </View>
            )}

            <FlatList
                data={filteredNotes}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchAllNotes}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <IconButton
                            icon="notebook-outline"
                            size={56}
                            iconColor={theme.colors.onSurfaceVariant}
                        />
                        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                            No notes yet
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            {searchQuery
                                ? 'No matching notes found.'
                                : 'Start reading to add reflections.'}
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }, Shadows.primary]}
                color={theme.colors.onPrimary}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                        pathname: '/note/edit',
                        params: { standalone: 'true' },
                    });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterBar: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
    },
    searchbar: {
        borderRadius: BorderRadius.md,
        elevation: 0,
        height: 42,
    },
    folderFilter: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    noteCountRow: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xs,
    },
    noteCountText: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    list: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 180 : 160,
    },
    card: {
        flexDirection: 'row',
        marginBottom: Spacing.sm + 2,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    cardPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.985 }],
    },
    pinnedCard: {
        borderWidth: 1,
        borderStyle: 'solid' as const,
    },
    accentBar: {
        width: 4,
        borderTopLeftRadius: BorderRadius.lg,
        borderBottomLeftRadius: BorderRadius.lg,
    },
    cardInner: {
        flex: 1,
        padding: Spacing.md,
        paddingLeft: Spacing.md - 2,
    },
    headerLeft: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flex: 1,
    },
    pinIcon: {
        margin: 0,
        marginLeft: -4,
        marginRight: -2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    verseBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.sm,
    },
    verseBadgeText: {
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    folderRow: {
        marginBottom: 8,
    },
    folderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    folderDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    folderBadgeText: {
        fontWeight: '600',
        fontSize: 12,
    },
    date: {
        fontSize: 12,
        marginLeft: 'auto',
        fontWeight: '400',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noteContentWrap: {
        flex: 1,
        maxHeight: 80,
        overflow: 'hidden',
    },
    htmlPreview: {
        maxHeight: 72,
        overflow: 'hidden',
    },
    noteContent: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    cardActionIcon: {
        margin: 0,
        marginRight: -Spacing.xs,
        marginTop: -4,
    },
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
        fontSize: 15,
        textAlign: 'center',
        marginTop: Spacing.xs,
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: Platform.OS === 'ios' ? 130 : 110,
        borderRadius: BorderRadius.xl,
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: Spacing.sm + 2,
        borderRadius: BorderRadius.lg,
    },
    swipePin: {
        backgroundColor: '#D4A853',
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
});

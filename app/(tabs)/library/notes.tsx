import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Text, useTheme, Searchbar, IconButton, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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
    // Strip CSS blocks like  p.p1 {margin: 0.0px...}
    let text = html.replace(/[a-z0-9.]+\s*\{[^}]*\}/gi, '');
    // Replace <br> and </p> tags with spaces to maintain readable spacing
    text = text.replace(/<br\s*[\/]?>/gi, ' ');
    text = text.replace(/<\/p>/gi, ' ');
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]*>?/gm, '');
    // Strip markdown bold/italic wrappers
    text = text.replace(/\*\*/g, '');
    text = text.replace(/(?<!\w)_|_(?!\w)/g, '');
    // Replace common HTML entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    // Collapse excess whitespace
    text = text.replace(/\s{2,}/g, ' ');
    return text.trim();
};

export default function NotesScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const { notes, loading, fetchAllNotes } = useNotes();
    const { folders } = useFolders();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

    useEffect(() => {
        fetchAllNotes();
    }, [fetchAllNotes]);

    // Re-fetch notes every time this screen gains focus (e.g., returning from editor)
    useFocusEffect(
        useCallback(() => {
            fetchAllNotes();
        }, [fetchAllNotes])
    );

    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            // Search against the stripped text, not the raw HTML
            const plainTextContent = stripHtmlTags(note.content);
            const matchesSearch = plainTextContent.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder =
                selectedFolders.length === 0 ||
                selectedFolders.includes(note.folderId || DEFAULT_FOLDER.id);
            return matchesSearch && matchesFolder;
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

    /** Check if content has actual visible text (not just empty HTML wrappers) */
    const hasVisibleContent = (content: string) => {
        if (!content) return false;
        const stripped = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        return stripped.length > 0;
    };

    /** Check if content contains HTML tags (all pell-editor content is HTML) */
    const isHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

    const isStandaloneNote = (item: Note) => !item.surahId || item.surahId === 0;

    const renderItem = ({ item }: { item: Note }) => {
        const folder = folders.find(f => f.id === item.folderId);
        const standalone = isStandaloneNote(item);
        const showRichPreview = isHtml(item.content) && hasVisibleContent(item.content);
        const cardContentWidth = screenWidth - Spacing.md * 2 - Spacing.md * 2 - 40;

        return (
            <Pressable
                onPress={() => handleNotePress(item)}
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.colors.surface },
                    Shadows.sm,
                    pressed && styles.cardPressed,
                ]}>
                <View style={styles.cardHeader}>
                    <View
                        style={[
                            styles.verseBadge,
                            { backgroundColor: theme.colors.primaryContainer },
                        ]}>
                        <Text style={[styles.verseBadgeText, { color: theme.colors.primary }]}>
                            {standalone ? '📝 Note' : `Surah ${item.surahId}${item.verseId ? `: Verse ${item.verseId}` : ''}`}
                        </Text>
                    </View>
                    {folder && (
                        <View
                            style={[styles.folderBadge, { backgroundColor: folder.color + '20' }]}>
                            <Text style={[styles.folderBadgeText, { color: folder.color }]}>
                                {folder.name}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                        {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.noteContentWrap}>
                        {showRichPreview ? (
                            <View style={styles.htmlPreview}>
                                <RenderHtml
                                    contentWidth={cardContentWidth}
                                    source={{ html: item.content }}
                                    baseStyle={{
                                        fontSize: 14,
                                        lineHeight: 21,
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
                                style={[styles.noteContent, { color: theme.colors.onSurface }]}>
                                {stripHtmlTags(item.content) || 'Empty note'}
                            </Text>
                        )}
                    </View>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        iconColor={theme.colors.outline}
                        style={styles.cardActionIcon}
                    />
                </View>
            </Pressable>
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
                    inputStyle={{ fontSize: 14 }}
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

            {/* Floating Action Button for creating new note */}
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
        paddingTop: Spacing.md,
    },
    searchbar: {
        borderRadius: BorderRadius.lg,
        elevation: 0,
    },
    folderFilter: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    list: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 180 : 160,
    },
    card: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    cardPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.99 }],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: 8,
    },
    verseBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    verseBadgeText: {
        fontWeight: '700',
        fontSize: 12,
    },
    folderBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    folderBadgeText: {
        fontWeight: '600',
        fontSize: 11,
    },
    date: {
        fontSize: 11,
        marginLeft: 'auto',
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
        maxHeight: 80,
        overflow: 'hidden',
    },
    noteContent: {
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
    },
    cardActionIcon: {
        margin: 0,
        marginRight: -Spacing.xs,
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: Platform.OS === 'ios' ? 130 : 110,
        borderRadius: BorderRadius.xl,
    },
});

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import {
    useTheme,
    ActivityIndicator,
    IconButton,
    Text,
    Button,
} from 'react-native-paper';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../../src/core/hooks/useNotes';
import { useFolders } from '../../src/features/notes/infrastructure/FolderContext';
import { Note } from '../../src/features/notes/domain/Note';
import {
    Spacing,
    BorderRadius,
    Shadows,
} from '../../src/core/theme/DesignSystem';
import { FolderPicker } from '../../src/core/components/common/FolderPicker';
import * as Haptics from 'expo-haptics';

import {
    RichEditor,
    RichToolbar,
    actions,
} from 'react-native-pell-rich-editor';

/** Strip HTML for plain-text preview — only used for legacy corrupted notes */
function cleanContentForPreview(raw: string): string {
    if (!raw) return '';
    let text = raw.replace(/[a-z0-9.]+\s*\{[^}]*\}/gi, '');
    text = text.replace(/<[^>]*>?/gm, '');
    text = text.replace(/\*\*/g, '').replace(/(?<!\w)_|_(?!\w)/g, '');
    text = text.replace(/\s{2,}/g, ' ').trim();
    return text;
}

/** Color palette for text color picker */
const TEXT_COLORS = [
    '#000000', '#444444', '#888888',
    '#6B21A8', '#7C3AED', '#A855F7', // purples (on-brand)
    '#DC2626', '#EA580C', '#D97706', // reds/oranges
    '#059669', '#0D9488', '#0284C7', // greens/blues
];

/** Color palette for highlight/background color */
const HIGHLIGHT_COLORS = [
    'transparent',
    '#FEF3C7', '#FDE68A', // warm yellows
    '#DBEAFE', '#BFDBFE', // light blues
    '#F3E8FF', '#E9D5FF', // light purples
    '#DCFCE7', '#BBF7D0', // light greens
    '#FEE2E2', '#FECACA', // light reds
    '#F3F4F6', '#E5E7EB', // light grays
];

export default function NoteEditorScreen() {
    const router = useRouter();
    const theme = useTheme();
    const params = useLocalSearchParams();
    const { surah, verse, id, verseText, standalone } = params;
    const isStandalone = standalone === 'true';

    const { getNoteForVerse, getNoteById, saveNote, deleteNote } = useNotes();
    const { folders } = useFolders();
    const [loading, setLoading] = useState(true);
    const [contentHtml, setContentHtml] = useState('');
    const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'highlight' | null>(null);
    const editorRef = useRef<RichEditor>(null);
    const latestContentRef = useRef<string>('');
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        loadNote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surah, verse, id]);

    const loadNote = async () => {
        if (id && typeof id === 'string') {
            const note = await getNoteById(id);
            if (note) {
                setContentHtml(note.content);
                latestContentRef.current = note.content;
                setExistingNoteId(note.id);
                setSelectedFolderId(note.folderId);
                setLoading(false);
                return;
            }
        }
        if (surah && verse) {
            const note = await getNoteForVerse(Number(surah), Number(verse));
            if (note) {
                setContentHtml(note.content);
                latestContentRef.current = note.content;
                setExistingNoteId(note.id);
                setSelectedFolderId(note.folderId);
            }
        }
        setLoading(false);
    };

    /** Track latest content via both ref (always fresh) and state */
    const handleContentChange = useCallback((html: string) => {
        setContentHtml(html);
        latestContentRef.current = html;
    }, []);

    const handleSave = useCallback(async () => {
        // Use the ref directly — it's updated synchronously on every onChange
        const html = latestContentRef.current;

        // Strip tags for empty-check
        const plainText = html?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
        if (!plainText) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const noteId =
            existingNoteId ||
            (isStandalone ? `standalone_${Date.now()}` : `${surah}_${verse}_${Date.now()}`);

        const newNote: Note = {
            id: noteId,
            surahId: isStandalone ? 0 : Number(surah),
            verseId: verse ? Number(verse) : undefined,
            content: html,
            folderId: selectedFolderId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await saveNote(newNote);
        router.back();
    }, [existingNoteId, isStandalone, surah, verse, selectedFolderId, saveNote, router]);

    const handleDelete = async () => {
        if (existingNoteId) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteNote(existingNoteId);
            router.back();
        }
    };

    const handleTextColor = (color: string) => {
        editorRef.current?.setForeColor(color);
        setShowColorPicker(null);
    };

    const handleHighlightColor = (color: string) => {
        editorRef.current?.setHiliteColor(color === 'transparent' ? 'transparent' : color);
        setShowColorPicker(null);
    };

    const handleCursorPosition = useCallback((scrollY: number) => {
        // Auto-scroll to keep cursor visible
        scrollRef.current?.scrollTo({ y: scrollY - 30, animated: true });
    }, []);

    if (loading) {
        return (
            <View
                style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
                    </Pressable>
                    <View style={styles.headerTitle}>
                        <Text style={[styles.titleText, { color: theme.colors.onBackground }]}>
                            {isStandalone ? 'New Note' : verse ? `Surah ${surah}: Verse ${verse}` : `Surah ${surah}`}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {existingNoteId && (
                            <IconButton
                                icon="delete-outline"
                                onPress={handleDelete}
                                iconColor={theme.colors.error}
                                size={22}
                            />
                        )}
                        <Pressable
                            onPress={handleSave}
                            style={({ pressed }) => [
                                styles.saveButton,
                                { backgroundColor: theme.colors.primary },
                                Shadows.primary,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
                            ]}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                        </Pressable>
                    </View>
                </View>

                {/* Formatting Toolbar */}
                <RichToolbar
                    editor={editorRef}
                    style={[styles.toolbar, { borderBottomColor: theme.colors.outlineVariant }]}
                    iconTint={theme.colors.onSurfaceVariant}
                    selectedIconTint={theme.colors.primary}
                    selectedButtonStyle={styles.toolbarBtnSelected}
                    iconSize={18}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.setStrikethrough,
                        actions.heading1,
                        actions.heading2,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.blockquote,
                        actions.alignLeft,
                        actions.alignCenter,
                        actions.alignRight,
                        actions.undo,
                        actions.redo,
                        'textColor',
                        'highlight',
                    ]}
                    iconMap={{
                        textColor: () => (
                            <Ionicons
                                name="color-palette-outline"
                                size={18}
                                color={showColorPicker === 'text' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                            />
                        ),
                        highlight: () => (
                            <Ionicons
                                name="color-fill-outline"
                                size={18}
                                color={showColorPicker === 'highlight' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                            />
                        ),
                    }}
                    textColor={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                    highlight={() => setShowColorPicker(showColorPicker === 'highlight' ? null : 'highlight')}
                />

                {/* Color Picker Row */}
                {showColorPicker && (
                    <View style={[styles.colorPickerRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                        <Text style={[styles.colorPickerLabel, { color: theme.colors.onSurfaceVariant }]}>
                            {showColorPicker === 'text' ? 'Text Color' : 'Highlight'}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorSwatches}>
                            {(showColorPicker === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS).map(color => (
                                <Pressable
                                    key={color}
                                    onPress={() => showColorPicker === 'text' ? handleTextColor(color) : handleHighlightColor(color)}
                                    style={[
                                        styles.colorSwatch,
                                        {
                                            backgroundColor: color === 'transparent' ? '#FFFFFF' : color,
                                            borderColor: color === 'transparent' ? '#CCC' : color,
                                        },
                                    ]}
                                >
                                    {color === 'transparent' && (
                                        <View style={styles.noColorLine} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Scrollable content area */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                >
                    {/* Verse Quote */}
                    {verseText && (
                        <View style={[styles.verseCard, { backgroundColor: theme.colors.surfaceVariant }, Shadows.sm]}>
                            <Text style={[styles.verseText, { color: theme.colors.onSurfaceVariant }]}>
                                {verseText}
                            </Text>
                        </View>
                    )}

                    {/* Folder pick */}
                    <View style={styles.folderRow}>
                        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>FOLDER</Text>
                        <Button
                            mode="outlined"
                            onPress={() => setPickerVisible(true)}
                            icon="folder-outline"
                            style={styles.pickerButton}
                            contentStyle={styles.pickerButtonContent}
                            labelStyle={{ color: theme.colors.onSurface, fontSize: 13 }}>
                            {folders.find(f => f.id === selectedFolderId)?.name || 'None'}
                        </Button>
                    </View>

                    <FolderPicker
                        visible={pickerVisible}
                        onDismiss={() => setPickerVisible(false)}
                        onSelect={setSelectedFolderId}
                        selectedFolderId={selectedFolderId}
                        folders={folders}
                    />

                    {/* Rich Text Editor */}
                    <RichEditor
                        ref={editorRef}
                        placeholder="Write your thoughts, reflections, and insights..."
                        initialContentHTML={contentHtml}
                        onChange={handleContentChange}
                        onCursorPosition={handleCursorPosition}
                        useContainer={true}
                        initialHeight={350}
                        editorStyle={{
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                            placeholderColor: '#9CA3AF',
                            caretColor: theme.colors.primary,
                            contentCSSText: `
                                font-size: 16px;
                                line-height: 1.6;
                                padding: 12px 16px;
                                min-height: 300px;
                            `,
                        }}
                        style={[
                            styles.editor,
                            {
                                borderColor: theme.colors.outlineVariant,
                            },
                        ]}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.sm,
    },
    headerTitle: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolbar: {
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        height: 48,
    },
    toolbarBtnSelected: {
        backgroundColor: 'rgba(107, 33, 168, 0.08)',
        borderRadius: 6,
    },
    colorPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
    },
    colorPickerLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginRight: 8,
    },
    colorSwatches: {
        flexDirection: 'row',
        gap: 6,
    },
    colorSwatch: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noColorLine: {
        width: 20,
        height: 2,
        backgroundColor: '#EF4444',
        transform: [{ rotate: '-45deg' }],
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 120,
    },
    verseCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    verseText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    folderRow: {
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: Spacing.xs,
    },
    pickerButton: {
        borderRadius: BorderRadius.lg,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    pickerButtonContent: {
        height: 42,
        justifyContent: 'flex-start',
    },
    editor: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        minHeight: 350,
    },
});

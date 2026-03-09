import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import NotesScreen from './notes';
import RecordingsScreen from './recordings';
import FoldersScreen from './folders';
import HighlightsScreen from './highlights';
import {
    Spacing,
    BorderRadius,
    Shadows,
    Gradients,
} from '../../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

// 4 tabs including Highlights
type TabKey = 'notes' | 'highlights' | 'recordings' | 'folders';

const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'notes', label: 'Notes', icon: 'document-text' },
    { key: 'highlights', label: 'Highlights', icon: 'color-fill' },
    { key: 'recordings', label: 'Recordings', icon: 'mic' },
    { key: 'folders', label: 'Folders', icon: 'folder' },
];

export default function LibraryLayout() {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('notes');

    const handleTabChange = (tab: TabKey) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <LinearGradient
                colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
                style={styles.container}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
                            Library
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Your notes, recordings & folders
                        </Text>
                    </View>

                    {/* Tab Bar */}
                    <View
                        style={[styles.tabBar, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.key;
                            return (
                                <Pressable
                                    key={tab.key}
                                    onPress={() => handleTabChange(tab.key)}
                                    style={[
                                        styles.tab,
                                        isActive && [
                                            styles.tabActive,
                                            { backgroundColor: theme.colors.primaryContainer },
                                        ],
                                    ]}>
                                    <Ionicons
                                        name={isActive ? tab.icon : (`${tab.icon}-outline` as any)}
                                        size={22}
                                        color={
                                            isActive
                                                ? theme.colors.primary
                                                : theme.colors.onSurfaceVariant
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.tabLabel,
                                            {
                                                color: isActive
                                                    ? theme.colors.primary
                                                    : theme.colors.onSurfaceVariant,
                                            },
                                        ]}>
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Content */}
                    <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
                        {activeTab === 'notes' && <NotesScreen />}
                        {activeTab === 'highlights' && <HighlightsScreen />}
                        {activeTab === 'recordings' && <RecordingsScreen />}
                        {activeTab === 'folders' && <FoldersScreen />}
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: 5,
        borderRadius: BorderRadius.lg,
    },
    tab: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: BorderRadius.md,
        gap: 4,
    },
    tabActive: {
        // backgroundColor applied dynamically
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
    },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { useQuran } from '../../src/presentation/hooks/useQuran';
import { SurahList } from '../../src/presentation/components/quran/SurahList';
import { SurahPicker } from '../../src/presentation/components/common/SurahPicker';
import { WaveBackground } from '../../src/presentation/components/animated/WaveBackground';
import { FloatingParticles } from '../../src/presentation/components/animated/FloatingParticles';
import { NoorMascot } from '../../src/presentation/components/mascot/NoorMascot';
import { AnimatedButton } from '../../src/presentation/components/animated/AnimatedButton';
import { Spacing, Shadows } from '../../src/presentation/theme/DesignSystem';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ReadScreen() {
    const { loading, error, surahList, loadSurahList } = useQuran();
    const router = useRouter();
    const theme = useTheme();
    const [pickerVisible, setPickerVisible] = useState(false);
    const [minLoading, setMinLoading] = useState(true);

    useEffect(() => {
        loadSurahList();
        const timer = setTimeout(() => setMinLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const isAppLoading = loading || minLoading;

    const handleSelectSurah = (number: number) => {
        router.push(`/surah/${number}`);
    };

    if (isAppLoading) {
        return (
            <WaveBackground variant="spiritual" intensity="subtle">
                <FloatingParticles count={10} />
                <View style={[styles.center, { flex: 1 }]}>
                    <NoorMascot size={100} mood="calm" />
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 800 }}
                    >
                        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                            Loading Surahs…
                        </Text>
                    </MotiView>
                </View>
            </WaveBackground>
        );
    }

    if (error) {
        return (
            <WaveBackground variant="spiritual" intensity="subtle">
                <View style={[styles.center, { flex: 1 }]}>
                    <NoorMascot size={100} mood="calm" />
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 200 }}
                        style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>
                            {error}
                        </Text>
                        <AnimatedButton
                            label="Try Again"
                            icon="refresh"
                            onPress={loadSurahList}
                            variant="primary"
                            size="md"
                        />
                    </MotiView>
                </View>
            </WaveBackground>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <StatusBar style={theme.dark ? 'light' : 'dark'} />

                {/* Header — title + search + jump */}
                <MotiView
                    from={{ opacity: 0, translateY: -15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 50 }}
                    style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                        Quran
                    </Text>
                    <View style={styles.headerActions}>
                        <AnimatedButton
                            label="Jump"
                            icon="book-outline"
                            onPress={() => setPickerVisible(true)}
                            variant="secondary"
                            size="sm"
                        />
                    </View>
                </MotiView>

                {/* Full-screen Surah list */}
                <SurahList
                    surahs={surahList}
                    onSelect={handleSelectSurah}
                />

                <SurahPicker
                    visible={pickerVisible}
                    onDismiss={() => setPickerVisible(false)}
                    onSelect={handleSelectSurah}
                    surahs={surahList.map(s => ({
                        number: s.number,
                        name: s.name,
                        englishName: s.englishName,
                    }))}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    errorText: {
        fontSize: 16,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

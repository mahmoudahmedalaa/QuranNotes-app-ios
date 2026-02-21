import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { Gradients, Spacing, BorderRadius } from '../../theme/DesignSystem';
import { ShareService } from '../../../infrastructure/sharing/ShareService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CARD_PADDING = Spacing.xl;

// ── Types ────────────────────────────────────────────────────────────
export interface VerseShareData {
    surahName: string;
    surahNameArabic: string;
    verseNumber: number;
    arabicText: string;
    englishText?: string;
}

export interface KhatmaShareData {
    completedDate: string;
    totalDays: number;
}

export interface StreakShareData {
    streakCount: number;
}

export type ShareCardType = 'verse' | 'khatma' | 'streak';

// ── Ref handle ───────────────────────────────────────────────────────
export interface ShareCardHandle {
    capture: () => Promise<void>;
}

// ── Component ────────────────────────────────────────────────────────
interface ShareCardGeneratorProps {
    type: ShareCardType;
    verseData?: VerseShareData;
    khatmaData?: KhatmaShareData;
    streakData?: StreakShareData;
}

export const ShareCardGenerator = forwardRef<ShareCardHandle, ShareCardGeneratorProps>(
    ({ type, verseData, khatmaData, streakData }, ref) => {
        const viewShotRef = useRef<ViewShot>(null);

        const capture = useCallback(async () => {
            if (!viewShotRef.current) return;
            try {
                const uri = await (viewShotRef.current as any).capture();
                if (uri) {
                    await ShareService.shareImage(uri, 'Shared from QuranNotes ✨');
                }
            } catch (error) {
                console.error('Share card capture failed:', error);
            }
        }, []);

        useImperativeHandle(ref, () => ({ capture }), [capture]);

        return (
            <View style={styles.offscreen}>
                <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'png', quality: 1 }}
                    style={styles.shotContainer}
                >
                    {type === 'verse' && verseData && <VerseCard data={verseData} />}
                    {type === 'khatma' && khatmaData && <KhatmaCard data={khatmaData} />}
                    {type === 'streak' && streakData && <StreakCard data={streakData} />}
                </ViewShot>
            </View>
        );
    },
);

ShareCardGenerator.displayName = 'ShareCardGenerator';

// ═══════════════════════════════════════════════════════════════════════
// Verse Card
// ═══════════════════════════════════════════════════════════════════════
const VerseCard = ({ data }: { data: VerseShareData }) => (
    <LinearGradient
        colors={['#0F172A', '#1E293B', '#1A1340']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.card}
    >
        {/* Decorative top gold accent */}
        <LinearGradient
            colors={['#C9983A', '#E8C872', '#C9983A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goldStripe}
        />

        {/* Corner ornaments */}
        <Text style={styles.cornerOrnamentLeft}>✦</Text>
        <Text style={styles.cornerOrnamentRight}>✦</Text>

        {/* Bismillah */}
        <Text style={styles.ornament}>﷽</Text>

        {/* Surah name */}
        <Text style={styles.surahArabic}>{data.surahNameArabic}</Text>
        <Text style={styles.surahEnglish}>
            {data.surahName.toUpperCase()} · VERSE {data.verseNumber}
        </Text>

        {/* Arabic verse — glassmorphic container */}
        <View style={styles.verseContainer}>
            <View style={styles.verseInnerBorder}>
                <Text style={styles.arabicVerse}>{data.arabicText}</Text>
            </View>
        </View>

        {/* English translation */}
        {data.englishText && (
            <Text style={styles.englishTranslation} numberOfLines={6}>
                "{data.englishText}"
            </Text>
        )}

        {/* Decorative divider */}
        <View style={styles.decorativeDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerStar}>✦</Text>
            <View style={styles.dividerLine} />
        </View>

        {/* Branding — prominent with tagline */}
        <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>QuranNotes</Text>
        </View>
        <Text style={styles.brandTagline}>Read · Reflect · Remember</Text>
    </LinearGradient>
);

// ═══════════════════════════════════════════════════════════════════════
// Khatma Completion Card
// ═══════════════════════════════════════════════════════════════════════
const KhatmaCard = ({ data }: { data: KhatmaShareData }) => (
    <LinearGradient
        colors={['#1A2421', '#2C4035', '#1B3022']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
    >
        <LinearGradient
            colors={['#4CAF50', '#81C784', '#4CAF50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goldStripe}
        />

        <Text style={styles.achievementEmoji}>🏆</Text>
        <Text style={styles.achievementTitle}>Khatma Complete!</Text>
        <Text style={styles.achievementSubtitle}>
            Completed the entire Quran
        </Text>

        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{data.totalDays}</Text>
                <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>30</Text>
                <Text style={styles.statLabel}>Juz</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>114</Text>
                <Text style={styles.statLabel}>Surahs</Text>
            </View>
        </View>

        <Text style={styles.achievementDate}>{data.completedDate}</Text>

        <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.brandText}>QuranNotes</Text>
        </View>
    </LinearGradient>
);

// ═══════════════════════════════════════════════════════════════════════
// Streak Milestone Card
// ═══════════════════════════════════════════════════════════════════════
const StreakCard = ({ data }: { data: StreakShareData }) => (
    <LinearGradient
        colors={['#2E1610', '#4A2518', '#381A12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
    >
        <LinearGradient
            colors={['#FF6347', '#FF8C69', '#FF6347']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goldStripe}
        />

        <Text style={styles.achievementEmoji}>🔥</Text>
        <Text style={styles.achievementTitle}>
            {data.streakCount} Day Streak!
        </Text>
        <Text style={styles.achievementSubtitle}>
            {data.streakCount >= 30
                ? 'A month of consistent Quran reading!'
                : data.streakCount >= 7
                    ? 'A full week of daily Quran reading!'
                    : 'Building a beautiful habit with the Quran'}
        </Text>

        <Text style={[styles.streakBigNumber, { color: '#FF8C69' }]}>
            {data.streakCount}
        </Text>
        <Text style={styles.streakLabel}>consecutive days</Text>

        <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: '#FF6347' }]} />
            <Text style={styles.brandText}>QuranNotes</Text>
        </View>
    </LinearGradient>
);

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    offscreen: {
        position: 'absolute',
        left: -9999,
        top: -9999,
        opacity: 0,
    },
    shotContainer: {
        width: CARD_WIDTH,
    },
    card: {
        width: CARD_WIDTH,
        borderRadius: BorderRadius.xl,
        padding: CARD_PADDING,
        alignItems: 'center',
        overflow: 'hidden',
    },
    goldStripe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    ornament: {
        fontSize: 32,
        color: '#D4A853',
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    surahArabic: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    surahEnglish: {
        fontSize: 14,
        color: '#A8B2D1',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: Spacing.lg,
    },
    verseContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        width: '100%',
        marginBottom: Spacing.md,
    },
    arabicVerse: {
        fontSize: 26,
        color: '#FFFFFF',
        textAlign: 'right',
        lineHeight: 48,
    },
    englishTranslation: {
        fontSize: 15,
        color: '#8892B0',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 24,
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        justifyContent: 'center',
    },
    brandDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D4A853',
        marginRight: Spacing.xs,
    },
    brandText: {
        fontSize: 13,
        color: '#8892B0',
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    brandTagline: {
        fontSize: 11,
        color: '#5B7FFF',
        letterSpacing: 1,
        fontWeight: '500',
        marginTop: 4,
    },
    cornerOrnamentLeft: {
        position: 'absolute',
        top: 16,
        left: 16,
        fontSize: 12,
        color: '#C9983A',
        opacity: 0.5,
    },
    cornerOrnamentRight: {
        position: 'absolute',
        top: 16,
        right: 16,
        fontSize: 12,
        color: '#C9983A',
        opacity: 0.5,
    },
    verseInnerBorder: {
        borderWidth: 1,
        borderColor: 'rgba(201,152,58,0.2)',
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    decorativeDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerStar: {
        fontSize: 10,
        color: '#C9983A',
        marginHorizontal: Spacing.sm,
        opacity: 0.6,
    },
    achievementEmoji: {
        fontSize: 56,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    achievementTitle: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    achievementSubtitle: {
        fontSize: 15,
        color: '#A8B2D1',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    statNumber: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        color: '#8892B0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: Spacing.xs,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    achievementDate: {
        fontSize: 13,
        color: '#8892B0',
        marginBottom: Spacing.sm,
    },
    streakBigNumber: {
        fontSize: 72,
        fontWeight: '900',
        marginBottom: Spacing.xs,
    },
    streakLabel: {
        fontSize: 14,
        color: '#A8B2D1',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: Spacing.lg,
    },
});

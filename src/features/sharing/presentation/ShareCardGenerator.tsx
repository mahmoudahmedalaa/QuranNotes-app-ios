/**
 * ShareCardGenerator — Template-driven share card renderer.
 *
 * All templates use gradient backgrounds for a clean, premium look.
 * Adaptive font sizing + adjustsFontSizeToFit prevent overflow on long verses.
 *
 * Used inside PremiumShareSheet's ViewShot to capture the final share image.
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShareCardData } from '../domain/ShareTemplateTypes';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_ASPECT = 4 / 5;
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT;

interface ShareCardGeneratorProps {
    templateId: string;
    data: ShareCardData;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTIVE TEXT SIZING
// ═══════════════════════════════════════════════════════════════════════════

const getArabicSizing = (text: string | undefined) => {
    const len = text?.length ?? 0;
    if (len <= 30) return { fontSize: 26, lineHeight: 44 };
    if (len <= 60) return { fontSize: 24, lineHeight: 40 };
    if (len <= 100) return { fontSize: 21, lineHeight: 36 };
    if (len <= 160) return { fontSize: 19, lineHeight: 32 };
    return { fontSize: 17, lineHeight: 28 };
};

const getEnglishSizing = (text: string | undefined) => {
    const len = text?.length ?? 0;
    if (len <= 50) return { fontSize: 15, lineHeight: 22 };
    if (len <= 100) return { fontSize: 14, lineHeight: 20 };
    if (len <= 180) return { fontSize: 13, lineHeight: 19 };
    return { fontSize: 12, lineHeight: 18 };
};

// ═══════════════════════════════════════════════════════════════════════════
// BRANDING WATERMARK
// ═══════════════════════════════════════════════════════════════════════════

const CONTENT_LABEL: Record<string, string> = {
    hadith: 'Hadith of the Day',
    verse: 'Verse of the Day',
    'mood-verse': 'Verse for You',
};

const Watermark: React.FC<{ color: string; contentType?: string }> = ({ color, contentType }) => (
    <View style={styles.watermark}>
        {contentType && CONTENT_LABEL[contentType] ? (
            <Text style={[styles.contentLabel, { color }]}>{CONTENT_LABEL[contentType]}</Text>
        ) : null}
        <View style={styles.watermarkRow}>
            <MaterialCommunityIcons name="book-open-page-variant" size={10} color={color} />
            <Text style={[styles.watermarkText, { color }]}>QuranNotes</Text>
        </View>
    </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// SHARED CONTENT RENDERER — DRY across all templates
// ═══════════════════════════════════════════════════════════════════════════

interface ContentProps {
    data: ShareCardData;
    arabicColor: string;
    englishColor: string;
    refColor: string;
    dividerColor: string;
    statsTextColor: string;
    statsAccentColor: string;
    statsBgColor: string;
}

const CardContent: React.FC<ContentProps> = ({
    data, arabicColor, englishColor, refColor, dividerColor,
    statsTextColor, statsAccentColor, statsBgColor,
}) => {
    const isVerseOnly = data.type === 'verse' || data.type === 'mood-verse';
    const arSz = getArabicSizing(data.arabicText);
    const enSz = getEnglishSizing(data.englishText);
    const arabicFontStyle = data.quranFontFamily
        ? { fontFamily: data.quranFontFamily }
        : { fontWeight: '700' as const };
    return (
        <View style={styles.contentArea}>
            {data.arabicText ? (
                <Text
                    style={[
                        styles.arabic,
                        {
                            color: arabicColor,
                            fontSize: isVerseOnly ? Math.min(arSz.fontSize + 4, 32) : arSz.fontSize,
                            lineHeight: isVerseOnly ? Math.min(arSz.lineHeight + 8, 56) : arSz.lineHeight,
                        },
                        arabicFontStyle,
                    ]}
                    adjustsFontSizeToFit
                    numberOfLines={isVerseOnly ? 12 : 8}
                >
                    {data.arabicText}
                </Text>
            ) : null}

            <View style={[styles.thinDivider, { backgroundColor: dividerColor }]} />

            {!isVerseOnly && data.englishText ? (
                <Text
                    style={[styles.english, { color: englishColor, fontSize: enSz.fontSize, lineHeight: enSz.lineHeight }]}
                    adjustsFontSizeToFit
                    numberOfLines={6}
                >
                    {data.englishText}
                </Text>
            ) : null}

            {renderReference(data, refColor)}

            {data.type === 'khatma' && data.stats ? (
                <StatsRow stats={data.stats} textColor={statsTextColor} accentColor={statsAccentColor} bgColor={statsBgColor} />
            ) : null}
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES — All gradient-based, no ornament lines
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Minimal Light — soft warm gradient ───────────────────────────────

const MinimalLight: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#FAF8FF', '#F0ECFF', '#EDE5FF']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
        <CardContent
            data={data}
            arabicColor="#1C1033"
            englishColor="#3D3356"
            refColor="#6246EA"
            dividerColor="rgba(98, 70, 234, 0.15)"
            statsTextColor="#1C1033"
            statsAccentColor="#6246EA"
            statsBgColor="rgba(98, 70, 234, 0.06)"
        />
        <Watermark color="#94A3B8" contentType={data.type} />
    </LinearGradient>
);

// ── 2. Minimal Dark — deep ink gradient ─────────────────────────────────

const MinimalDark: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#09090B', '#111115', '#18181D']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <CardContent
            data={data}
            arabicColor="#FAFAFA"
            englishColor="#D4D4D8"
            refColor="#A78BFA"
            dividerColor="rgba(167, 139, 250, 0.2)"
            statsTextColor="#FAFAFA"
            statsAccentColor="#A78BFA"
            statsBgColor="rgba(167, 139, 250, 0.08)"
        />
        <Watermark color="#52525B" contentType={data.type} />
    </LinearGradient>
);

// ── 3. Classic Gold — warm amber gradient ───────────────────────────────

const ClassicGold: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#422006', '#78350F', '#92400E']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <CardContent
            data={data}
            arabicColor="#FEF3C7"
            englishColor="#FDE68A"
            refColor="#FBBF24"
            dividerColor="rgba(251, 191, 36, 0.25)"
            statsTextColor="#FEF3C7"
            statsAccentColor="#FBBF24"
            statsBgColor="rgba(251, 191, 36, 0.1)"
        />
        <Watermark color="rgba(254, 243, 199, 0.5)" contentType={data.type} />
    </LinearGradient>
);

// ── 4. Cosmic Night (Premium) — deep indigo with stars ──────────────────

const CosmicNight: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#0F0A2A', '#1E1A2E', '#2D1F6E']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {STAR_POSITIONS.map((star, i) => (
            <View
                key={i}
                style={[styles.starDot, {
                    top: star.top as DimensionValue,
                    left: star.left as DimensionValue,
                    width: star.size,
                    height: star.size,
                    borderRadius: star.size / 2,
                    opacity: star.opacity,
                }]}
            />
        ))}
        <CardContent
            data={data}
            arabicColor="#E9D5FF"
            englishColor="#C4B5FD"
            refColor="#A78BFA"
            dividerColor="rgba(167, 139, 250, 0.25)"
            statsTextColor="#E9D5FF"
            statsAccentColor="#A78BFA"
            statsBgColor="rgba(167, 139, 250, 0.1)"
        />
        <Watermark color="rgba(167, 139, 250, 0.5)" contentType={data.type} />
    </LinearGradient>
);

const STAR_POSITIONS = [
    { top: '8%', left: '12%', size: 3, opacity: 0.6 },
    { top: '15%', left: '78%', size: 2, opacity: 0.4 },
    { top: '22%', left: '45%', size: 2.5, opacity: 0.5 },
    { top: '35%', left: '88%', size: 2, opacity: 0.3 },
    { top: '5%', left: '55%', size: 3, opacity: 0.5 },
    { top: '12%', left: '30%', size: 2, opacity: 0.4 },
    { top: '42%', left: '8%', size: 2.5, opacity: 0.3 },
    { top: '50%', left: '72%', size: 2, opacity: 0.5 },
];

// ── 5. Emerald Serenity (Premium) — deep forest gradient ────────────────

const EmeraldSerenity: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#022C22', '#064E3B', '#065F46']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <View style={[styles.cornerAccent, styles.cornerTopRight, { borderColor: 'rgba(52, 211, 153, 0.15)' }]} />
        <View style={[styles.cornerAccent, styles.cornerBottomLeft, { borderColor: 'rgba(52, 211, 153, 0.15)' }]} />
        <CardContent
            data={data}
            arabicColor="#D1FAE5"
            englishColor="#A7F3D0"
            refColor="#34D399"
            dividerColor="rgba(52, 211, 153, 0.25)"
            statsTextColor="#D1FAE5"
            statsAccentColor="#34D399"
            statsBgColor="rgba(52, 211, 153, 0.1)"
        />
        <Watermark color="rgba(167, 243, 208, 0.45)" contentType={data.type} />
    </LinearGradient>
);

// ── 6. Royal Calligraphy (Premium) — indigo-gold with frame ─────────────

const RoyalCalligraphy: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#0F0B2A', '#1A1340', '#251E50']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.royalFrame}>
            <CardContent
                data={data}
                arabicColor="#FFFFFF"
                englishColor="#E2E8F0"
                refColor="#F5C542"
                dividerColor="rgba(245, 197, 66, 0.2)"
                statsTextColor="#FFFFFF"
                statsAccentColor="#F5C542"
                statsBgColor="rgba(245, 197, 66, 0.08)"
            />
        </View>
        <Watermark color="rgba(245, 197, 66, 0.45)" contentType={data.type} />
    </LinearGradient>
);

// ── 7. Sunset Warmth (Premium) — deep terracotta gradient ───────────────

const SunsetWarmth: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#431407', '#7C2D12', '#9A3412']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
        <View style={styles.sunGlow} />
        <CardContent
            data={data}
            arabicColor="#FFF7ED"
            englishColor="#FFEDD5"
            refColor="#FBBF24"
            dividerColor="rgba(251, 191, 36, 0.25)"
            statsTextColor="#FFF7ED"
            statsAccentColor="#FBBF24"
            statsBgColor="rgba(251, 191, 36, 0.1)"
        />
        <Watermark color="rgba(254, 215, 170, 0.45)" contentType={data.type} />
    </LinearGradient>
);

// ── 8. Lavender Dreams (Premium) — rich purple gradient ─────────────────

const LavenderDreams: React.FC<{ data: ShareCardData }> = ({ data }) => (
    <LinearGradient colors={['#4C1D95', '#6D28D9', '#7C3AED']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.dreamCircle, { top: '5%', left: '10%', backgroundColor: 'rgba(255, 255, 255, 0.06)' }]} />
        <View style={[styles.dreamCircle, { top: '55%', right: '-5%', backgroundColor: 'rgba(255, 255, 255, 0.04)', width: 120, height: 120, borderRadius: 60 }]} />
        <CardContent
            data={data}
            arabicColor="#FFFFFF"
            englishColor="#EDE9FE"
            refColor="#DDD6FE"
            dividerColor="rgba(255, 255, 255, 0.2)"
            statsTextColor="#FFFFFF"
            statsAccentColor="#DDD6FE"
            statsBgColor="rgba(255, 255, 255, 0.08)"
        />
        <Watermark color="rgba(255, 255, 255, 0.5)" contentType={data.type} />
    </LinearGradient>
);

// ═══════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const renderReference = (data: ShareCardData, color: string) => {
    const ref = data.reference || data.hadithSource;
    if (!ref) return null;
    return (
        <View style={styles.refContainer}>
            {data.narrator ? (
                <Text style={[styles.narrator, { color, opacity: 0.7 }]} numberOfLines={1}>{data.narrator}</Text>
            ) : null}
            <Text style={[styles.reference, { color }]} numberOfLines={1}>{ref}</Text>
        </View>
    );
};

const StatsRow: React.FC<{
    stats: { label: string; value: string | number }[];
    textColor: string;
    accentColor: string;
    bgColor: string;
}> = ({ stats, textColor, accentColor, bgColor }) => (
    <View style={[styles.statsRow, { backgroundColor: bgColor }]}>
        {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
                {i > 0 && <View style={[styles.statDivider, { backgroundColor: accentColor, opacity: 0.3 }]} />}
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: accentColor }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>{stat.label}</Text>
                </View>
            </React.Fragment>
        ))}
    </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE MAP & MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATE_MAP: Record<string, React.FC<{ data: ShareCardData }>> = {
    'minimal-light': MinimalLight,
    'minimal-dark': MinimalDark,
    'classic-gold': ClassicGold,
    'cosmic-night': CosmicNight,
    'emerald-serenity': EmeraldSerenity,
    'royal-calligraphy': RoyalCalligraphy,
    'sunset-warmth': SunsetWarmth,
    'lavender-dreams': LavenderDreams,
};

export const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({ templateId, data }) => {
    const TemplateComponent = TEMPLATE_MAP[templateId] ?? MinimalLight;
    return <TemplateComponent data={data} />;
};

export default ShareCardGenerator;

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Content area — paddingBottom reserves space for the watermark
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // Text
    arabic: {
        textAlign: 'center',
        marginBottom: 8,
        writingDirection: 'rtl',
    },
    english: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 8,
    },

    // Reference
    refContainer: {
        alignItems: 'center',
        marginTop: 6,
    },
    reference: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    narrator: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
        textAlign: 'center',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 12,
        gap: 0,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: {
        fontSize: 9,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDivider: { width: 1, height: 20 },

    // Divider
    thinDivider: {
        width: 40,
        height: 2,
        borderRadius: 1,
        marginVertical: 10,
    },

    // Royal frame (used by Royal Calligraphy only)
    royalFrame: {
        flex: 1,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(245, 197, 66, 0.15)',
        borderRadius: 20,
        margin: 10,
    },

    // Decorative elements
    starDot: {
        position: 'absolute',
        backgroundColor: '#A78BFA',
    },
    cornerAccent: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderWidth: 1,
    },
    cornerTopRight: {
        top: 16,
        right: 16,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
        bottom: 16,
        left: 16,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 12,
    },
    sunGlow: {
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    dreamCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },

    // Watermark — positioned in the reserved paddingBottom zone
    watermark: {
        position: 'absolute',
        bottom: 10,
        alignItems: 'center',
        gap: 2,
    },
    contentLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    watermarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    watermarkText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

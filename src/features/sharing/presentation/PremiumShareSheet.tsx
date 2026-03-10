/**
 * PremiumShareSheet — Bottom sheet modal for template selection and sharing.
 *
 * Shows a live preview of the selected template and a 2-column grid of
 * template thumbnails. Premium templates show a lock icon for free users.
 * Tapping a locked template navigates to the paywall.
 *
 * ✅ Dark mode aware — uses react-native-paper useTheme()
 * ✅ Subdued, on-brand share button
 */
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useRouter } from 'expo-router';

import { usePro } from '../../auth/infrastructure/ProContext';
import { ShareCardGenerator } from './ShareCardGenerator';
import { ShareTemplatePreview } from './ShareTemplatePreview';
import { ShareService } from '../infrastructure/ShareService';
import { getTemplatesForContent } from '../domain/ShareTemplateRegistry';
import { ShareCardData, ShareContentType } from '../domain/ShareTemplateTypes';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PremiumShareSheetProps {
    visible: boolean;
    onDismiss: () => void;
    data: ShareCardData;
}

export const PremiumShareSheet: React.FC<PremiumShareSheetProps> = ({
    visible,
    onDismiss,
    data,
}) => {
    const { isPro } = usePro();
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.dark;
    const viewShotRef = useRef<ViewShot | null>(null);

    // Get available templates for this content type
    const templates = getTemplatesForContent(data.type);
    const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? 'minimal-light');
    const [isSharing, setIsSharing] = useState(false);

    const handleSelectTemplate = useCallback((templateId: string, isPremiumTemplate: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (isPremiumTemplate && !isPro) {
            // Free user tapping premium template → paywall
            router.push('/paywall?reason=premium-sharing' as any);
            return;
        }

        setSelectedTemplateId(templateId);
    }, [isPro, router]);

    const handleShare = useCallback(async () => {
        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const success = await ShareService.shareFromViewShot(viewShotRef, 'Share from QuranNotes');
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('Sharing Unavailable', 'Unable to share at this time. Please try again.');
            }
        } catch (e) {
            if (__DEV__) console.warn('[PremiumShareSheet] Share failed:', e);
            Alert.alert('Error', 'Something went wrong while sharing.');
        } finally {
            setIsSharing(false);
        }
    }, []);

    // ── Dark-mode aware colors ──────────────────────────────────────────
    const colors = {
        sheetBg: isDark ? '#18181B' : '#FFFFFF',
        handleBg: isDark ? '#3F3F46' : '#E2E8F0',
        headerTitle: isDark ? '#FAFAFA' : '#1C1033',
        closeIcon: isDark ? '#A1A1AA' : '#64748B',
        closeBtnBg: isDark ? '#27272A' : '#F1F5F9',
        sectionTitle: isDark ? '#FAFAFA' : '#1C1033',
        proBannerBg: isDark ? '#422006' : '#FEF3C7',
        proBannerText: isDark ? '#FBBF24' : '#92400E',
        // Share button — toned down, matte dark instead of bright purple
        shareButtonBg: isDark ? '#27272A' : '#1C1033',
        shareButtonText: isDark ? '#FAFAFA' : '#FFFFFF',
        shareButtonShadow: isDark ? '#000000' : '#1C1033',
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                {/* Prevent taps on the sheet from closing */}
                <Pressable style={[styles.sheet, { backgroundColor: colors.sheetBg }]} onPress={(e) => e.stopPropagation()}>
                    {/* ── Header ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: -10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300 }}
                    >
                        <View style={styles.header}>
                            <View style={[styles.handle, { backgroundColor: colors.handleBg }]} />
                            <View style={styles.headerRow}>
                                <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>Share as Image</Text>
                                <Pressable
                                    onPress={onDismiss}
                                    hitSlop={12}
                                    style={({ pressed }) => [
                                        styles.closeBtn,
                                        { backgroundColor: colors.closeBtnBg },
                                        pressed && { opacity: 0.6 },
                                    ]}
                                >
                                    <MaterialCommunityIcons name="close" size={20} color={colors.closeIcon} />
                                </Pressable>
                            </View>
                        </View>
                    </MotiView>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                    >
                        {/* ── Live Preview ── */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 100 }}
                            style={styles.previewContainer}
                        >
                            <ViewShot
                                ref={viewShotRef}
                                options={{ format: 'png', quality: 1.0 }}
                            >
                                <ShareCardGenerator
                                    templateId={selectedTemplateId}
                                    data={data}
                                />
                            </ViewShot>
                        </MotiView>

                        {/* ── Template Grid ── */}
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300, delay: 200 }}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Choose Template</Text>
                            {!isPro && (
                                <View style={[styles.proBanner, { backgroundColor: colors.proBannerBg }]}>
                                    <MaterialCommunityIcons name="crown" size={14} color="#F5C542" />
                                    <Text style={[styles.proBannerText, { color: colors.proBannerText }]}>
                                        Unlock 5 premium templates with Pro
                                    </Text>
                                </View>
                            )}
                            <View style={styles.grid}>
                                {templates.map((template, index) => (
                                    <MotiView
                                        key={template.id}
                                        from={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            damping: 18,
                                            stiffness: 120,
                                            delay: 250 + index * 60,
                                        }}
                                    >
                                        <ShareTemplatePreview
                                            template={template}
                                            isSelected={selectedTemplateId === template.id}
                                            isLocked={template.isPremium && !isPro}
                                            onPress={() => handleSelectTemplate(template.id, template.isPremium)}
                                        />
                                    </MotiView>
                                ))}
                            </View>
                        </MotiView>
                    </ScrollView>

                    {/* ── Share Button — toned down, matte dark ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 400 }}
                        style={styles.shareContainer}
                    >
                        <Pressable
                            onPress={handleShare}
                            disabled={isSharing}
                            style={({ pressed }) => [
                                styles.shareButton,
                                { backgroundColor: colors.shareButtonBg, shadowColor: colors.shareButtonShadow },
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                                isSharing && { opacity: 0.7 },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={isSharing ? 'loading' : 'share-variant'}
                                size={18}
                                color={colors.shareButtonText}
                            />
                            <Text style={[styles.shareButtonText, { color: colors.shareButtonText }]}>
                                {isSharing ? 'Sharing...' : 'Share'}
                            </Text>
                        </Pressable>
                    </MotiView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '92%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },

    // ── Header ──────────────────────────────────────────────────────────
    header: {
        paddingTop: 8,
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Scroll ──────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },

    // ── Preview ─────────────────────────────────────────────────────────
    previewContainer: {
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#1A1D21',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // ── Grid ────────────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    proBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    proBannerText: {
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    // ── Share Button — matte, premium feel ──────────────────────────────
    shareContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});

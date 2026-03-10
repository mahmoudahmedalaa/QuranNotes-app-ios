/**
 * ShareTemplatePreview — Thumbnail chip for the template selection grid.
 *
 * Shows a gradient preview with the template name, icon, and a lock overlay
 * for premium templates when the user is not Pro.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShareTemplate } from '../domain/ShareTemplateTypes';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2; // 2 columns, 12px gap, 24px padding each side
const THUMB_HEIGHT = 80;

interface ShareTemplatePreviewProps {
    template: ShareTemplate;
    isSelected: boolean;
    isLocked: boolean; // true if premium + user is not Pro
    onPress: () => void;
}

export const ShareTemplatePreview: React.FC<ShareTemplatePreviewProps> = ({
    template,
    isSelected,
    isLocked,
    onPress,
}) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.container,
            isSelected && styles.selected,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
    >
        <LinearGradient
            colors={template.previewColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Template icon */}
            <MaterialCommunityIcons
                name={template.icon as any}
                size={20}
                color={isLightTemplate(template) ? '#1C1033' : '#FFFFFF'}
                style={{ opacity: 0.8 }}
            />

            {/* Template name */}
            <Text
                style={[
                    styles.name,
                    { color: isLightTemplate(template) ? '#1C1033' : '#FFFFFF' },
                ]}
                numberOfLines={1}
            >
                {template.name}
            </Text>

            {/* Lock overlay for premium */}
            {isLocked && (
                <View style={styles.lockOverlay}>
                    <View style={styles.lockBadge}>
                        <MaterialCommunityIcons name="lock" size={14} color="#FFFFFF" />
                        <Text style={styles.lockText}>PRO</Text>
                    </View>
                </View>
            )}
        </LinearGradient>
    </Pressable>
);

/** Check if a template has a light background (for text color contrast). */
function isLightTemplate(template: ShareTemplate): boolean {
    // Simple heuristic: if the first preview color starts with '#F' or '#E' or '#D' or '#C' or '#FFFFFF'
    const c = template.previewColors[0].toUpperCase();
    return c.startsWith('#F') || c.startsWith('#E') || c.startsWith('#D') || c.startsWith('#C') || c === '#FFFFFF';
}

const styles = StyleSheet.create({
    container: {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selected: {
        borderColor: '#6246EA',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    lockText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

/**
 * SuccessBanner — A beautiful animated inline success notification.
 * Slides down from the top, holds, then slides back up.
 * Much more premium than react-native-toast-message.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, View, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuccessBannerProps {
    visible: boolean;
    title: string;
    subtitle?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    duration?: number; // auto-dismiss after ms (default 2500)
    onDismiss?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
    visible,
    title,
    subtitle,
    icon = 'check-circle',
    duration = 2500,
    onDismiss,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: -120,
                useNativeDriver: true,
                damping: 20,
                stiffness: 200,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss?.());
    }, [translateY, opacity, onDismiss]);

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 18,
                    stiffness: 160,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(dismiss, duration);
        } else {
            dismiss();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top + 8,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents="none"
        >
            <View style={styles.banner}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name={icon} size={18} color="#FFF" />
                </View>
                <View style={styles.textGroup}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B2838',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        width: '100%',
        maxWidth: SCREEN_WIDTH - 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textGroup: {
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 1,
    },
});

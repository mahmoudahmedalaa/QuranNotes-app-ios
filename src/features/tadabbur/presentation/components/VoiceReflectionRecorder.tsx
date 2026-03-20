/**
 * VoiceReflectionRecorder — Pro-only voice recording for Tadabbur reflections.
 * Uses expo-av for audio capture with a soothing, meditative UI.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface VoiceReflectionRecorderProps {
    onRecordingComplete: (uri: string, durationMs: number) => void;
    onCancel: () => void;
}

export const VoiceReflectionRecorder: React.FC<VoiceReflectionRecorderProps> = ({
    onRecordingComplete,
    onCancel,
}) => {
    const theme = useTheme();
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [durationMs, setDurationMs] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Request permissions on mount
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                setHasPermission(status === 'granted');
            } catch {
                setHasPermission(false);
            }
        })();

        return () => {
            // Cleanup timer on unmount
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = useCallback(async () => {
        if (!hasPermission) {
            Alert.alert(
                'Microphone Access',
                'Please grant microphone permission in Settings to record voice reflections.',
            );
            return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );

            recordingRef.current = recording;
            setIsRecording(true);
            setIsPaused(false);
            setDurationMs(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Start timer
            timerRef.current = setInterval(() => {
                setDurationMs((prev) => prev + 100);
            }, 100);
        } catch (e) {
            if (__DEV__) console.error('[VoiceRecorder] Start failed:', e);
            Alert.alert('Recording Error', 'Could not start recording. Please try again.');
        }
    }, [hasPermission]);

    const stopRecording = useCallback(async () => {
        if (!recordingRef.current) return;

        try {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            await recordingRef.current.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recordingRef.current.getURI();
            const finalDuration = durationMs;
            recordingRef.current = null;

            setIsRecording(false);
            setIsPaused(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (uri) {
                onRecordingComplete(uri, finalDuration);
            }
        } catch (e) {
            if (__DEV__) console.error('[VoiceRecorder] Stop failed:', e);
        }
    }, [durationMs, onRecordingComplete]);

    const cancelRecording = useCallback(async () => {
        if (recordingRef.current) {
            try {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                await recordingRef.current.stopAndUnloadAsync();
                recordingRef.current = null;
            } catch {
                // Ignore cleanup errors
            }
        }
        setIsRecording(false);
        setIsPaused(false);
        setDurationMs(0);
        onCancel();
    }, [onCancel]);

    // Format duration as M:SS
    const formatDuration = (ms: number): string => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const primaryColor = theme.dark ? '#A78BFA' : '#8B5CF6';
    const dimColor = theme.dark ? '#52525B' : '#94A3B8';

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.container}
        >
            {/* Duration display */}
            <View style={styles.durationContainer}>
                <Text
                    style={[
                        styles.duration,
                        { color: isRecording ? primaryColor : dimColor },
                    ]}
                >
                    {formatDuration(durationMs)}
                </Text>
                {isRecording && (
                    <MotiView
                        from={{ opacity: 0.3 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            type: 'timing',
                            duration: 800,
                            loop: true,
                        }}
                        style={[styles.recordingDot, { backgroundColor: '#EF4444' }]}
                    />
                )}
            </View>

            {/* Animated wave visualization */}
            {isRecording && (
                <View style={styles.waveContainer}>
                    {[...Array(7)].map((_, i) => (
                        <MotiView
                            key={i}
                            from={{ height: 8 }}
                            animate={{ height: 8 + Math.random() * 24 }}
                            transition={{
                                type: 'timing',
                                duration: 400 + i * 80,
                                loop: true,
                            }}
                            style={[
                                styles.waveBar,
                                {
                                    backgroundColor: `${primaryColor}${i % 2 === 0 ? '80' : '50'
                                        }`,
                                },
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
                {!isRecording ? (
                    /* Start recording */
                    <Pressable
                        onPress={startRecording}
                        style={({ pressed }) => [
                            styles.recordBtn,
                            {
                                backgroundColor: primaryColor,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
                        <Text style={styles.recordBtnText}>Start Recording</Text>
                    </Pressable>
                ) : (
                    /* Recording controls */
                    <View style={styles.recordingControls}>
                        <Pressable
                            onPress={cancelRecording}
                            style={[
                                styles.circleBtn,
                                {
                                    backgroundColor: theme.dark
                                        ? 'rgba(239,68,68,0.15)'
                                        : 'rgba(239,68,68,0.10)',
                                },
                            ]}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                        </Pressable>

                        <Pressable
                            onPress={stopRecording}
                            style={({ pressed }) => [
                                styles.stopBtn,
                                {
                                    backgroundColor: primaryColor,
                                    opacity: pressed ? 0.85 : 1,
                                },
                            ]}
                        >
                            <MaterialCommunityIcons name="stop" size={28} color="#FFFFFF" />
                        </Pressable>

                        <View style={styles.circleBtn} />
                    </View>
                )}

                {/* Cancel link */}
                {!isRecording && (
                    <Pressable onPress={onCancel} style={styles.cancelBtn}>
                        <Text style={[styles.cancelText, { color: dimColor }]}>
                            Switch to text
                        </Text>
                    </Pressable>
                )}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 24,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    duration: {
        fontSize: 48,
        fontWeight: '200',
        fontVariant: ['tabular-nums'],
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 40,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
    },
    controls: {
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },
    recordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
    },
    recordBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    recordingControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    circleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

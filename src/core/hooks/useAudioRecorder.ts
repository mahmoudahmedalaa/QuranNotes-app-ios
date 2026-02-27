import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';

export const useAudioRecorder = () => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);

    // Keep a ref so AppState listener always sees the latest recording
    const recordingRef = useRef<Audio.Recording | null>(null);

    /**
     * Force-cleanup any existing Recording instance.
     * Makes startRecording() idempotent — calling it twice never crashes.
     */
    const forceCleanup = useCallback(async () => {
        const existing = recordingRef.current;
        if (!existing) return;

        try {
            const status = await existing.getStatusAsync();
            if (status.isRecording || status.canRecord) {
                await existing.stopAndUnloadAsync();
            }
        } catch {
            // Already unloaded — ignore
        }
        recordingRef.current = null;
        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            // Always cleanup first — prevents "Only one Recording" crash
            await forceCleanup();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable microphone access in your device Settings to record audio.',
                    [{ text: 'OK' }],
                );
                return;
            }

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );

            recordingRef.current = newRecording;
            setRecording(newRecording);
            setIsRecording(true);
            setIsPaused(false);
        } catch (error) {
            console.error('Failed to start recording:', error);
            // Cleanup on failure
            await forceCleanup();
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        }
    }, [forceCleanup]);

    const pauseRecording = useCallback(async () => {
        const rec = recordingRef.current;
        if (!rec) return;

        try {
            await rec.pauseAsync();
            setIsPaused(true);
            setIsRecording(false);
        } catch (error) {
            if (__DEV__) console.warn('Failed to pause recording:', error);
        }
    }, []);

    const resumeRecording = useCallback(async () => {
        const rec = recordingRef.current;
        if (!rec) return;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            await rec.startAsync();
            setIsPaused(false);
            setIsRecording(true);
        } catch (error) {
            if (__DEV__) console.warn('Failed to resume recording:', error);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        const rec = recordingRef.current;
        if (!rec) return null;

        try {
            setIsRecording(false);
            setIsPaused(false);
            await rec.stopAndUnloadAsync();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const uri = rec.getURI();
            setRecordingUri(uri);
            recordingRef.current = null;
            setRecording(null);
            return uri;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            recordingRef.current = null;
            setRecording(null);
            return null;
        }
    }, []);

    // ── AppState: auto-pause on background, auto-resume on foreground ──
    useEffect(() => {
        const handleAppState = (nextState: AppStateStatus) => {
            const rec = recordingRef.current;
            if (!rec) return;

            if (nextState === 'background' || nextState === 'inactive') {
                // Going to background — pause the recording
                rec.pauseAsync().then(() => {
                    setIsPaused(true);
                    setIsRecording(false);
                }).catch(() => { });
            } else if (nextState === 'active') {
                // Coming back — resume if we were paused
                rec.getStatusAsync().then(async (status) => {
                    if (!status.isRecording && status.canRecord) {
                        await Audio.setAudioModeAsync({
                            allowsRecordingIOS: true,
                            playsInSilentModeIOS: true,
                        });
                        await rec.startAsync();
                        setIsPaused(false);
                        setIsRecording(true);
                    }
                }).catch(() => { });
            }
        };

        const sub = AppState.addEventListener('change', handleAppState);
        return () => sub.remove();
    }, []);

    return {
        recording,
        isRecording,
        isPaused,
        recordingUri,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        forceCleanup,
    };
};

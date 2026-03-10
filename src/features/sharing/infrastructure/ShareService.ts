import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { RefObject } from 'react';
import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';

/**
 * Service for capturing and sharing visual content.
 * Uses react-native-view-shot for capture and expo-sharing for the native share sheet.
 */
export class ShareService {
    /**
     * Capture a React view as a PNG and open the native share sheet.
     */
    static async captureAndShare(
        viewRef: RefObject<View>,
        message?: string,
    ): Promise<void> {
        if (!viewRef.current) return;

        try {
            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });

            await ShareService.shareImage(uri, message);
        } catch (error) {
            if (__DEV__) console.error('Failed to capture and share:', error);
            throw error;
        }
    }

    /**
     * Share a local image file via the native share sheet.
     */
    static async shareImage(uri: string, message?: string): Promise<void> {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            throw new Error('Sharing is not available on this device');
        }

        await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: message || 'Share from QuranNotes',
            UTI: 'public.png',
        });
    }

    /**
     * Capture from a ViewShot ref and share. Returns true on success, false otherwise.
     * Used by PremiumShareSheet for template-based sharing.
     */
    static async shareFromViewShot(
        viewShotRef: RefObject<ViewShot | null>,
        message?: string,
    ): Promise<boolean> {
        try {
            if (!viewShotRef.current?.capture) {
                if (__DEV__) console.warn('[ShareService] ViewShot ref not available');
                return false;
            }

            const uri = await viewShotRef.current.capture();

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                if (__DEV__) console.warn('[ShareService] Sharing not available on device');
                return false;
            }

            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: message || 'Share from QuranNotes',
                UTI: 'public.png',
            });

            return true;
        } catch (error) {
            if (__DEV__) console.error('[ShareService] shareFromViewShot failed:', error);
            return false;
        }
    }
}

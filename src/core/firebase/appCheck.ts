/**
 * Firebase App Check Configuration
 *
 * App Check verifies that requests to your Firebase backend come from
 * your genuine app running on a genuine, untampered device.
 * This blocks unauthorized API access from modified clients.
 *
 * Setup steps:
 * 1. Go to Firebase Console → App Check → Register your iOS app with DeviceCheck or App Attest
 * 2. Copy the site key and set EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN in .env (for dev only)
 * 3. Import and call initializeAppCheck() early in your app initialization
 *
 * Note: In development, App Check uses a debug provider.
 * In production, it uses DeviceCheck (iOS 14+) or App Attest (iOS 16+).
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/app-check';

/**
 * Initialize Firebase App Check.
 * Call this once during app startup, after Firebase is initialized.
 */
export function initializeAppCheck(): void {
    try {
        if (__DEV__) {
            // In development, use debug tokens
            // The debug token should be registered in the Firebase Console
            // under App Check → Manage debug tokens
            // @ts-expect-error — Debug token API exists at runtime
            self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }

        const appCheck = firebase.appCheck();
        appCheck.activate(
            // For iOS: Uses DeviceCheck by default
            // The provider is automatically selected based on iOS version
            'default',
            // isTokenAutoRefreshEnabled — automatically refreshes tokens
            true
        );

        if (__DEV__) console.log('[AppCheck] Initialized successfully');
    } catch (error) {
        if (__DEV__) console.warn('[AppCheck] Initialization failed:', error);
        // Non-fatal — app continues without App Check
        // Backend will still serve requests if App Check enforcement is not enabled
    }
}

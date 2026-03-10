import Purchases, {
    PurchasesOffering,
    PurchasesPackage,
    CustomerInfo,
    LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';
export { PurchasesOffering, PurchasesPackage, CustomerInfo };

const API_KEYS = {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

class RevenueCatService {
    private static instance: RevenueCatService;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    async initialize() {
        if (this.isInitialized) return;

        const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
        if (!apiKey) {
            if (__DEV__) console.warn('RevenueCat API key not found');
            return;
        }

        if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        await Purchases.configure({ apiKey });
        this.isInitialized = true;
    }

    async getOfferings(): Promise<PurchasesOffering | null> {
        if (!this.isInitialized) {
            if (__DEV__) console.warn('[RevenueCat] Not initialized, attempting to initialize...');
            await this.initialize();
        }

        try {
            const offerings = await Purchases.getOfferings();
            if (!offerings.current) {
                if (__DEV__) console.warn('[RevenueCat] No current offering found. Check RevenueCat dashboard.');
            }
            return offerings.current;
        } catch (e: unknown) {
            const err = e as { message?: string; code?: string; userInfo?: unknown };
            if (__DEV__) console.warn('[RevenueCat] Error fetching offerings:', err.message, err.code, err.userInfo);
            return null;
        }
    }

    async purchasePackage(pack: PurchasesPackage): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            const isPro = this.isPro(customerInfo);
            return { success: isPro };
        } catch (e: unknown) {
            // Log full error for debugging

            // Robust Cancellation Detection
            // Code 1 = UserCancelled
            const err = e as { userCancelled?: boolean; code?: string | number; message?: string };
            const isCancelled = err.userCancelled === true || err.code === '1' || err.code === 1 || (err.message && err.message.includes('cancelled'));

            if (isCancelled) {
                return { success: false, userCancelled: true };
            }

            // Sanitize Error Message
            let cleanMessage = 'Could not complete purchase.';
            if (err.message) {
                // Remove RevenueCat prefixes like "[RevenueCat] 🍎‼️"
                cleanMessage = err.message.replace(/\[RevenueCat\]|🍎|‼️/g, '').trim();
                // Fix capitalization
                cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
            }

            // Map common error codes to friendly messages
            if (err.code === 2) cleanMessage = 'Store problem. Please try again later.'; // StoreProblemError
            if (err.code === 3) cleanMessage = 'Purchase not allowed on this device.'; // PurchaseNotAllowedError
            if (err.code === 4) cleanMessage = 'Invalid purchase configuration.'; // InvalidPurchaseError
            if (err.code === 10) cleanMessage = 'Network error. Please check your connection.'; // NetworkError

            if (__DEV__) console.warn('[RevenueCat] Return user-friendly error:', cleanMessage);
            return { success: false, userCancelled: false, error: cleanMessage };
        }
    }

    async restorePurchases(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return this.isPro(customerInfo);
        } catch (e) {
            if (__DEV__) console.warn('Restore error:', e);
            return false;
        }
    }

    async getCustomerInfo(): Promise<CustomerInfo> {
        if (!this.isInitialized) {
            if (__DEV__) console.warn('[RevenueCat] Not initialized, attempting to initialize before getCustomerInfo...');
            await this.initialize();
        }
        return await Purchases.getCustomerInfo();
    }

    /**
     * Sync RevenueCat user identity with app auth state.
     * Must be called on every login/signup so entitlements are user-scoped.
     */
    async loginUser(appUserId: string): Promise<CustomerInfo | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        try {
            const { customerInfo } = await Purchases.logIn(appUserId);
            if (__DEV__) console.log('[RevenueCat] logIn success for:', appUserId, 'isPro:', this.isPro(customerInfo));
            return customerInfo;
        } catch (e) {
            if (__DEV__) console.warn('[RevenueCat] logIn error:', e);
            return null;
        }
    }

    /**
     * Reset RevenueCat to anonymous user. Must be called on sign-out
     * to prevent entitlement leaking to the next account.
     */
    async logoutUser(): Promise<void> {
        if (!this.isInitialized) return;
        try {
            const customerInfo = await Purchases.logOut();
            if (__DEV__) console.log('[RevenueCat] logOut success, isPro:', this.isPro(customerInfo));
        } catch (e) {
            if (__DEV__) console.warn('[RevenueCat] logOut error:', e);
        }
    }

    isPro(customerInfo: CustomerInfo): boolean {
        const entitlement = customerInfo.entitlements.active['pro_access'];
        const result = !!entitlement;
        if (__DEV__) {
            if (__DEV__) console.log('[RevenueCat] isPro check:', result,
                'activeEntitlements:', Object.keys(customerInfo.entitlements.active));
        }
        return result;
    }
}

export const revenueCatService = RevenueCatService.getInstance();

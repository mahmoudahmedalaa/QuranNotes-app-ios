import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { revenueCatService } from '../../payments/infrastructure/RevenueCatService';
import { useAuth } from './AuthContext';

// Apple App Store review account — always granted Pro access
const REVIEW_ACCOUNT_EMAIL = 'mahmoudahmedalaa+review@gmail.com';

// REAL PRO CONTEXT (RevenueCat)

interface ProContextType {
    isPro: boolean;
    loading: boolean;
    restorePurchases: () => Promise<void>;
    checkStatus: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({
    isPro: false,
    loading: true,
    restorePurchases: async () => { },
    checkStatus: async () => { },
});

export const usePro = () => useContext(ProContext);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true); // Start loading until RevenueCat checked
    const { user } = useAuth();
    const prevUserIdRef = useRef<string | null | undefined>(undefined);

    // Check if this is the Apple review account
    const isReviewAccount = user?.email?.toLowerCase() === REVIEW_ACCOUNT_EMAIL;

    const checkStatus = async () => {
        setLoading(true);
        try {
            // Auto-grant Pro for Apple review account
            if (isReviewAccount) {
                if (__DEV__) console.log('[ProContext] Review account detected — granting Pro');
                setIsPro(true);
                return;
            }

            // Initialize RevenueCat if needed (first launch)
            await revenueCatService.initialize();

            const customerInfo = await revenueCatService.getCustomerInfo();
            const isProStatus = revenueCatService.isPro(customerInfo);

            if (__DEV__) {
                if (__DEV__) console.log('[ProContext] checkStatus result:', {
                    isPro: isProStatus,
                    userId: user?.id ?? 'anonymous',
                    activeEntitlements: Object.keys(customerInfo.entitlements.active),
                });
            }

            setIsPro(isProStatus);
        } catch (e) {
            if (__DEV__) console.warn('[ProContext] Error checking pro status:', e);
            // SECURE DEFAULT: deny Pro access on error
            setIsPro(false);
        } finally {
            setLoading(false);
        }
    };

    // Sync RevenueCat user identity on auth state changes, then check status
    useEffect(() => {
        const currentUserId = user?.id ?? null;

        // Skip first render (initial mount handled separately)
        if (prevUserIdRef.current === undefined) {
            prevUserIdRef.current = currentUserId;
            // Initial check on mount
            (async () => {
                await revenueCatService.initialize();
                if (currentUserId) {
                    await revenueCatService.loginUser(currentUserId);
                }
                await checkStatus();
            })();
            return;
        }

        // User changed — sync identity
        if (currentUserId !== prevUserIdRef.current) {
            prevUserIdRef.current = currentUserId;
            (async () => {
                if (currentUserId) {
                    // New user logged in — sync their identity
                    await revenueCatService.loginUser(currentUserId);
                } else {
                    // User signed out — reset to anonymous
                    await revenueCatService.logoutUser();
                }
                await checkStatus();
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const restorePurchases = async () => {
        setLoading(true);
        try {
            const isProStatus = await revenueCatService.restorePurchases();
            setIsPro(isProStatus);
        } catch (e) {
            if (__DEV__) console.warn('[ProContext] Error restoring purchases:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProContext.Provider value={{ isPro, loading, restorePurchases, checkStatus }}>
            {children}
        </ProContext.Provider>
    );
};

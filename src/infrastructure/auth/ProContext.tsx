import React, { createContext, useContext, useEffect, useState } from 'react';
import { revenueCatService } from '../payments/RevenueCatService';
import { useAuth } from './AuthContext';

// Apple App Store review account — always granted Pro access
const REVIEW_ACCOUNT_EMAIL = 'mahmoudahmedalaa+review@gmail.com';

// REAL PRO CONTEXT (RevenueCat)

interface ProContextType {
    isPro: boolean;
    loading: boolean;
    restorePurchases: () => Promise<void>;
    checkStatus: () => Promise<void>;
    toggleDebugPro: () => void;
}

const ProContext = createContext<ProContextType>({
    isPro: false,
    loading: false,
    restorePurchases: async () => { },
    checkStatus: async () => { },
    toggleDebugPro: () => { },
});

export const usePro = () => useContext(ProContext);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true); // Start loading until RevenueCat checked
    const { user } = useAuth();

    // Check if this is the Apple review account
    const isReviewAccount = user?.email?.toLowerCase() === REVIEW_ACCOUNT_EMAIL;

    const checkStatus = async () => {
        setLoading(true);
        try {
            // Auto-grant Pro for Apple review account
            if (isReviewAccount) {
                setIsPro(true);
                return;
            }
            const customerInfo = await revenueCatService.getCustomerInfo();
            const isProStatus = revenueCatService.isPro(customerInfo);
            setIsPro(isProStatus);
        } catch (e) {
            console.warn('Error checking pro status:', e);
        } finally {
            setLoading(false);
        }
    };

    // Check RevenueCat status on app startup and when user changes
    useEffect(() => {
        checkStatus();
    }, [user]);

    const restorePurchases = async () => {
        setLoading(true);
        try {
            const isProStatus = await revenueCatService.restorePurchases();
            setIsPro(isProStatus);
        } catch (e) {
            console.warn('Error restoring purchases:', e);
        } finally {
            setLoading(false);
        }
    };

    // Debug only — no-op in production
    const toggleDebugPro = () => {
        if (__DEV__) {
            setIsPro(prev => !prev);
        }
    };

    return (
        <ProContext.Provider value={{ isPro, loading, restorePurchases, checkStatus, toggleDebugPro }}>
            {children}
        </ProContext.Provider>
    );
};

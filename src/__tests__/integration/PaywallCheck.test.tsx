import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaywallScreen from '../../features/payments/presentation/PaywallScreen';
import { ProProvider } from '../../features/auth/infrastructure/ProContext';
import { PaperProvider } from 'react-native-paper';

// Use global expo-router mock from jest.setup.js

// Mock Moti due to Reanimated issues in Jest
jest.mock('moti', () => ({
    MotiView: 'View',
}));

// Mock RevenueCat
jest.mock('../../features/payments/infrastructure/RevenueCatService', () => ({
    revenueCatService: {
        getOfferings: jest.fn().mockResolvedValue({
            current: {
                availablePackages: [
                    {
                        identifier: 'pro_monthly',
                        product: {
                            title: 'Pro Monthly',
                            description: 'Unlock everything',
                            priceString: '$4.99',
                        },
                    },
                ],
            },
        }),
        purchasePackage: jest.fn().mockResolvedValue(true),
        restorePurchases: jest.fn().mockResolvedValue(true),
    },
    PurchasesOffering: {},
    PurchasesPackage: {},
}));

// Mock Ramadan utils
jest.mock('../../core/utils/ramadanUtils', () => ({
    isRamadanSeason: jest.fn().mockReturnValue(false),
}));

describe('PaywallScreen Integration', () => {
    it('renders correctly without crashing', async () => {
        const component = render(
            <PaperProvider>
                <ProProvider>
                    <PaywallScreen />
                </ProProvider>
            </PaperProvider>
        );

        expect(component).toBeTruthy();

        // Wait for loading to finish
        await waitFor(() => {
            expect(component.getByText('Unlimited Recordings')).toBeTruthy();
        });
    });

    it('displays mock packages', async () => {
        const { getByText } = render(
            <PaperProvider>
                <ProProvider>
                    <PaywallScreen />
                </ProProvider>
            </PaperProvider>
        );

        await waitFor(() => {
            expect(getByText('$35.99')).toBeTruthy();
        });
    });
});

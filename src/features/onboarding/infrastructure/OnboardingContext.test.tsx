import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { Text, Button } from 'react-native';



// Mock useAuth
const mockUser = { id: 'test-user-id' };
jest.mock('../../auth/infrastructure/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

// Test consumer component
const TestConsumer = () => {
    const { state, loading, completeOnboarding, resetOnboarding } = useOnboarding();

    if (loading) return <Text>Loading...</Text>;

    return (
        <>
            <Text testID="completed-status">{state.completed ? 'Completed' : 'Incomplete'}</Text>
            <Text testID="step-status">{state.currentStep}</Text>
            <Button title="Complete" onPress={completeOnboarding} />
            <Button title="Reset" onPress={resetOnboarding} />
        </>
    );
};

describe('OnboardingIntegration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should load initial state from storage', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
            completed: true,
            currentStep: 5
        }));

        const { getByTestId, queryByText } = render(
            <OnboardingProvider>
                <TestConsumer />
            </OnboardingProvider>
        );

        // Wait for loading to finish
        await waitFor(() => expect(queryByText('Loading...')).toBeNull());

        expect(getByTestId('completed-status').props.children).toBe('Completed');
        expect(getByTestId('step-status').props.children).toBe(5);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@quran_notes:onboarding:test-user-id');
    });

    it('should update state and persist when completing onboarding', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // No saved state

        const { getByTestId, getByText, queryByText } = render(
            <OnboardingProvider>
                <TestConsumer />
            </OnboardingProvider>
        );

        await waitFor(() => expect(queryByText('Loading...')).toBeNull());

        expect(getByTestId('completed-status').props.children).toBe('Incomplete');

        // Trigger completion
        await act(async () => {
            fireEvent.press(getByText('Complete'));
        });

        expect(getByTestId('completed-status').props.children).toBe('Completed');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            '@quran_notes:onboarding:test-user-id',
            expect.stringContaining('"completed":true')
        );
    });
});

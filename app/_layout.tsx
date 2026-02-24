import { NoteProvider } from '../src/features/notes/infrastructure/NoteContext';
import { SettingsProvider } from '../src/features/settings/infrastructure/SettingsContext';
import { FolderProvider } from '../src/features/notes/infrastructure/FolderContext';
import { StreakProvider } from '../src/features/auth/infrastructure/StreakContext';
import { KhatmaProvider } from '../src/features/khatma/infrastructure/KhatmaContext';
import { MoodProvider } from '../src/features/mood/infrastructure/MoodContext';
import { AudioProvider } from '../src/features/audio-player/infrastructure/AudioContext';
import { PrayerProvider } from '../src/features/prayer/infrastructure/PrayerContext';
import { AdhkarProvider } from '../src/features/adhkar/infrastructure/AdhkarContext';
import { AudioKhatmaBridge } from '../src/features/khatma/presentation/AudioKhatmaBridge';
import { OnboardingProvider, useOnboarding } from '../src/features/onboarding/infrastructure/OnboardingContext';
import { AuthProvider, useAuth } from '../src/features/auth/infrastructure/AuthContext';
import { ProProvider } from '../src/features/auth/infrastructure/ProContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PremiumTheme } from '../src/core/theme/DesignSystem';
import { RepositoryProvider } from '../src/core/di/RepositoryContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../src/core/components/feedback/toastConfig';
import { initRamadanDates } from '../src/core/utils/ramadanUtils';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep native splash visible until providers are ready — prevents the
// blank lavender + spinner flash between native splash and React UI.
SplashScreen.preventAutoHideAsync();

/** Hides the native splash once auth + onboarding data are resolved. */
function SplashHider() {
    const { loading: authLoading } = useAuth();
    const { loading: onboardingLoading } = useOnboarding();

    useEffect(() => {
        if (!authLoading && !onboardingLoading) {
            SplashScreen.hideAsync();
        }
    }, [authLoading, onboardingLoading]);

    return null;
}

export default function RootLayout() {
    // Fetch + listen for Ramadan dates from Firestore (real-time)
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        initRamadanDates().then((unsub) => {
            unsubscribe = unsub;
        });
        return () => {
            unsubscribe?.();
        };
    }, []);

    return (
        <>
            <RepositoryProvider>
                <AuthProvider>
                    <ProProvider>
                        <OnboardingProvider>
                            <StreakProvider>
                                <SettingsProvider>
                                    <AudioProvider>
                                        <KhatmaProvider>
                                            <AudioKhatmaBridge />
                                            <MoodProvider>
                                                <PrayerProvider>
                                                    <AdhkarProvider>
                                                        <NoteProvider>
                                                            <FolderProvider>
                                                                <SplashHider />
                                                                <StatusBar style="dark" />
                                                                <Stack
                                                                    screenOptions={{
                                                                        headerShown: false,
                                                                        contentStyle: {
                                                                            backgroundColor: PremiumTheme.colors.background,
                                                                        },
                                                                    }}>
                                                                    <Stack.Screen name="index" />
                                                                    <Stack.Screen name="welcome" options={{ headerShown: false }} />
                                                                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                                                                    <Stack.Screen name="search" />
                                                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                                                    <Stack.Screen
                                                                        name="note/edit"
                                                                        options={{ presentation: 'modal' }}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="paywall"
                                                                        options={{ presentation: 'modal', headerShown: false }}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="ramadan-paywall"
                                                                        options={{ presentation: 'modal', headerShown: false }}
                                                                    />
                                                                </Stack>
                                                            </FolderProvider>
                                                        </NoteProvider>
                                                    </AdhkarProvider>
                                                </PrayerProvider>
                                            </MoodProvider>
                                        </KhatmaProvider>
                                    </AudioProvider>
                                </SettingsProvider>
                            </StreakProvider>
                        </OnboardingProvider>
                    </ProProvider>
                </AuthProvider>
            </RepositoryProvider>
            <Toast
                config={toastConfig}
                topOffset={80}
                visibilityTime={5000}
            />
        </>
    );
}

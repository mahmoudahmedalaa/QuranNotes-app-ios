import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false, // Prevent back gesture during onboarding
            }}>
            {/* 6-screen flow */}
            <Stack.Screen name="index" />        {/* 1. Welcome */}
            <Stack.Screen name="pick-surah" />   {/* entry → listen */}
            <Stack.Screen name="listen" />        {/* 2. Listen & Explore (surah + audio + reciter) */}
            <Stack.Screen name="record" />        {/* 3. Capture & Organize (record + notes + folders + library) */}
            <Stack.Screen name="widgets" />       {/* 4. Widgets education */}
            <Stack.Screen name="reminders" />     {/* 5. Notifications */}
            <Stack.Screen name="premium" />       {/* 6. Premium paywall */}
        </Stack>
    );
}

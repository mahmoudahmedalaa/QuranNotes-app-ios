import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false,
            }}>
            {/* 8-screen flow */}
            <Stack.Screen name="index" />        {/* 1. Welcome */}
            <Stack.Screen name="pick-surah" />   {/* entry → listen */}
            <Stack.Screen name="listen" />        {/* 2. Listen & Explore (surah + audio + reciter) */}
            <Stack.Screen name="ai-tafseer" />    {/* 3. AI Tafsir — verse insights (right after reciter) */}
            <Stack.Screen name="quran-font" />    {/* 4. Choose Your Script */}
            <Stack.Screen name="record" />        {/* 5. Capture & Organize (record + notes + folders + library) */}
            <Stack.Screen name="widgets" />       {/* 6. Widgets education */}
            <Stack.Screen name="reminders" />     {/* 7. Notifications */}
            <Stack.Screen name="premium" />       {/* 8. Premium paywall */}
        </Stack>
    );
}

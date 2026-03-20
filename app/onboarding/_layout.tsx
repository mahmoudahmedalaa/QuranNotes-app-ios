import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false,
            }}>
            {/* 9-screen flow */}
            <Stack.Screen name="index" />        {/* 1. Welcome */}
            <Stack.Screen name="pick-surah" />   {/* entry → listen */}
            <Stack.Screen name="listen" />        {/* 2. Listen & Explore (surah + audio + reciter) */}
            <Stack.Screen name="ai-tafseer" />    {/* 3. AI Tafsir — verse insights */}
            <Stack.Screen name="tadabbur" />      {/* 4. Tadabbur — guided Quranic meditation */}
            <Stack.Screen name="quran-font" />    {/* 5. Choose Your Script */}
            <Stack.Screen name="record" />        {/* 6. Capture & Organize */}
            <Stack.Screen name="widgets" />       {/* 7. Widgets education */}
            <Stack.Screen name="reminders" />     {/* 8. Notifications */}
            <Stack.Screen name="premium" />       {/* 9. Premium paywall */}
        </Stack>
    );
}

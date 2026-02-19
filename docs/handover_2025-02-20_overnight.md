# 🌙 Overnight Autonomous Handover — QuranNotes Phase 3
Generated: 2026-02-20T01:00+04:00

## ⚠️ CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE STARTING

You are an autonomous AI that will work overnight while the user sleeps. You must:
1. **NEVER stop to ask the user for permission or clarification** — they are asleep
2. **Commit and push to git after every major feature** — branch: `feature/phase3-competitive-edge`
3. **Run `npx tsc --noEmit` after every feature** — zero errors required before committing
4. **Follow all existing patterns exactly** — study the codebase before writing code
5. **Use the workflows** — read `.agent/workflows/ralph-loop.md` for self-correction protocol
6. **Read `.agent/skills/mobile-ui-design/SKILL.md`** before any UI work

---

## 1. Session Summary — What's Been Done

### App Overview
QuranNotes is a premium iOS Quran study companion built with:
- **React Native** (Expo SDK 54, expo-router)
- **react-native-paper** (Material Design 3 components with custom theme)
- **moti** (animation library wrapping reanimated)
- **Firebase** (auth, Firestore)
- **RevenueCat** (payments)
- **expo-notifications** (already configured)
- **expo-av + react-native-track-player** (audio)

### Current Feature Set
| Feature | Status | Key Files |
|---------|--------|-----------|
| Quran Reading | ✅ Complete | `app/surah/[id].tsx`, `src/data/QuranRepository.ts` |
| Multi-language Translations | ✅ Complete | `src/domain/entities/TranslationEdition.ts`, 17 languages |
| Transliteration | ✅ Complete | `src/presentation/components/quran/VerseItem.tsx` |
| Audio Playback (10+ reciters) | ✅ Complete | `src/infrastructure/audio/` |
| Voice Recording Journals | ✅ Complete | `src/presentation/components/recording/` |
| Per-verse Notes + Folders | ✅ Complete | `src/infrastructure/notes/`, `app/note/` |
| Mood-based Verse Recommendations | ✅ Complete | `src/infrastructure/mood/MoodContext.tsx` |
| Khatma Tracker (30 Juz grid) | ✅ Complete | `src/infrastructure/khatma/`, `app/(tabs)/khatma.tsx` |
| Morning/Evening Adhkar | ✅ Complete | `src/infrastructure/adhkar/`, `src/presentation/screens/AdhkarScreen.tsx` |
| Streaks & Reading Stats | ✅ Complete | `src/presentation/components/stats/` |
| Insights Dashboard | ✅ Complete | `app/(tabs)/insights.tsx` |
| Notifications (Daily + Streak + Khatma) | ✅ Complete | `src/infrastructure/notifications/NotificationService.ts` |
| Premium Paywall | ✅ Complete | `src/presentation/components/paywall/` |
| Onboarding (12 slides) | ✅ Complete | `app/onboarding/` |
| Share Verse Cards | ✅ Complete | `src/presentation/components/sharing/ShareCardGenerator.tsx` |
| Search | ✅ Complete | `app/search.tsx` |
| Settings (Dark/Light, Reciter, Translation) | ✅ Complete | `app/(tabs)/settings.tsx` |

---

## 2. Architecture Patterns — FOLLOW THESE EXACTLY

### Project Structure (Clean Architecture)
```
src/
├── domain/
│   ├── entities/       ← Data models (Quran.ts, Mood.ts, TranslationEdition.ts)
│   ├── repositories/   ← Repository interfaces (IQuranRepository.ts)
│   └── usecases/       ← Business logic (GetSurahUseCase.ts)
├── data/
│   ├── remote/         ← API calls (RemoteQuranRepository.ts)
│   ├── local/          ← AsyncStorage cache (LocalQuranRepository.ts)
│   ├── models/         ← API mappers (QuranMapper.ts)
│   └── QuranRepository.ts  ← Concrete implementation with cache strategy
├── infrastructure/
│   ├── settings/       ← SettingsContext.tsx (React Context for app settings)
│   ├── notifications/  ← NotificationService.ts
│   ├── mood/           ← MoodContext.tsx
│   ├── audio/          ← AudioContext.tsx + AudioPlayerService.ts
│   ├── khatma/         ← KhatmaContext.tsx
│   ├── adhkar/         ← AdhkarContext.tsx
│   ├── sharing/        ← ShareService.ts
│   └── di/             ← Dependency injection container
└── presentation/
    ├── theme/          ← DesignSystem.ts (THE design system — use it!)
    ├── components/     ← Reusable components by feature area
    ├── screens/        ← Full-screen components
    └── hooks/          ← Custom hooks (useQuran.ts, useInsightsData.ts)
```

### Settings Pattern
To add a new setting, edit `src/infrastructure/settings/SettingsContext.tsx`:
1. Add field to the `Settings` interface
2. Add default value to `DEFAULT_SETTINGS`
3. The `updateSettings()` function auto-persists to AsyncStorage

### Adding a New Tab Screen
- Create file in `app/(tabs)/newtab.tsx`
- Register in `app/(tabs)/_layout.tsx` (add a `<Tabs.Screen>`)
- Update `src/presentation/components/navigation/FloatingTabBar.tsx` for the tab icon

### Design System Reference
```typescript
// ALWAYS import from DesignSystem:
import { Spacing, BorderRadius, Shadows, Gradients, Typography } from '../../theme/DesignSystem';
import { useTheme } from 'react-native-paper';

// ALWAYS use theme colors:
const theme = useTheme();
theme.colors.primary     // #5B7FFF (light) / #7B9EFF (dark)
theme.colors.secondary   // #D4A853 (gold accent)
theme.colors.background  // #FAF5FF (light) / #0F1419 (dark)
theme.colors.surface     // #FFFFFF (light) / #1A1F26 (dark)
theme.colors.onSurface   // text color
theme.colors.onSurfaceVariant // secondary text
```

### Icon Library
- Use `MaterialCommunityIcons` from `@expo/vector-icons` for standalone icons
- Use `react-native-paper`'s `IconButton` for interactive icons — these use MaterialCommunityIcons names
- **NEVER use Ionicons names in Paper components** (they render as `?`)
- Icon reference: https://pictogrammers.com/library/mdi/

### Animation Pattern
```typescript
import { MotiView } from 'moti';

<MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 500, delay: index * 50 }}
>
```

### API Pattern (for new external APIs)
1. Create API client in `src/infrastructure/api/`
2. Create domain entity in `src/domain/entities/`
3. Create repository interface in `src/domain/repositories/`
4. Create concrete repo (remote + local cache) in `src/data/`
5. Create use case in `src/domain/usecases/`
6. Create React Context in `src/infrastructure/`
7. Create hook in `src/presentation/hooks/`

---

## 3. FEATURES TO IMPLEMENT — Priority Order

### Git Branch
```bash
git checkout -b feature/phase3-competitive-edge
```

---

### 🕌 FEATURE 1: Prayer Times (HIGHEST PRIORITY)

**Goal:** Add accurate prayer times based on user location with notification support. Integrate naturally into the home screen.

**API:** Use the **Aladhan API** (free, no key required):
```
GET https://api.aladhan.com/v1/timingsByCity/:date?city=:city&country=:country&method=:method
```
Alternatively for coordinates:
```
GET https://api.aladhan.com/v1/timings/:date?latitude=:lat&longitude=:lon&method=:method
```

**Calculation Methods:**
- 1 = University of Islamic Sciences, Karachi
- 2 = Islamic Society of North America (ISNA)
- 3 = Muslim World League
- 4 = Umm Al-Qura University, Makkah
- 5 = Egyptian General Authority of Survey

**Files to Create:**

#### `src/domain/entities/PrayerTimes.ts`
```typescript
export interface PrayerTime {
    name: string;          // Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
    time: string;          // "05:23"
    icon: string;          // MaterialCommunityIcons name
    isNext: boolean;       // Is this the next upcoming prayer?
}

export interface PrayerTimesData {
    date: string;          // "2026-02-20"
    hijriDate: string;     // "21 Sha'ban 1447"
    prayers: PrayerTime[];
    location: string;      // "Dubai, UAE"
    method: number;        // Calculation method
}

// Icon mapping for prayers
export const PRAYER_ICONS: Record<string, string> = {
    Fajr: 'weather-sunset-up',
    Sunrise: 'white-balance-sunny',
    Dhuhr: 'weather-sunny',
    Asr: 'weather-partly-cloudy',
    Maghrib: 'weather-sunset-down',
    Isha: 'weather-night',
};
```

#### `src/infrastructure/api/AladhanAPI.ts`
- Fetch prayer times by coordinates
- Cache response in AsyncStorage with date key (cache for 24h)
- Parse the JSON response into `PrayerTimesData`
- Calculate which prayer is "next" based on current time

#### `src/infrastructure/prayer/PrayerContext.tsx`
- React Context providing prayer times
- Uses `expo-location` for user coordinates (request permission)
- Auto-refreshes at midnight
- Provides: `prayerTimes`, `nextPrayer`, `timeToNextPrayer`, `loading`

#### Settings Integration
- Add to Settings screen under a "PRAYER TIMES" section:
  - Calculation method picker (dropdown with 5 methods)
  - Location display (auto-detected or manual city name)
  - Toggle: "Enable prayer time notifications"
- Add fields to `SettingsContext.tsx`:
  ```typescript
  prayerMethod: number;        // default: 4 (Umm Al-Qura)
  prayerNotifications: boolean; // default: false
  prayerLocation: string;      // auto-detected from GPS
  ```

#### Home Screen Integration (`app/(tabs)/index.tsx`)
- Add a **PrayerTimesCard** component at the top of the home screen (below the greeting)
- Shows: next prayer name, countdown timer, Hijri date
- Tappable to expand into full 6-prayer timeline
- Design: glassmorphic card with gold accent for next prayer
- Use `MotiView` for the expand/collapse animation

#### `src/presentation/components/prayer/PrayerTimesCard.tsx`
- Compact mode: shows next prayer name + time + countdown
- Expanded mode: shows all 6 prayers in a vertical timeline
- Current prayer highlighted with gold accent
- Past prayers dimmed
- Hijri date shown at top

#### Notification Integration
- Extend `NotificationService.ts` with `schedulePrayerNotification()`
- Schedule notifications 5 minutes before each prayer
- Use existing notification infrastructure

**Dependencies to install:**
```bash
npx expo install expo-location
```

**After completing:**
```bash
npx tsc --noEmit
git add -A && git commit -m "feat: prayer times with Aladhan API, location, and home screen card" && git push origin feature/phase3-competitive-edge
```

---

### 📖 FEATURE 2: Topic-Based Verse Browsing

**Goal:** Let users browse Quran verses by topic categories (Patience, Gratitude, Marriage, Death, etc.). We already have the mood→verse mapping pattern in `MoodContext.tsx`, so follow that same pattern but for topics.

**Files to Create:**

#### `src/domain/entities/QuranTopics.ts`
Define 15-20 topics, each with:
- Topic name (English)
- Arabic title
- Emoji icon
- Color (from our design system)
- Array of verse references `{ surah: number, verse: number, arabicSnippet: string, translation: string }`

Curated topic list:
1. 🤲 Patience (Sabr) — Al-Baqarah 2:153, 2:155, Ash-Sharh 94:5-6, Az-Zumar 39:10
2. 🙏 Gratitude (Shukr) — Ibrahim 14:7, An-Nahl 16:114, Luqman 31:12
3. 💚 Love & Mercy (Rahma) — Ar-Rum 30:21, Al-Balad 90:17, Al-Anbiya 21:107
4. 🛡️ Protection (Hifz) — Al-Baqarah 2:255 (Ayatul Kursi), Al-Falaq 113:1-5, An-Nas 114:1-6
5. 💪 Strength & Courage — Al-Anfal 8:46, Ali Imran 3:139, Al-Baqarah 2:286
6. 🌟 Guidance (Hidaya) — Al-Fatiha 1:6, Al-Baqarah 2:2, An-Nahl 16:9
7. 🤝 Family (Ahil) — An-Nisa 4:1, Luqman 31:14, At-Tahrim 66:6
8. 💰 Provision (Rizq) — At-Talaq 65:3, Hud 11:6, Al-Jumu'ah 62:10
9. 🕊️ Peace (Salam) — Ar-Ra'd 13:28, Al-Fajr 89:27-30, Ya-Sin 36:58
10. 📿 Repentance (Tawba) — Az-Zumar 39:53, At-Tahrim 66:8, An-Nisa 4:110
11. 🌅 Death & Afterlife — Al-Anbiya 21:35, Aal-e-Imran 3:185, Al-Mulk 67:2
12. 💒 Marriage (Nikah) — Ar-Rum 30:21, An-Nur 24:32, An-Nisa 4:19
13. 🧠 Knowledge (Ilm) — Al-Alaq 96:1-5, Ta-Ha 20:114, Az-Zumar 39:9
14. ⚖️ Justice (Adl) — An-Nisa 4:135, Al-Ma'idah 5:8, An-Nahl 16:90
15. 🤲 Du'a (Supplication) — Al-Baqarah 2:186, Ghafir 40:60, Al-A'raf 7:55

Put 5-8 verses per topic (for total ~100 curated verses).

#### `src/presentation/components/topics/TopicCard.tsx`
- Compact card showing emoji, topic name (English), Arabic title
- Background tinted with the topic's color
- Tappable → navigates to topic detail screen

#### `src/presentation/components/topics/TopicGrid.tsx`
- 2-column grid of TopicCards
- Animated entrance with staggered MotiView

#### `app/(tabs)/library/topics.tsx`
- Full screen showing the TopicGrid
- Add this as a tab in the Library section (the Library already has notes, folders, etc.)

#### `app/topic/[id].tsx`
- Shows all verses for a selected topic
- Reuses VerseItem from the surah screen for each verse
- Header with topic name, Arabic title, description
- Each verse shows: Arabic text, translation, surah name + verse number
- "Share" and "Save Note" actions on each verse

#### Navigation Integration
- Add "Topics" tab to the Library section if there's a tab navigator in library, OR
- Add a "Browse Topics" card on the Home screen (below prayer times)

**After completing:**
```bash
npx tsc --noEmit
git add -A && git commit -m "feat: topic-based verse browsing with 15 curated categories" && git push origin feature/phase3-competitive-edge
```

---

### 📱 FEATURE 3: iOS Widgets (WidgetKit via expo-widgets or native)

**Goal:** Beautiful iOS home screen widgets showing:
1. **Daily Verse** (small/medium) — random verse each day with translation
2. **Prayer Times** (medium) — next prayer countdown + all 5 times
3. **Khatma Progress** (small) — circular ring showing completion %

**IMPORTANT NOTE:** React Native doesn't natively support widgets. There are two approaches:

**Approach A (Recommended): Shared Data + Simple Widget-Like Experience on Home Screen**
Since proper WidgetKit integration requires native Swift code and significant setup, and the user is asleep, implement a "widget-like" experience using:
- **Daily Verse push notification** — schedule a daily notification at user's preferred time with a beautiful verse
- **Enhanced home screen cards** that mimic widget functionality within the app

**Approach B (If you're confident): Native WidgetKit**
If the project has a native iOS directory (`ios/`), you can add a WidgetKit extension:
1. Check if `ios/QuranNotes.xcodeproj` exists
2. Create a Widget Extension target
3. Use shared UserDefaults (App Groups) to pass data between app and widget
4. This is complex — only attempt if you're very confident

**For this overnight session, implement Approach A:**

#### Enhanced Home Screen Experience
Create premium home screen cards that serve as "in-app widgets":

1. **DailyVerseCard.tsx** — Beautiful card with:
   - Random verse from curated collection (use the topics data)
   - Arabic text + translation
   - Gradient background that changes based on time of day (morning/afternoon/evening)
   - Share button
   - Refresh button for new verse
   - Persist daily verse in AsyncStorage so it stays consistent for the day

2. **PrayerTimesCard.tsx** — already described in Feature 1

3. **KhatmaProgressWidget.tsx** — Compact ring chart showing:
   - Circular progress ring (gold gradient fill)
   - "X/30 Juz" in center
   - Current pace: "X Juz/week"

#### Daily Verse Notification
Extend `NotificationService.ts`:
- Add `scheduleDailyVerseNotification(hour, minute)` method
- Pulls a verse from the curated topics collection
- Sends as a notification with Arabic snippet + translation  
- Add toggle in Settings under a "DAILY VERSE" section

**After completing:**
```bash
npx tsc --noEmit
git add -A && git commit -m "feat: enhanced home screen cards (daily verse, prayer widget, khatma ring)" && git push origin feature/phase3-competitive-edge
```

---

### 🤖 FEATURE 4: AI Tafseer / Verse Explanation (Gemini)

**Goal:** One-tap "Explain this verse" using Google Gemini API. The user has a Google Ultra plan, so we can use the Gemini API.

**API:** Use the **Gemini API** via REST:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=API_KEY
```

**API Key Setup:**
- The API key needs to be stored in the `.env` file
- Add `EXPO_PUBLIC_GEMINI_API_KEY=` to `.env`
- **IMPORTANT:** Since the user is asleep, create a placeholder constant and document clearly that the user needs to add their API key. Make the feature gracefully show "API key not configured" if missing.

**Files to Create:**

#### `src/infrastructure/api/GeminiAPI.ts`
```typescript
export class GeminiAPI {
    private static API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    private static BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    static async explainVerse(
        arabicText: string, 
        translation: string, 
        surahName: string, 
        verseNumber: number
    ): Promise<string> {
        if (!this.API_KEY) {
            throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
        }
        
        const prompt = `You are a knowledgeable Islamic scholar providing brief, accessible tafseer (explanation) of Quranic verses. 

Verse: ${surahName}, Verse ${verseNumber}
Arabic: ${arabicText}
Translation: ${translation}

Provide a clear, concise explanation (3-5 paragraphs) covering:
1. Context (when/why this verse was revealed, if known)
2. Core meaning and lessons
3. How to apply this verse in daily life

Keep the tone warm, accessible, and respectful. Use simple language. Include relevant hadith references if applicable. Do NOT include the Arabic text or translation in your response — just the explanation.`;

        const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate explanation.';
    }
}
```

#### `src/presentation/components/quran/VerseTafseerModal.tsx`
- Bottom sheet modal (use React Native Modal + animated view)
- Shows when user taps "Explain" on a verse
- Loading state with animated dots
- Rendered markdown-like text
- "Powered by AI — verify with a scholar" disclaimer at bottom
- Share button to share the explanation
- Design: glassmorphic dark card with gold accent header

#### VerseItem Integration
- Add a new icon button to `VerseItem.tsx` controls row:
  ```typescript
  icon="lightbulb-outline"  // MaterialCommunityIcons
  ```
- Opens the VerseTafseerModal with the verse data
- Only show if API key is configured (check via a settings flag or env var)

#### Caching
- Cache explanations in AsyncStorage keyed by `tafseer_{surah}_{verse}`
- Don't re-call API for already-explained verses
- This saves API costs

**After completing:**
```bash
npx tsc --noEmit
git add -A && git commit -m "feat: AI verse explanation with Gemini API + caching" && git push origin feature/phase3-competitive-edge
```

---

## 4. Important User Preferences

- **Design must be premium** — not basic or bland. Follow `DesignSystem.ts` and the mobile-ui-design skill
- **Dark mode must work** — always use `useTheme()` colors, never hardcode light/dark
- **Haptic feedback** — use `expo-haptics` on all interactive elements
- **Animations** — use `MotiView` from `moti` for entrance animations
- **Arabic text always right-aligned** with proper line height (48+)
- **No Ionicons names in Paper components** — use MaterialCommunityIcons names
- **Share functionality** — reuse/extend `ShareCardGenerator.tsx` pattern

## 5. Things That Already Exist (DON'T REBUILD)
- Notifications: `NotificationService.ts` — extend, don't recreate
- Settings: `SettingsContext.tsx` — add fields, use existing pattern
- Theme: `DesignSystem.ts` — import and use, never hardcode values
- Audio: `AudioContext.tsx` — fully built, don't touch
- Sharing: `ShareService.ts` + `ShareCardGenerator.tsx` — extend for new cards
- Navigation: expo-router file-based routing — just create new files in `app/`

## 6. Verification Checklist

After ALL features are complete:
```bash
# 1. TypeScript
npx tsc --noEmit

# 2. Check for any hardcoded light mode colors
grep -r "color: '#FFF'" src/ --include="*.tsx" | head -20

# 3. Verify git is clean
git status

# 4. Push final state
git push origin feature/phase3-competitive-edge
```

## 7. Dependencies to Install First
```bash
npx expo install expo-location
```
That's the only new dependency needed. Everything else is already installed.

## 8. Git Protocol
```bash
# Start fresh branch from current state
git checkout -b feature/phase3-competitive-edge

# After EACH major feature:
npx tsc --noEmit
git add -A
git commit -m "feat: <descriptive message>"
git push origin feature/phase3-competitive-edge
```

## 9. Regenerate Types After Adding Screens
After creating new screen files in `app/`, run:
```bash
npx expo customize tsconfig.json 2>/dev/null; npx tsc --noEmit
```
And check for expo-router type errors. If they appear, regenerate typed routes:
```bash
npx expo start --clear 2>&1 &
sleep 10
kill %1
```

---

## 10. CRITICAL COMMAND BEFORE STARTING
```bash
cd /Users/mahmoudalaaeldin/Documents/Projects/VibeCoding/Projects/QuranApp
git checkout -b feature/phase3-competitive-edge
npx expo install expo-location
npx tsc --noEmit  # Verify clean baseline
```

Good luck. Make this app a million-dollar product. 🚀

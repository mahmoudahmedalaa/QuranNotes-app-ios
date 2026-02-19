# QuranNotes Phase 2 Handover — February 19, 2026

> **To the next AI engineer**: You are a 180+ IQ engineer, designer, and product owner. You have been entrusted to deliver the highest quality imaginable. Every line of code you write, every pixel you move, every architectural decision you make must be world-class. The user is paying close attention and has zero tolerance for mediocrity, placeholders, or half-baked implementations. If something can be better, make it better. If a design can be more premium, make it more premium. Ship nothing you wouldn't put your name on.

---

## 1. Project Overview

**QuranNotes** is a premium Quran reading, listening, and studying app for iOS built with React Native (Expo SDK 54). It is currently live on TestFlight (Build 47) and pending App Store review for version 2.0.0.

| Key | Value |
|---|---|
| **Framework** | React Native 0.81.5 + Expo SDK 54 |
| **Language** | TypeScript (strict) |
| **Navigation** | Expo Router (file-based, typed routes) |
| **UI Library** | React Native Paper (MD3) |
| **Design System** | Custom (`DesignSystem.ts`) — Calm/Headspace aesthetic |
| **State Management** | React Context + AsyncStorage persistence |
| **Auth** | Firebase Auth (compat layer) — Email, Google, Apple |
| **Payments** | RevenueCat (iOS) — Monthly $4.99 / Annual $35.99 |
| **Audio** | expo-av with custom `AudioPlayerService` |
| **Animations** | Moti + Reanimated 4.1 |
| **Bundle ID** | `com.mahmoudahmedalaa.qurannotes` |
| **Repo** | `github.com/mahmoudahmedalaa/QuranNotes-app` (branch: `develop`) |

---

## 2. Architecture

```
QuranApp/
├── app/                          # Expo Router pages (file-based routing)
│   ├── (auth)/                   # Login, Sign-up, Forgot Password
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── index.tsx             # Home — Surah list, mood card, continue reading
│   │   ├── library/              # Notes & Recordings tabs
│   │   ├── khatma.tsx            # Khatma (Quran completion tracker)
│   │   └── insights.tsx          # Stats, streaks, consistency calendar
│   ├── onboarding/               # 5-step interactive tour
│   ├── surah/[id].tsx            # Quran reader — verse display + audio
│   ├── search.tsx                # Global search
│   ├── paywall.tsx               # Standard paywall
│   └── ramadan-paywall.tsx       # Seasonal paywall
│
├── src/
│   ├── domain/                   # Entities: Surah, Ayah, Note, Recording, etc.
│   ├── data/                     # Static data (moodVerses.json, surah metadata)
│   ├── infrastructure/           # Services & Contexts
│   │   ├── auth/                 # AuthContext, ProContext (RevenueCat)
│   │   ├── audio/                # AudioPlayerService, AudioContext
│   │   ├── khatma/               # KhatmaContext (completion tracking)
│   │   ├── mood/                 # MoodContext (check-in, verse suggestions)
│   │   ├── notes/                # NoteContext, NoteRepository (Firestore)
│   │   ├── voice/                # Recording storage, VoiceRecognitionService
│   │   ├── reading/              # ReadingPositionService (global position)
│   │   ├── notifications/        # NotificationService (local push)
│   │   ├── payments/             # RevenueCatService
│   │   ├── settings/             # SettingsContext (reciter, theme, etc.)
│   │   ├── onboarding/           # OnboardingContext
│   │   └── firebase/             # Firebase config (compat layer)
│   │
│   └── presentation/
│       ├── theme/                # DesignSystem.ts, MoodIllustrations.ts
│       ├── components/           # All UI components by feature
│       │   ├── khatma/           # JuzCard, TodayReadingCard, JuzGrid, etc.
│       │   ├── quran/            # SurahList, StickyAudioPlayer, VerseItem
│       │   ├── mood/             # MoodCheckInCard, MoodInsightWidget
│       │   ├── stats/            # StreakCounter, ConsistencyHeatmap, StatsWidgets
│       │   ├── recording/        # RecordingModal, RecordingCard
│       │   ├── paywall/          # PaywallScreen, RamadanPaywallScreen
│       │   ├── animated/         # WaveBackground, FloatingParticles
│       │   └── mascot/           # NoorMascot (brand mascot)
│       └── hooks/                # useQuran, useInsightsData, useAudioRecorder
```

### Key Architectural Patterns

1. **Clean Architecture**: Domain entities → Data repositories → Infrastructure services → Presentation components
2. **Context-Based State**: Each feature domain has its own React Context (e.g., `KhatmaContext`, `MoodContext`, `ProContext`)
3. **AsyncStorage Persistence**: All contexts persist to AsyncStorage with a `STORAGE_KEY` and expose a `reset()` method
4. **Bridge Pattern**: Auth uses `RemoteAuthRepository` (Firebase) with `MockAuthRepository` preserved for testing
5. **Premium Gating**: Enforced at the data-entry level in each context — checks `isPro` before creates (not updates). Free limits: 5 recordings, 7 notes, 2 folders

---

## 3. Current Feature Inventory (V1 — Complete ✅)

| Feature | Location | Status |
|---|---|---|
| Quran Reader (Uthmani script + English) | `app/surah/[id].tsx` | ✅ |
| Audio playback (15+ reciters, verse-by-verse) | `AudioPlayerService.ts` | ✅ |
| Voice recordings attached to verses | `RecordingModal.tsx` | ✅ |
| Rich text notes on verses | `app/note/[id].tsx` | ✅ |
| Khatma (Quran completion tracker) | `KhatmaContext.tsx` | ✅ |
| Juz progress grid + surah completion | `JuzGrid.tsx`, `JuzCard.tsx` | ✅ |
| Mood check-in + verse recommendations | `MoodContext.tsx` | ✅ |
| Insights tab (streaks, stats, calendar) | `app/(tabs)/insights.tsx` | ✅ |
| Global search (Arabic + English) | `app/search.tsx` | ✅ |
| Inline verse bookmarks | `surah/[id].tsx` | ✅ |
| Dark mode | `DesignSystem.ts` | ✅ |
| Push notifications (daily reminders) | `NotificationService.ts` | ✅ |
| Paywall + Ramadan seasonal paywall | `PaywallScreen.tsx` | ✅ |
| Onboarding (5-step interactive tour) | `app/onboarding/` | ✅ |
| Firebase Auth (Email, Google, Apple) | `AuthContext.tsx` | ✅ |
| RevenueCat subscriptions | `ProContext.tsx` | ✅ |
| Continue Reading (home screen banner) | `app/(tabs)/index.tsx` | ✅ |
| Reading position tracking | `ReadingPositionService.ts` | ✅ |

### Decommissioned Features
- **Follow Along Recitation** (voice recognition): Hard-removed from UI. Core logic preserved in `src/infrastructure/voice/` for potential future reactivation.

---

## 4. Design System

The app uses a custom **Calm/Headspace-inspired** design system in `src/presentation/theme/DesignSystem.ts`.

### Core Exports
- **`PremiumTheme`** / **`DarkTheme`** — MD3 themes for React Native Paper
- **`Spacing`** — `{ xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }`
- **`Typography`** — Clean, modern type scale
- **`Shadows`** — `{ sm, md, lg, primary }` — Soft layered shadows for premium feel
- **`BorderRadius`** — `{ sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999 }`
- **`Gradients`** — Named gradient arrays: `primary`, `premium`, `sunset`, `ocean`, `cosmic`, `lavender`
- **`Springs`** — Moti animation presets: `gentle`, `bouncy`, `stiff`

### Color Philosophy
- **Light mode**: Soft off-white backgrounds (`#F8FAFB`), purple primary (`#6C5CE7`)
- **Dark mode**: Deep charcoal (`#0F1419`), muted blue primary (`#7B9EFF`)
- **Gold/Secondary**: `Colors.secondary` for premium highlights — never hardcode hex
- **Green accents**: Active states, completion indicators
- **Always use** `theme.colors.X` from `useTheme()` — never raw hex values

### UI Components
- **React Native Paper** for buttons, switches, text inputs, cards
- **Moti** for enter/exit animations
- **expo-linear-gradient** for gradient buttons and backgrounds
- **expo-haptics** for tactile feedback on all interactions
- **react-native-toast-message** for non-blocking feedback

---

## 5. Critical Context & Gotchas

### 🔴 Things That WILL Break If You're Not Careful

1. **Firebase Compat Layer**: The app uses `firebase/compat/app` — NOT the modular v9+ SDK. Mixing them causes "Component not registered" crashes. Always import from `firebase/compat/*`.

2. **AsyncStorage Persistence for Auth**: Firebase Auth uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)` via a `require()` call in `config.ts`. Do not refactor this to a static import.

3. **Expo Prebuild Required**: After any `app.json` change, native module addition, or plugin update, you must run:
   ```bash
   rm -rf ios android && npx expo prebuild --clean
   ```
   Then open `ios/QuranNotes.xcworkspace` in Xcode to build/archive.

4. **Build Number**: Currently at `47`. Increment before every new archive. Update in `app.json` → `ios.buildNumber`.

5. **Review Account**: `mahmoudahmedalaa+review@gmail.com` / `qwerty123456` has special handling:
   - `login.tsx` bypasses email verification for this account
   - `ProContext.tsx` auto-grants Pro status
   - **DO NOT REMOVE** these bypasses — they're required for App Store review

6. **Debug Section in Settings**: Wrapped in `__DEV__` guard (lines ~818-988 of `settings.tsx`). Only visible in dev builds. Do not expose to production.

7. **Khatma Completion**: `completedSurahs` is the source of truth (array of surah numbers 1-114). `completedJuz` is derived from it. Never store Juz completion directly.

8. **Audio Player**: `AudioPlayerService` is a singleton with preloading. Verse transitions use a preload-ahead strategy. Do not create multiple instances.

9. **Reading Position**: `ReadingPositionService` stores a global position. The home screen's "Continue Reading" banner checks this AND `completedSurahs` — it won't show for completed surahs.

### 🟡 User Preferences

- **Zero tolerance for broken features**: Test everything before committing. The user will catch it.
- **Premium aesthetics matter**: Gradients, shadows, micro-animations, haptic feedback on every interaction. Flat/plain = rejected.
- **No stubs or placeholders**: Everything must be real and functional.
- **Commit often with descriptive messages**: Use conventional commits (`feat:`, `fix:`, `style:`, `chore:`).
- **TypeScript must pass**: Run `npx tsc --noEmit` before every commit. Zero errors tolerance.
- **Git branch**: Work on `develop`. Push frequently.

---

## 6. Environment Setup

### Prerequisites
```bash
# Node 18+, Xcode 15+, CocoaPods
node --version  # Verify 18+
```

### First-Time Setup
```bash
cd /Users/mahmoudalaaeldin/Documents/Projects/VibeCoding/Projects/QuranApp
npm install
npx expo prebuild --clean
```

### Environment Variables (`.env`)
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
```

### Running & Building
```bash
# Development
npx expo start --dev-client

# TypeScript check (ALWAYS run before commit)
npx tsc --noEmit

# Prebuild iOS (after native changes)
rm -rf ios android && npx expo prebuild --clean

# Open Xcode for archive
open ios/QuranNotes.xcworkspace
```

### Testing Workflow
```bash
# Run against a real device via Xcode
# Select QuranNotes scheme → Any iOS Device → Product → Archive
# Or run on connected device for quick testing
```

---

## 7. Phase 2 Feature Roadmap

These are the features to implement, ordered by priority (highest ROI first):

### 🥇 Priority 1: iOS Home Screen Widgets (2-3 days)
**What**: Native iOS widgets showing daily verse, reading streak, and Khatma progress.
**Why**: Users see your app on their home screen daily = massive retention boost.
**Tech**: WidgetKit extension via `expo-widgets` or native Swift widget target.
**Key files**: New widget extension in `ios/`, data bridge via App Groups.

### 🥇 Priority 2: Push Notification Reminders (1-2 days)
**What**: Smart daily reminders ("Time for your daily reading!"), streak alerts ("Don't break your 7-day streak!"), Khatma nudges.
**Why**: Drives daily engagement, reduces churn.
**Tech**: `NotificationService.ts` already exists. Enhance with scheduled notifications, custom content, and user preference management.
**Key files**: `NotificationService.ts`, `SettingsContext.tsx` (reminder preferences).

### 🥇 Priority 3: Memorization Mode (1 week)
**What**: Hide-and-reveal verses for memorization practice. Spaced repetition algorithm. Progress tracking per verse/page.
**Why**: Unique differentiator from other Quran apps. Justifies premium tier.
**Tech**: New screen/modal in `app/surah/` or dedicated tab. Uses existing verse data from Al-Quran Cloud API.
**Key files**: New `MemorizationMode.tsx` component, new `MemorizationContext.tsx`.

### 🥈 Priority 4: Daily Adhkar / Morning-Evening Duas (3-4 days)
**What**: Curated morning/evening adhkar with audio, counter, and completion tracking.
**Why**: High daily engagement, complements Quran reading habit.
**Tech**: Static data with optional audio. New tab or section on home screen.
**Key files**: New `src/data/adhkar.json`, new components in `src/presentation/components/adhkar/`.

### 🥈 Priority 5: Social Sharing (1-2 days)
**What**: Share beautiful verse cards, Khatma achievements, and streak milestones to Instagram/WhatsApp.
**Why**: Free organic marketing through user-generated content.
**Tech**: `react-native-view-shot` (already installed) + `expo-sharing` (already installed). Design branded share cards.
**Key files**: New `ShareCardGenerator.tsx`, integrate into verse view and Khatma completion.

### 🥉 Priority 6: Export Notes (1 day)
**What**: PDF/text export of all notes and recordings metadata.
**Why**: Requested feature, low effort, adds perceived value.
**Tech**: Generate text/PDF from NoteContext data.

### 🥉 Priority 7: Full UI Refresh (2-3 weeks)
**What**: Swap to Tamagui or Gluestack for ultra-premium iOS-native feel.
**Why**: Takes the app from "good" to "world-class". Major competitive differentiator.
**Risk**: High — requires touching every component. Only after all Phase 2 features are stable.

---

## 8. Files Changed in This Session

| File | Change |
|---|---|
| `app/(tabs)/settings.tsx` | Removed Preview Notification button from production UI |
| `src/presentation/components/stats/ConsistencyHeatmap.tsx` | Changed today indicator from solid fill to outline; added "Today" legend |
| `app/(tabs)/index.tsx` | Hide "Continue Reading" banner when surah is completed in Khatma |
| `app.json` | Bumped buildNumber to 47 |

---

## 9. Commands to Verify

```bash
# 1. TypeScript check — must pass with zero errors
npx tsc --noEmit

# 2. Check git status
git status && git log --oneline -5

# 3. Prebuild (if native changes needed)
rm -rf ios android && npx expo prebuild --clean

# 4. Open Xcode
open ios/QuranNotes.xcworkspace
```

---

## 10. Recommended First Steps

1. **Read the workflows** at `.agent/workflows/` — especially `/git-flow`, `/ralph-loop`, and `/verification`
2. **Read existing knowledge items** at `~/.gemini/antigravity/knowledge/qurannotes_handbook/artifacts/`
3. **Run `npx tsc --noEmit`** to confirm the codebase is clean
4. **Start with Priority 1 or 2** — Widgets or Push Notifications. These are highest ROI with lowest risk.
5. **Always test on a real device** — simulators miss haptics, audio edge cases, and push notifications.
6. **Commit after every working feature** — the user values frequent, clean commits on `develop`.

---

> **Remember**: You are building the #1 Quran app in the world. Every interaction should feel like holding something sacred and beautiful in your hands. The bar is not "does it work?" — the bar is "would I be proud to show this to a million Muslims?"

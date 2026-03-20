# Tadabbur Mode — Feature Specification

> **Version:** 1.0  
> **Author:** AI Feature Planning Agent  
> **Date:** March 2026  
> **Status:** Ready for Development Handoff  
> **Target Release:** v2.3.0  

---

## Table of Contents

1. [How to Use This Document](#1-how-to-use-this-document)
2. [Executive Summary](#2-executive-summary)
3. [Problem Statement & Opportunity](#3-problem-statement--opportunity)
4. [Navigation & Architecture Decision](#4-navigation--architecture-decision)
5. [Feature Overview](#5-feature-overview)
6. [User Journeys](#6-user-journeys)
7. [Detailed Functional Requirements](#7-detailed-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [UI/UX Specification](#9-uiux-specification)
10. [AI Integration](#10-ai-integration)
11. [Monetization Strategy](#11-monetization-strategy)
12. [Edge Cases & Error Handling](#12-edge-cases--error-handling)
13. [QA Test Matrix](#13-qa-test-matrix)
14. [Competitor Inspiration](#14-competitor-inspiration)
15. [Absolute No-Go Rules](#15-absolute-no-go-rules)
16. [Development Phases](#16-development-phases)
17. [Success Metrics](#17-success-metrics)

---

## 1. How to Use This Document

> **For the implementing AI agent or developer — read this section FIRST.**

### Reading Order (Mandatory)

1. **Start here** — Read sections 1–3 to understand context and problem
2. **Read section 4** — Understand the navigation decision (this is critical)
3. **Read section 5** — Get the feature overview
4. **Read section 6** — Understand ALL user journeys end-to-end
5. **Read sections 7–8** — Functional and technical requirements
6. **Read section 9** — UI/UX spec (design system adherence is non-negotiable)
7. **Read sections 10–11** — AI integration and monetization (what's Pro vs Free)
8. **Read sections 12–13** — Edge cases and QA matrix (you MUST handle these)
9. **Read section 15** — Absolute no-go rules (breaking these = rejected PR)

### Before Writing Any Code

1. **Read the brand identity doc:** `docs/brand-identity.md` — Every color, gradient, and design decision MUST comply
2. **Read the design system:** `src/core/theme/DesignSystem.ts` — All spacing, typography, shadows MUST use tokens
3. **Study existing patterns:**
   - `src/features/mood/` — The Mood Check-In is the closest UX pattern to Tadabbur
   - `src/features/audio-player/` — AudioContext is the audio backbone you'll integrate with
   - `src/features/recording/` — Voice recording infrastructure you'll reuse
   - `src/features/tafsir/` — AI integration patterns (Gemini Flash via `firebase/ai`)
4. **Read the tech design:** `docs/architecture/TechDesign-QuranNotes-MVP.md` — Clean Architecture pattern
5. **Read the audio stability doc:** `docs/AUDIO_STABILITY.md` — AudioContext is LOCKED, do not modify

### Guidelines & Best Practices

- Follow **Clean Architecture**: domain entities → use cases → infrastructure → presentation
- Feature folder goes in `src/features/tadabbur/` with subfolders: `domain/`, `infrastructure/`, `presentation/`, `data/`
- Use **React Context** for state management (consistent with the rest of the app)
- Use **Moti** for animations (already in the project, used by MoodCheckInCard)
- Use **expo-haptics** for tactile feedback on all interactive elements
- Use **expo-router** for navigation (file-based routing in `app/` directory)

---

## 2. Executive Summary

**Tadabbur Mode** is a guided Quran reflection feature that transforms passive listening/reading into active spiritual contemplation. It is the spiritual equivalent of what Headspace/Calm do for meditation — but tailored to the Quran.

### Core Value Proposition

> "Don't just read the Quran — let the Quran speak to you."

The feature guides users through curated Quranic passages with timed reflection pauses, prompts them to record voice or text reflections, and builds a personal library of spiritual insights over time.

### Why This Feature Matters

| Metric | Without Tadabbur | With Tadabbur |
|--------|-----------------|---------------|
| Avg. session duration | 4–8 min (read/listen) | 15–30 min (guided reflection) |
| Content creation | Passive consumption | Active artifact creation |
| Return incentive | Same content daily | Personalized reflection journal |
| Pro conversion reason | "Nice to have" features | "I need this for my spiritual growth" |
| Competitive moat | Commoditized Quran reader | Unique reflection-first experience |

---

## 3. Problem Statement & Opportunity

### The Problem

Most Quran apps treat the Quran as **content to be consumed** — swipe, read, listen, close. There is no guided framework for the spiritual practice of **tadabbur** (تدبّر) — the Quranic command to deeply reflect on its meanings.

> أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ  
> "Do they not reflect upon the Quran?" — Surah Muhammad 47:24

### The Opportunity

- **No competitor** in the Islamic app space offers guided Quranic reflection sessions
- Meditation apps (Headspace, Calm) have proven the "guided session" model drives 3–5× engagement
- Users who create content (reflections, notes) have **73% higher retention** than passive consumers
- This positions QuranNotes as the **"Headspace for the Quran"** — a premium mindfulness tool, not just another Quran reader

### Market Inspiration

| App | What They Do | What We Take |
|-----|-------------|--------------|
| **Headspace** | Guided meditation with timed pauses + journaling prompts | Session structure, breathing animations, prompt patterns |
| **Calm** | Daily Calm sessions with mood check-ins + gratitude journaling | Daily cadence, mood-to-content matching, feelings wheel |
| **Tarteel AI** | Quran recitation accuracy tracking | Real-time Arabic voice processing (we have VoiceRecognitionService) |
| **Reflectly** | AI journaling with sentiment analysis + pattern recognition | AI-powered reflection prompts, emotional trend tracking |

---

## 4. Navigation & Architecture Decision

### The Decision: Dashboard Card → Full-Screen Modal Experience (NOT a new tab)

**DO NOT add a new tab to the FloatingTabBar.** The current 5 tabs (Home, Read, Library, Khatma, Insights) are already at the ideal density for a mobile app. Adding a 6th tab would:
- Shrink touch targets below Apple's 44pt minimum
- Create visual crowding in the pill-shaped bar
- Dilute the existing navigation hierarchy

### How Tadabbur Mode is Accessed

```
┌─────────────────────────────────┐
│          Dashboard (Home)        │
│                                  │
│  ┌──────────────────────────┐   │
│  │   🌙 Tadabbur Card       │   │  ← NEW dashboard card (position: after MoodCheckIn)
│  │   "Begin Today's         │   │
│  │    Reflection"           │   │
│  │   ▸ 5 min · Surah Mulk  │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │   Daily Verse Card        │   │
│  └──────────────────────────┘   │
│  ...                             │
└─────────────────────────────────┘
         │
         │ Tap "Begin Reflection"
         ▼
┌─────────────────────────────────┐
│    FULL-SCREEN MODAL             │  ← Modal, NOT a tab screen
│    (Immersive Tadabbur Session)  │
│                                  │
│    Audio + Verse + Pause +       │
│    Reflection Prompt + Recording │
│                                  │
│    [X] Close (top-right)         │
└─────────────────────────────────┘
```

### Additional Entry Points

1. **Dashboard Card** (primary) — "Begin Today's Reflection" with AI-curated daily suggestion
2. **Surah Detail Screen** — Long-press on any verse → contextual menu → "Reflect on this verse"
3. **Library Tab** — New "Reflections" sub-section alongside Notes and Recordings
4. **Insights Tab** — "Reflection Depth Map" visualization (streak of reflections over time)
5. **Deep Link** — Push notification: "Time for your evening reflection" → opens session directly

### Why This Architecture

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| New Tab | Always visible, easy access | Tab bar crowding, cluttered nav | ❌ |
| Nested in Library | Organized with other content | Hidden, low discoverability | ❌ |
| Dashboard Card + Modal | High visibility, immersive UX, no nav changes | Requires good card design | ✅ |
| Replace Insights tab | Uses existing slot | Loses analytics, confusing | ❌ |

---

## 5. Feature Overview

### 5.1 Tadabbur Session (Core Feature)

A guided reflection session is structured as follows:

```
SESSION STRUCTURE
═══════════════════════════════════════

1. OPENING (30 seconds)
   └─ Breathing animation + bismillah
   └─ Session intention prompt

2. PASSAGE BLOCK (repeats 3–7 times per session)
   ├─ LISTEN: Verse(s) recited by selected Qari
   ├─ READ: Arabic text + translation displayed
   ├─ PAUSE: Timed silence (15–60 seconds)
   │   └─ Breathing circle animation
   │   └─ Subtle ambient background
   ├─ PROMPT: Reflection question appears
   │   └─ "What does 'best in deed' mean in YOUR life?"
   └─ RESPOND: User records voice note OR types text
       └─ Voice: tap-and-hold mic → release to save
       └─ Text: tap keyboard icon → type → submit

3. CLOSING (30 seconds)
   └─ Session summary
   └─ Du'a / closing verse
   └─ "Save to My Reflections" confirmation

═══════════════════════════════════════
```

### 5.2 My Reflections Library

All recorded reflections are stored and browseable:

- Organized by Surah → Verse → Reflection entries
- Each entry: voice recording or text, timestamp, session context
- Searchable by verse reference, keyword, or date
- Playback voice reflections inline
- Export as text or share as image card

### 5.3 Reflection Depth Map (Insights Integration)

A visual heatmap on the Insights tab showing:

- Which surahs/juz the user has reflected on
- Streak tracking (consecutive days with reflection sessions)
- Total reflection minutes this week/month
- "Depth score" — how many unique passages the user has engaged with

### 5.4 AI-Powered Prompts

Using the existing Gemini Flash integration (`firebase/ai`):

- **Smart Prompts:** AI generates contextual reflection questions based on the verse's tafsir themes
- **Adaptive Suggestions:** Daily session suggestions based on user's mood check-in, reading history, and reflection gaps
- **Insight Summaries:** After 7+ sessions, AI summarizes emerging themes in the user's reflections

---

## 6. User Journeys

### Journey 1: First-Time Tadabbur User (Discovery)

```
TRIGGER: User opens app → sees Tadabbur card on dashboard

STEP 1: Card Display
  - Card shows: "Begin Your First Reflection"
  - Subtitle: "5 min · Surah Al-Fatiha · Perfect for beginners"
  - Gentle glow animation on card (attracts attention)
  - Visual: moon/star icon in violet gradient

STEP 2: User taps card
  - Smooth slide-up modal (fullscreen, immersive)
  - Brief onboarding overlay (1 screen, skippable):
    "Tadabbur means to deeply reflect on the Quran.
     We'll guide you through a short session.
     Listen, pause, and record your thoughts."
  - CTA: "Start My First Session"

STEP 3: Opening Phase
  - Screen dims to deep violet background (#1E1B4B)
  - Breathing circle animation (3 breaths, ~15s)
  - Bismillah audio plays softly
  - Text: "Set your intention for this session"
  - Optional: user can type or speak their intention (stored but not required)

STEP 4: First Verse Block
  - Verse 1:1 (Bismillah) appears in beautiful Uthmani script
  - Translation fades in below
  - Audio: selected Qari recites the verse
  - After audio completes → auto-transition to pause

STEP 5: Reflection Pause
  - Screen shows breathing circle (expanding/contracting)
  - Timer: "30 seconds of silence"
  - Ambient sound: very subtle white noise or silence
  - After 15s, prompt fades in:
    "In the name of Allah, the Most Gracious, the Most Merciful.
     When have you felt Allah's mercy most recently?"

STEP 6: Response Phase
  - Two options appear (bottom of screen):
    [🎤 Voice Note] [✍️ Write]
  - Voice: user holds mic button → speaks → releases → waveform shows
  - Text: keyboard slides up → text field with placeholder
  - Skip option available (subtle "Skip →" at bottom)

STEP 7: Next Verse Block(s)
  - Repeats Steps 4–6 for remaining verses in the session
  - Each prompt is different and contextually relevant

STEP 8: Closing Phase
  - Summary screen with gentle slide-up:
    "You reflected on 4 verses today"
    "Session time: 6 minutes"
    "Reflections saved: 3"
  - Closing du'a displayed + audio
  - CTA: "Save & Close" (primary) / "View My Reflections" (secondary)
  - Confetti-like particle animation (subtle, violet-themed)

STEP 9: Return to Dashboard
  - Tadabbur card updates: "Continue tomorrow — Day 1 streak 🔥"
  - Haptic feedback: success pattern
```

### Journey 2: Returning User (Daily Habit)

```
TRIGGER: User opens app on Day 2+ (has completed at least 1 session)

STEP 1: Card Display (Personalized)
  - Card shows: "Evening Reflection" (time-aware)
  - Subtitle: "7 min · Surah Al-Mulk · Continue your journey"
  - Streak counter: "🔥 3-day streak"
  - If mood was checked in: "Based on your mood today — verses for gratitude"

STEP 2: Session Begins
  - No onboarding overlay on subsequent sessions
  - Remembers last Qari preference
  - Remembers preferred session length

STEP 3–7: Same as Journey 1, but:
  - Prompts adapt based on previous reflections
  - AI may reference past responses: "Last time you reflected on patience — 
    how has that shown up this week?"
  - Longer pauses available (user can extend via settings)

STEP 8: Closing Phase (Enhanced)
  - "You've reflected for 3 consecutive days!"
  - Weekly summary available if it's Sunday
  - "Share your streak" option (generates shareable image card)
```

### Journey 3: Contextual Reflection (From Surah Screen)

```
TRIGGER: User is reading Surah Al-Baqarah, verse 255 (Ayat al-Kursi)

STEP 1: Long-press on verse
  - Context menu appears:
    [📝 Add Note] [🎤 Record] [📖 Tafsir] [🌙 Reflect]

STEP 2: User taps "Reflect"
  - Modal opens with single-verse tadabbur session
  - Shorter format: Opening (10s) → Verse → Pause → Prompt → Response → Close
  - ~3 minute micro-session

STEP 3: Prompt is verse-specific
  - For Ayat al-Kursi: "This verse describes Allah's sovereignty over 
    the heavens and earth. What aspect of His protection brings you 
    the most comfort today?"

STEP 4: Post-session
  - Reflection saved and linked to specific verse
  - Badge appears on the verse in the reading view (🌙 icon)
  - User returns to Surah reading screen exactly where they left off
```

### Journey 4: Browsing Past Reflections (Library)

```
TRIGGER: User navigates to Library tab → taps "Reflections" section

STEP 1: Reflections List
  - Organized chronologically (most recent first)
  - Each entry shows:
    - Surah name + verse reference
    - Preview of reflection text (or 🎤 icon + duration for voice)
    - Date + session context ("Morning Reflection" / "Evening Session")
  - Filter options: All / Voice Only / Text Only / By Surah

STEP 2: User taps a reflection
  - Full reflection view opens:
    - Original verse in Arabic + translation
    - User's reflection (text rendered or voice player)
    - Timestamp and session metadata
    - "Re-reflect" option (add a new thought to the same verse)
    - Share button (generates beautiful verse + reflection card)

STEP 3: Search
  - User can search reflections by keyword
  - Results highlight matching text in context
```

### Journey 5: Free User Hits Paywall

```
TRIGGER: Free user completes their 3rd session this week (limit: 3/week free)

STEP 1: Session completes normally
  - Summary shows as usual

STEP 2: "Next Session" card appears
  - "You've used 3 of 3 free sessions this week"
  - "Upgrade to Pro for unlimited reflections"
  - Benefits listed:
    ✓ Unlimited daily sessions
    ✓ AI-powered personalized prompts
    ✓ Voice reflections (free = text only)
    ✓ Reflection analytics & Depth Map
    ✓ Export & share reflections
  - CTA: "Start Free Trial" / "Maybe Later"

STEP 3: If user dismisses
  - Can still READ past reflections
  - Cannot START new sessions until next week
  - Dashboard card shows: "Sessions reset Monday" with countdown
```

### Journey 6: Notification-Triggered Session

```
TRIGGER: Push notification at 9:00 PM: "Time for your evening reflection 🌙"

STEP 1: User taps notification
  - App opens directly to Tadabbur session (deep link)
  - Session pre-loaded based on:
    - Time of day (evening = contemplative surahs)
    - User's reading progress
    - Gaps in reflection coverage

STEP 2–8: Normal session flow

STEP 9: Return
  - Goes to dashboard (not the notification center)
```

---

## 7. Detailed Functional Requirements

### 7.1 Session Configuration

| Parameter | Default | User-Configurable | Pro Only |
|-----------|---------|-------------------|----------|
| Session length | 5 min | Yes (3/5/10/15/20 min) | 10+ min |
| Verses per session | 3–5 | Auto-calculated from length | — |
| Pause duration | 30s | Yes (15/30/45/60/90s) | 60+ sec |
| Qari selection | Last used | Yes (from existing reciters) | — |
| Ambient sound | Off | Yes (silence/nature/rain) | Yes |
| Prompt language | English | Yes (Arabic/English/Urdu/French) | — |
| Auto-advance | On | Yes (can require manual tap) | — |
| Voice reflections | Off (text only) | Yes | Pro only |

### 7.2 Session Content Curation

Sessions are NOT random. They follow curated "reflection tracks":

| Track | Description | Surahs/Passages | Target User |
|-------|-------------|-----------------|-------------|
| **Foundations** | Core beliefs and pillars | Al-Fatiha, Ayat-ul-Kursi, last 3 surahs | Beginners |
| **Gratitude** | Recognizing blessings | Selected verses on ni'mah | Mood: grateful/content |
| **Patience** | Trials and perseverance | Yusuf, selected from Al-Baqarah | Mood: anxious/struggling |
| **Awe & Wonder** | Creation and cosmos | Ar-Rahman, Al-Mulk, An-Naba | Anyone |
| **Self-Improvement** | Character and conduct | Luqman, Al-Hujurat | Growth-minded |
| **Night Prayers** | Qiyam and intimacy with Allah | Al-Muzzammil, Ad-Duha, Al-Inshirah | Evening sessions |
| **Ramadan Special** | Daily guided surah reflection | Full surah per day (Juz Amma) | Seasonal |
| **Custom** | User picks specific surah/verses | Any | Pro only |

### 7.3 Reflection Prompts

Prompts are the HEART of this feature. They must be:

- **Personal** — "What does this mean to YOU?" not "What does this verse mean?"
- **Open-ended** — Never yes/no questions
- **Emotionally resonant** — Touch on lived experience
- **Spiritually grounded** — Reference Islamic concepts naturally
- **Non-judgmental** — No "right answer" implied

#### Prompt Examples by Verse

| Verse | Sample Prompt |
|-------|---------------|
| 2:286 (Allah does not burden a soul beyond capacity) | "Think of a recent challenge. How did you discover strength you didn't know you had?" |
| 55:13 (Which favors of your Lord will you deny?) | "Name three blessings you experienced today that you almost overlooked." |
| 94:5-6 (With hardship comes ease) | "When has a difficulty in your life eventually revealed a hidden gift?" |
| 3:139 (Do not grieve, you are superior) | "What is pulling your spirit down right now? Speak to it honestly." |
| 49:13 (The most noble among you is the most righteous) | "What does true nobility look like in your daily interactions?" |

#### AI-Generated Prompts (Pro Feature)

When AI generation is enabled:
1. System fetches the verse's tafsir context from existing Tafsir data
2. Combines with user's mood (from MoodContext if checked in today)
3. Generates a personalized prompt via Gemini Flash
4. Prompt is cached for the session (not regenerated on each view)

### 7.4 Voice Reflection Recording

Reuse existing recording infrastructure (`src/features/recording/`):

- **Format:** AAC (m4a), same as existing voice notes
- **Max duration:** 3 minutes per reflection
- **UI:** Pulsing mic button with waveform visualization (reuse `SimulatedWave.tsx`)
- **Storage:** Local filesystem (same path pattern as voice notes)
- **Playback:** Inline player in Reflections Library

### 7.5 Text Reflection Input

- **Max length:** 2000 characters
- **UI:** Expandable text input with character counter
- **Keyboard:** Dismiss on "Done" or swipe down
- **Auto-save:** Draft saved on every keystroke (AsyncStorage)
- **Rich text:** NO — plain text only (simplicity is the goal)

### 7.6 Data Model

```typescript
// src/features/tadabbur/domain/entities/Reflection.ts

interface TadabburSession {
  id: string;                      // UUID
  userId: string;                  // Firebase Auth UID
  trackId: string;                 // Which track this belongs to
  date: string;                    // ISO date string
  durationSeconds: number;         // Actual session duration
  versesReflectedOn: number;       // Count of verses in session
  completedFully: boolean;         // Did user reach the closing?
  createdAt: Date;
  intention?: string;              // User's session intention (optional)
}

interface Reflection {
  id: string;                      // UUID
  sessionId: string;               // FK to TadabburSession
  userId: string;                  // Firebase Auth UID
  surahNumber: number;
  verseNumber: number;
  type: 'voice' | 'text';
  content?: string;                // Text content (if type = 'text')
  audioUri?: string;               // Local file path (if type = 'voice')
  audioDuration?: number;          // Seconds (if type = 'voice')
  promptUsed: string;              // The prompt that was shown
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'local' | 'synced' | 'error';
}

interface TadabburTrack {
  id: string;
  name: string;                    // "Gratitude", "Patience", etc.
  nameArabic: string;              // Arabic name
  description: string;
  passages: TadabburPassage[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  isPro: boolean;                  // Requires Pro subscription
  icon: string;                    // Expo icon name
  color: string;                   // Accent color (from violet palette)
}

interface TadabburPassage {
  surahNumber: number;
  startVerse: number;
  endVerse: number;
  prompts: ReflectionPrompt[];     // Pre-curated prompts for this passage
}

interface ReflectionPrompt {
  id: string;
  text: string;                    // The reflection question
  textArabic?: string;             // Arabic translation
  category: 'personal' | 'gratitude' | 'action' | 'contemplation';
  aiGenerated: boolean;            // Was this AI-generated?
}

interface ReflectionStats {
  userId: string;
  totalSessions: number;
  totalReflections: number;
  totalMinutes: number;
  currentStreak: number;           // Consecutive days
  longestStreak: number;
  surahsCovered: number[];         // Array of surah numbers reflected on
  lastSessionDate: string;         // ISO date
}
```

---

## 8. Technical Architecture

### 8.1 Feature Module Structure

```
src/features/tadabbur/
├── domain/
│   ├── entities/
│   │   ├── Reflection.ts          # All interfaces above
│   │   └── TadabburTrack.ts       # Track definitions
│   └── usecases/
│       ├── StartSession.ts        # Orchestrates a new session
│       ├── SaveReflection.ts      # Persist a reflection
│       ├── GetDailySuggestion.ts   # AI-powered daily pick
│       └── GetReflectionStats.ts   # Stats for Insights
├── data/
│   ├── tracks/                    # JSON track definitions
│   │   ├── foundations.json
│   │   ├── gratitude.json
│   │   ├── patience.json
│   │   └── ... (one per track)
│   ├── prompts/                   # Pre-curated prompt libraries
│   │   └── prompts-en.json        # { surah:verse: [prompts] }
│   ├── TadabburRepository.ts      # AsyncStorage + Firestore sync
│   └── TadabburAnalytics.ts       # Firebase Analytics events
├── infrastructure/
│   ├── TadabburContext.tsx         # React Context provider
│   ├── TadabburSessionEngine.ts   # State machine for session flow
│   └── AIPromptService.ts         # Gemini Flash prompt generation
└── presentation/
    ├── TadabburCard.tsx            # Dashboard card component
    ├── TadabburSessionScreen.tsx   # Full-screen modal session
    ├── TadabburOpeningPhase.tsx    # Breathing + bismillah
    ├── TadabburVerseBlock.tsx      # Verse display + audio
    ├── TadabburPausePhase.tsx      # Breathing circle + timer
    ├── TadabburPromptPhase.tsx     # Question display
    ├── TadabburResponsePhase.tsx   # Voice/text input
    ├── TadabburClosingPhase.tsx    # Summary + save
    ├── TadabburOnboarding.tsx      # First-time overlay
    ├── ReflectionsListScreen.tsx   # Library view of all reflections
    ├── ReflectionDetailScreen.tsx  # Single reflection view
    ├── ReflectionDepthMap.tsx      # Heatmap for Insights tab
    └── components/
        ├── BreathingCircle.tsx     # Expand/contract animation
        ├── SessionProgress.tsx     # Progress dots/bar
        ├── ReflectionInput.tsx     # Voice + text input composite
        └── PromptCard.tsx          # Styled prompt display
```

### 8.2 Session State Machine

```
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
                         │ startSession()
                         ▼
                    ┌─────────┐
                    │ OPENING │ ← Breathing + Bismillah
                    └────┬────┘
                         │ openingComplete()
                         ▼
                    ┌─────────┐
            ┌──────│ PLAYING │ ← Audio recitation
            │      └────┬────┘
            │           │ audioComplete()
            │           ▼
            │      ┌─────────┐
            │      │ PAUSING │ ← Timed silence + prompt
            │      └────┬────┘
            │           │ pauseComplete() / userSkipped()
            │           ▼
            │      ┌──────────┐
            │      │RESPONDING│ ← Voice/text input
            │      └────┬─────┘
            │           │ responseSaved() / responseSkipped()
            │           ▼
            │      ┌──────────┐
            └──────│ ADVANCE  │ → More verses? → back to PLAYING
                   └────┬─────┘     No more?
                        │                │
                        ▼                ▼
                   ┌─────────┐    ┌─────────┐
                   │ PLAYING │    │ CLOSING │ ← Summary + du'a
                   └─────────┘    └────┬────┘
                                       │ sessionComplete()
                                       ▼
                                  ┌─────────┐
                                  │  IDLE   │
                                  └─────────┘
```

**Interruption Handling:**
- User backgrounds app → session paused, state persisted in AsyncStorage
- User kills app → session saved as incomplete, can resume from last verse
- Phone call → audio pauses, resumes when call ends
- Notification appears → session overlay stays visible

### 8.3 Integration Points

| Integration | How | Notes |
|-------------|-----|-------|
| **AudioContext** | READ-ONLY. Use `useAudio()` to play verse audio | DO NOT modify AudioContext.tsx |
| **MoodContext** | Read `todayMood` for adaptive suggestions | Read-only access |
| **Tafsir Data** | Fetch tafsir for AI prompt context | Via existing TafsirService |
| **Recording** | Reuse `expo-audio` recording patterns | Copy pattern, don't import directly |
| **Firebase/AI** | Use Gemini Flash for prompt generation | Via `firebase/ai` (existing) |
| **RevenueCat** | Check `isPro` for feature gating | Via `usePro()` hook |
| **AsyncStorage** | Persist sessions, reflections, streaks | New keys with `tadabbur_` prefix |
| **Firestore** | Cloud sync of reflections (Pro) | New `reflections` collection |
| **Push Notifications** | Session reminders | Via existing notification system |
| **Insights Tab** | Inject ReflectionDepthMap component | Add to existing insights screen |

---

## 9. UI/UX Specification

### 9.1 Design System Compliance

> **CRITICAL:** Every visual element MUST use tokens from `DesignSystem.ts` and colors from `brand-identity.md`.

| Element | Token | Value |
|---------|-------|-------|
| Session background (light) | Gradient | `#4C1D95 → #1E1B4B` (Aubergine → Midnight Violet) |
| Session background (dark) | Gradient | `#0F0A2A → #030014` (Deep Space → Cosmic Black) |
| Breathing circle | Color | `#A78BFA` (Medium Violet) at 30% opacity |
| Prompt text | Typography | `Typography.bodyLarge` + italic |
| Prompt card bg | Color | `rgba(255, 255, 255, 0.08)` (glass morphism) |
| Arabic verse text | Size | 28px minimum, Uthmani font |
| Translation text | Typography | `Typography.bodyMedium`, `textSecondary` color |
| Progress dots | Active | `#6246EA` (Brand Violet) |
| Progress dots | Inactive | `rgba(255, 255, 255, 0.2)` |
| Mic button | Color | `#A78BFA` glow effect |
| Close button | Style | `Feather "x"` icon, top-right, `rgba(255,255,255,0.6)` |

### 9.2 Dashboard Card Design

The Tadabbur Card sits between the Mood Check-In and the Daily Verse on the dashboard.

```
┌──────────────────────────────────────┐
│  🌙  Begin Today's Reflection         │
│                                        │
│  ─── Surah Al-Mulk · 7 min ───       │
│                                        │
│  [ ▸  Start Session ]                  │    ← Primary CTA button
│                                        │
│  🔥 3-day streak                       │
└──────────────────────────────────────┘
```

- **Background:** Subtle violet gradient (matches time-of-day philosophy)
- **Animation:** Gentle pulse on the moon icon (reuse Moti breathing pattern)
- **Streak display:** Only shows if streak ≥ 2 days
- **Height:** Auto-sizing, approximately 140–160pt

### 9.3 Session Screen Layout

```
┌────────────────────────────────────────┐
│ [X]                    ● ● ○ ○ ○       │  ← Close + progress dots
│                                         │
│                                         │
│         بِسْمِ اللَّهِ الرَّحْمَ...      │  ← Arabic (centered)
│                                         │
│    In the name of Allah, the Most       │  ← Translation (below)
│    Gracious, the Most Merciful.         │
│                                         │
│                                         │
│              ╭──────╮                   │
│              │  ◉   │                   │  ← Breathing circle
│              ╰──────╯                   │
│                                         │
│    "When have you felt Allah's          │  ← Prompt card
│     mercy most recently?"              │
│                                         │
│                                         │
│     [🎤  Voice Note]  [✍️  Write]       │  ← Response options
│                                         │
│              Skip →                     │  ← Skip (subtle)
└────────────────────────────────────────┘
```

### 9.4 Transitions & Animations

| Transition | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Card → Session modal | Slide up from bottom | 400ms | `spring(damping: 18)` |
| Verse appear | Fade in + translateY(20→0) | 600ms | `ease-out` |
| Translation appear | Fade in (delayed 300ms) | 400ms | `ease-in-out` |
| Pause → Prompt | Fade in + scale(0.95→1.0) | 500ms | `spring(damping: 15)` |
| Response options | Slide up from bottom | 300ms | `spring(damping: 20)` |
| Verse transition | Cross-fade | 800ms | `ease-in-out` |
| Breathing circle | Continuous scale(1.0→1.3→1.0) | 4000ms loop | `ease-in-out` |
| Session close | Slide down | 350ms | `ease-in` |
| Skip button | Fade out response, advance | 200ms | `ease-out` |

### 9.5 Haptic Feedback

| Action | Haptic Type |
|--------|------------|
| Start session | `ImpactFeedbackStyle.Medium` |
| Verse transition | `ImpactFeedbackStyle.Light` |
| Prompt appears | `ImpactFeedbackStyle.Light` |
| Start recording | `ImpactFeedbackStyle.Medium` |
| Stop recording | `NotificationFeedbackType.Success` |
| Submit text | `ImpactFeedbackStyle.Light` |
| Session complete | `NotificationFeedbackType.Success` |
| Skip | No haptic (intentionally unrewarding) |

---

## 10. AI Integration

### 10.1 AI Prompt Generation

**Service:** `firebase/ai` (Gemini Flash) — already configured in the project.

**System Prompt for Gemini:**

```
You are a spiritual reflection guide for Muslims studying the Quran.
Given a Quranic verse, its tafsir context, and optionally the user's mood,
generate ONE thoughtful reflection question.

Rules:
- Make it deeply personal ("you" / "your life")
- Open-ended (never yes/no)
- Reference the verse's theme naturally
- Be warm, non-judgmental, encouraging
- 1–2 sentences maximum
- Do NOT quote the verse back — the user already sees it
- Do NOT use academic or scholarly language
- Islamic concepts are welcome but explain briefly if niche

Example input: Verse 94:5-6, Tafsir: ease follows hardship, Mood: anxious
Example output: "Think of a time when something you dreaded turned into 
unexpected growth. What did you learn about trusting the process?"
```

### 10.2 Daily Suggestion Algorithm

```
function getDailySuggestion(user):
  1. Check user's mood today (MoodContext)
  2. Check user's last 7 reflections (gaps in coverage)
  3. Check time of day (morning = uplifting, evening = contemplative)
  4. Check if Ramadan/special Islamic date
  5. Select track that best matches mood + hasn't been done recently
  6. If Pro: generate AI-customized session order
  7. If Free: use pre-curated sequence from track JSON
  8. Return: { track, passages, estimatedMinutes }
```

### 10.3 Reflection Insight Summaries (Pro, Phase 2)

After 7+ sessions, users get a weekly AI summary:

```
"This week you reflected deeply on themes of patience and gratitude.
You connected most with Surah Yusuf — returning to it 3 times.
Your reflections often mention family and work challenges.
Consider exploring Surah Luqman next for wisdom on these themes."
```

---

## 11. Monetization Strategy

### 11.1 Free vs Pro Feature Matrix

| Feature | Free | Pro |
|---------|------|-----|
| Tadabbur sessions | 3 per week | Unlimited |
| Session length | 3 or 5 min only | Up to 20 min |
| Pause duration | 15 or 30 sec | Up to 90 sec |
| Response type | Text only | Voice + Text |
| Reflection tracks | "Foundations" only | All tracks |
| Custom sessions (pick verses) | ❌ | ✅ |
| AI-powered prompts | ❌ (curated only) | ✅ |
| Reflection Depth Map | View only (no details) | Full interactive map |
| Export reflections | ❌ | ✅ |
| Weekly AI insight summary | ❌ | ✅ |
| Ambient sounds | Silence only | Nature/rain/birds |
| Push notification reminders | 1 per day | Custom schedule |
| Cloud sync of reflections | ❌ (local only) | ✅ |

### 11.2 Paywall Trigger Points

1. **After 3rd free session in a week** — Soft paywall with benefit list
2. **Tapping "Voice Note" as free user** — "Upgrade to record voice reflections"
3. **Tapping locked track** — "This track requires Pro"
4. **Tapping AI prompt toggle** — "AI-powered prompts are a Pro feature"
5. **Tapping export/share** — "Share your reflections with Pro"

### 11.3 Conversion Psychology

- **Loss aversion:** "You've built 3 reflections — don't lose your momentum"
- **Sunk cost:** Show reflection count prominently during paywall
- **Social proof:** "Join 1,000+ users who reflect daily" (when applicable)
- **Ramadan urgency:** "Limited: Ramadan reflection tracks available now"

---

## 12. Edge Cases & Error Handling

### 12.1 Audio Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No internet (verse audio download) | Use cached audio if available; if not, show verse text only + "Audio unavailable offline" message |
| Audio interruption (phone call) | Pause session, resume when call ends (use AVAudioSession interrupt handler) |
| Bluetooth disconnects mid-playback | Fallback to device speaker, show brief toast |
| Qari audio file corrupt/404 | Skip audio, display verse text, log error silently |
| User switches reciters mid-session | NOT allowed — reciter locked for session duration |

### 12.2 Recording Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Microphone permission denied | Show permission prompt; if still denied, disable voice, show text-only |
| Recording exceeds 3 min limit | Auto-stop with gentle notification + save what was recorded |
| Storage full | Alert user to free space, offer text-only mode |
| App crashes during recording | On next launch, check for orphaned `.m4a` files and offer to save |
| Background noise too loud | No action (not a quality-gating feature — it's personal reflection) |

### 12.3 Session Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User closes app mid-session | Save progress to AsyncStorage; on next open, offer "Resume session?" |
| User skips ALL prompts | Session completes, but closing shows "0 reflections saved" — no judgment |
| User has no mood checked in | Use generic daily suggestion (not mood-adapted) |
| User opens Tadabbur while audio is playing elsewhere | Pause existing audio, give Tadabbur audio priority |
| Session suggestion has no pre-cached audio | Start download in background; if slow, proceed with text-only |
| App goes to background during pause phase | Pause timer, resume when foregrounded |
| Multiple rapid taps on "Start Session" | Debounce — only process first tap |

### 12.4 Data Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No reflections exist yet | Show empty state: "Your reflections will appear here after your first session" |
| 1000+ reflections accumulated | Paginate list (50 per page), lazy load |
| Firestore sync fails | Keep local, retry on next app open, show sync icon |
| User deletes account | Delete ALL tadabbur data (reflections, sessions, stats) |
| User signs out and signs in as different user | Load new user's data, previous user's local data preserved separately |

---

## 13. QA Test Matrix

### 13.1 Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| T-01 | First session onboarding | Fresh install → tap card → verify overlay | Onboarding shown once, never again | P0 |
| T-02 | Full session completion | Start session → complete all verses → close | Session saved, reflections stored, streak updated | P0 |
| T-03 | Voice recording in session | During response phase, record 15s voice note | Recording saved + playable in library | P0 |
| T-04 | Text reflection in session | During response phase, type 100 chars + submit | Text saved + visible in library | P0 |
| T-05 | Skip all reflections | Start session → skip every prompt | Session completes, 0 reflections, no crash | P0 |
| T-06 | Resume interrupted session | Start session → kill app → reopen | "Resume session?" prompt appears | P1 |
| T-07 | Free user paywall (sessions) | Complete 3 sessions in one week → try 4th | Paywall shown, session blocked | P0 |
| T-08 | Free user paywall (voice) | Tap voice recording button as free user | Paywall shown for voice feature | P0 |
| T-09 | Pro user full access | Pro user starts session → use all features | No paywalls, voice works, all tracks available | P0 |
| T-10 | Reflection library browse | Navigate to Library → Reflections → tap entry | Full detail view with playback | P1 |
| T-11 | Reflection search | Search "patience" in reflections | Matching entries returned | P1 |
| T-12 | Streak tracking | Complete sessions 3 days in a row | Streak shows 3 on dashboard card | P1 |
| T-13 | Contextual reflection from Surah | Long-press verse → "Reflect" → complete mini-session | Reflection linked to specific verse | P1 |
| T-14 | Depth Map visualization | Open Insights → scroll to Depth Map | Heatmap renders correctly | P2 |
| T-15 | Dark mode consistency | Toggle dark mode → check all Tadabbur screens | All elements use proper dark tokens | P0 |
| T-16 | Offline session | Airplane mode → start session with cached audio | Session works fully offline | P1 |
| T-17 | Notification deep link | Tap evening notification | Opens directly to session | P2 |

### 13.2 Performance Tests

| ID | Test Case | Threshold |
|----|-----------|-----------|
| P-01 | Session modal open time | < 300ms |
| P-02 | Voice recording start latency | < 200ms |
| P-03 | Verse audio playback start | < 1000ms (cached) |
| P-04 | Reflection save time | < 500ms |
| P-05 | Reflections list load (100 items) | < 800ms |
| P-06 | Session state restore from AsyncStorage | < 200ms |

### 13.3 Accessibility Tests

| ID | Test Case | Expected |
|----|-----------|----------|
| A-01 | VoiceOver on session screen | All elements announced correctly |
| A-02 | Dynamic Type support | Text scales with system settings |
| A-03 | Reduce Motion setting | Breathing animation uses crossfade instead |
| A-04 | Color contrast | All text meets WCAG AA (4.5:1 ratio) |

---

## 14. Competitor Inspiration

### Headspace

- **Session structure:** Opening meditation → guided body scan → breathing → close
- **What we take:** The rhythm of guided → pause → guided → pause. The "non-judgmental" tone.
- **What we DON'T take:** Gamification, badges, competitive elements

### Calm

- **Daily Calm:** One new guided session every day
- **What we take:** Daily cadence, "today's session" concept, mood check-in → content matching
- **What we DON'T take:** Celebrity narrators, sleep stories (off-brand)

### Reflectly

- **AI journaling:** Sentiment analysis → pattern recognition → weekly insights
- **What we take:** AI prompt generation, emotional trend tracking, weekly summaries
- **What we DON'T take:** Chat-style interface (too informal for Quran)

### Tarteel AI

- **Voice → Quran matching:** Real-time Arabic speech recognition
- **What we take:** The idea of voice as input during Quran engagement
- **What we DON'T take:** Accuracy scoring (reflection ≠ exam)

---

## 15. Absolute No-Go Rules

> **Breaking ANY of these rules is grounds for immediate PR rejection.**

### Design No-Gos

1. ❌ **DO NOT introduce colors outside the violet palette** (see `brand-identity.md`)
2. ❌ **DO NOT add a new tab** to the FloatingTabBar
3. ❌ **DO NOT use green, teal, or blue** as primary colors for any Tadabbur UI
4. ❌ **DO NOT use gamification** (points, XP, badges, leaderboards) — this is spiritual, not competitive
5. ❌ **DO NOT display other users' reflections** — this is a deeply personal feature
6. ❌ **DO NOT autoplay any audio** without user initiation of the session
7. ❌ **DO NOT use generic placeholder images** — use Moti animations or abstract violet patterns

### Technical No-Gos

8. ❌ **DO NOT modify `AudioContext.tsx`** — it is LOCKED (see `docs/AUDIO_STABILITY.md`)
9. ❌ **DO NOT create a new audio player service** — reuse the existing `AudioPlayerService`
10. ❌ **DO NOT store reflections in Firestore for free users** — local only
11. ❌ **DO NOT make network calls during the pause/reflection phase** — pre-fetch everything
12. ❌ **DO NOT block the session on AI prompt generation** — use pre-curated fallbacks
13. ❌ **DO NOT add new native dependencies** without explicit approval
14. ❌ **DO NOT use `console.log` in production** — use the existing analytics/error tracking

### UX No-Gos

15. ❌ **DO NOT interrupt the session with ads, promotions, or upgrade prompts** — paywall only at natural boundaries (after session or at feature gate)
16. ❌ **DO NOT make the "Skip" option prominent** — it should be subtle, never encouraged
17. ❌ **DO NOT provide "ratings" or "scores" for reflections** — there is no wrong answer
18. ❌ **DO NOT require an account to start a session** — anonymous auth users can participate
19. ❌ **DO NOT force users to respond** — every prompt must be skippable
20. ❌ **DO NOT show a loading spinner during the session** — pre-load or use graceful transitions

### Content No-Gos

21. ❌ **DO NOT generate AI prompts that question Islamic beliefs or challenge faith** — prompts are for deepening connection, never doubt
22. ❌ **DO NOT include prompts that assume a specific life situation** (marriage, children, etc.)
23. ❌ **DO NOT translate Quran text yourself** — use only verified, established translations from the API
24. ❌ **DO NOT attribute prompts to scholars or imams** unless directly quoting with verified source

---

## 16. Development Phases

### Phase 1: Core Session Experience (MVP — 2 weeks)

- [ ] Feature module structure (`src/features/tadabbur/`)
- [ ] Data model and entities
- [ ] TadabburContext provider
- [ ] Session state machine
- [ ] Dashboard card component
- [ ] Session screen (opening → verse → pause → prompt → response → closing)
- [ ] Text-only reflections (no voice yet in MVP)
- [ ] Pre-curated "Foundations" track (Al-Fatiha, last 3 surahs)
- [ ] Basic reflections list in Library
- [ ] Free/Pro gating (3 sessions/week free)
- [ ] AsyncStorage persistence

### Phase 2: Voice + AI + Polish (1 week)

- [ ] Voice recording in sessions (Pro)
- [ ] AI-powered prompts via Gemini Flash (Pro)
- [ ] Additional tracks (Gratitude, Patience, Awe & Wonder)
- [ ] Contextual reflection from Surah screen (long-press)
- [ ] Streak tracking on dashboard card
- [ ] Improved animations and transitions
- [ ] Dark mode verification

### Phase 3: Insights + Notifications (1 week)

- [ ] Reflection Depth Map on Insights tab
- [ ] Push notification reminders
- [ ] Weekly AI insight summaries (Pro)
- [ ] Reflection sharing (shareable image cards)
- [ ] Firestore cloud sync (Pro)
- [ ] Performance optimization

### Phase 4: Content Expansion (Ongoing)

- [ ] Additional tracks (Night Prayers, Self-Improvement, Ramadan Special)
- [ ] Multi-language prompts (Arabic, Urdu, French, Turkish, Malay)
- [ ] Custom session builder (Pro)
- [ ] Ambient sound options (Pro)
- [ ] Export reflections as PDF

---

## 17. Success Metrics

### Engagement Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-------------------|-------------------|
| Sessions started / week (per active user) | 2.0 | 3.5 |
| Session completion rate | 60% | 75% |
| Reflections created / session | 1.5 | 2.5 |
| Avg. session duration | 5 min | 8 min |
| 7-day retention (Tadabbur users) | 40% | 55% |
| 30-day retention (Tadabbur users) | 25% | 40% |

### Conversion Metrics

| Metric | Target |
|--------|--------|
| Free → Pro conversion rate (Tadabbur users) | 12–18% |
| Paywall impression → purchase | 8–12% |
| Pro retention (12 months) | 65% |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Crash rate during session | < 0.1% |
| Session load time (p95) | < 500ms |
| Audio playback failure rate | < 1% |
| Reflection save failure rate | 0% |

---

## Appendix A: Tadabbur Tracks — Seed Content

### Foundations Track (Free)

| Passage | Verses | Duration | Prompts |
|---------|--------|----------|---------|
| Al-Fatiha | 1:1–7 | ~5 min | 4 prompts (one per key theme) |
| Al-Ikhlas | 112:1–4 | ~3 min | 2 prompts |
| Al-Falaq | 113:1–5 | ~3 min | 2 prompts |
| An-Nas | 114:1–6 | ~3 min | 3 prompts |

### Gratitude Track (Pro)

| Passage | Verses | Duration | Theme |
|---------|--------|----------|-------|
| Ibrahim | 14:7 | ~3 min | Gratitude multiplies blessings |
| Ar-Rahman | 55:1–16 | ~8 min | Recognizing divine gifts |
| An-Nahl | 16:18 | ~3 min | Counting blessings |
| Luqman | 31:12 | ~3 min | Gratitude as wisdom |

### Patience Track (Pro)

| Passage | Verses | Duration | Theme |
|---------|--------|----------|-------|
| Al-Baqarah | 2:153-157 | ~7 min | Patience with hardship |
| Yusuf | 12:18 | ~3 min | Beautiful patience |
| Ash-Sharh | 94:1-8 | ~5 min | Ease with hardship |
| Al-'Asr | 103:1-3 | ~3 min | Patience as salvation |

---

## Appendix B: Firebase Analytics Events

| Event | Parameters | When |
|-------|-----------|------|
| `tadabbur_session_start` | `track_id`, `session_length`, `is_pro` | User starts a session |
| `tadabbur_session_complete` | `track_id`, `duration_seconds`, `reflections_count`, `skipped_count` | Session ends normally |
| `tadabbur_session_abandon` | `track_id`, `phase_at_abandon`, `elapsed_seconds` | User closes mid-session |
| `tadabbur_reflection_create` | `type` (voice/text), `verse_ref`, `prompt_ai_generated` | Reflection saved |
| `tadabbur_paywall_shown` | `trigger_reason`, `sessions_this_week` | Paywall appears |
| `tadabbur_paywall_convert` | `trigger_reason` | User purchases after paywall |
| `tadabbur_card_tap` | `has_streak`, `streak_count` | Dashboard card tapped |
| `tadabbur_notification_tap` | `notification_type` | User taps notification |

---

*End of Tadabbur Mode Feature Specification v1.0*

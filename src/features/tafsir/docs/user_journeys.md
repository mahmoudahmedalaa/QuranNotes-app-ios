# Tafsir & AI Q&A — User Journey Map

> All paths a user can take, from first encounter to daily use to edge cases.

---

## 1. Happy Path (Ideal Flow)

```
User is reading Al-Baqarah in QuranReader
    ↓
Taps verse 255 (Ayat al-Kursi)
    ↓
Sees action icons row: ▶️ ✏️ 🎤 📤 📖 🖌
                                         ↑ tafsir icon (book-open-variant)
    ↓
Taps 📖 (Tafsir icon)
    ↓
TafsirBottomSheet slides up with spring animation
    ↓
Sheet shows:
  • Verse reference pill: "Al-Baqarah · Verse 255"
  • Arabic text (user's chosen Quran font)
  • English translation (italic)
  • Source pills: [Ibn Kathir ●] [Al-Sa'di]
  • Ibn Kathir commentary (loaded from bundled JSON)
  • (Optional) AI Summary: concise Gemini-generated explanation
  • "Ask about this verse" input at bottom
  • Disclaimer footer
    ↓
User reads the commentary. Satisfied.
    ↓
User taps Al-Sa'di pill → commentary swaps instantly (JSON lookup)
    ↓
User types "Why is this called Ayat al-Kursi?" in the AI input
    ↓
Gemini Flash generates an answer grounded in Ibn Kathir/Al-Sa'di text
  • Response includes: "Source: Ibn Kathir — Al-Baqarah 2:255"
    ↓
User dismisses bottom sheet (swipe down or tap backdrop)
    ↓
Returns to QuranReader at same scroll position
```

---

## 2. First-Time User Flow

```
New user completes onboarding → reaches QuranReader
    ↓
Opens any Surah → sees verse action icons
    ↓
📖 icon is subtly pulsing (first-time hint animation, 3 cycles only)
    ↓
User taps 📖 → TafsirBottomSheet opens
    ↓
First load: shows tafsir text immediately (bundled JSON — no network needed)
    ↓
If user taps "Ask about this verse":
  • If online: Gemini generates response
  • If offline: "AI features require an internet connection. The tafsir 
    commentary above is available offline."
    ↓
User's first tafsir source selection is persisted for subsequent sessions
```

**Key principle**: The tafsir commentary (classical text) is **always available offline**. Only the AI conversational layer requires internet.

---

## 3. Returning User Flow

```
User opens a Surah they've read before
    ↓
Saved reading position restored (existing ReadingPositionService)
    ↓
Taps 📖 on any verse
    ↓
TafsirBottomSheet opens with their last-used tafsir source pre-selected
    ↓
If they previously asked an AI question about this verse:
  • Cached AI response is shown instantly (AsyncStorage)
    ↓
User can ask new questions or switch sources
```

---

## 4. Error / Failure States

### 4.1 Network Error During AI Query
```
User taps "Ask about this verse" → types question → submits
    ↓
Network request fails (timeout, DNS, etc.)
    ↓
Error banner inside the sheet:
  "Unable to reach AI service. The tafsir commentary above
   is still available. Please check your connection and try again."
    ↓
Retry button visible. Tafsir text remains fully readable.
```

### 4.2 Gemini API Quota Exceeded
```
User submits AI question
    ↓
Firebase AI Logic returns 429 (rate limit)
    ↓
Error message:
  "AI service is temporarily busy. Please try again in a moment.
   The tafsir commentary above is always available."
    ↓
No data loss. User can still browse tafsir text and switch sources.
```

### 4.3 Tafsir Data Missing for Verse
```
User taps 📖 on a verse where JSON data is missing/corrupted
    ↓
Graceful fallback:
  "Commentary is not yet available for this verse.
   You can still ask AI about it below."
    ↓
AI input remains active (Gemini can still answer using the
Arabic text + translation as context)
```

### 4.4 Firebase Not Initialized / No Auth
```
App launches but Firebase initialization fails
    ↓
User taps 📖 → tafsir text loads fine (local JSON)
    ↓
AI section shows:
  "AI features are temporarily unavailable."
    ↓
No crash. Tafsir content always works.
```

---

## 5. Permission Denial Flows

### 5.1 No Permissions Required
- Tafsir is a **read-only, offline-first** feature
- No microphone, camera, notifications, or location needed
- AI requires internet but not explicit permission
- No new permissions to request or handle

---

## 6. Subscription Upgrade / Downgrade Flows

### 6.1 Phase 1: No Gating
- **Phase 1 is entirely free** — no Pro/Premium gates
- All users (free and Pro) get full tafsir access
- AI questions are rate-limited by Gemini's free tier, not by subscription

### 6.2 Future Consideration (Phase 2+)
- Daily AI question limit for free users (e.g., 5/day)
- Unlimited AI questions for Pro users
- No impact on Phase 1 — no `ProContext` integration needed yet

---

## 7. Navigation Flows

### 7.1 Entry → Sheet → Return
```
QuranReader (any surah) → tap 📖 → TafsirBottomSheet (modal)
    ↓
Swipe down OR tap backdrop → returns to QuranReader
    ↓
Scroll position preserved. Audio playback unaffected.
```

### 7.2 Deep Link from Future Phases
```
(Phase 2) "Ask the Quran" chat → AI cites "Al-Baqarah 2:255"
    ↓
User taps citation → navigates to /surah/2?verse=255
    ↓
SurahDetail opens → auto-scrolls to verse 255
    ↓
(Optionally) auto-opens TafsirBottomSheet for that verse
```

### 7.3 Interaction with Existing Modals
```
User has share sheet open → dismisses → taps 📖 → tafsir opens ✓
User has recording active → taps 📖 → tafsir opens ✓ (non-blocking)
User has highlight picker open → taps 📖:
  → highlight picker dismisses first → tafsir opens ✓
```

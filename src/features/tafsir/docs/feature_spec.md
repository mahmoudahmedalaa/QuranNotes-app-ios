# Tafsir & AI Quran Q&A — Feature Specification

> **Phase 1 Scope:** Verse-level Tafsir button only. Chat ("Ask the Quran") and Browse modes are Phase 2 & 3.

---

## 1. Problem Statement

QuranNotes users currently have no way to quickly understand the meaning and context of a verse they're reading. The existing "Verse Explanation" feature (`VerseTafseerModal.tsx`) calls an OpenAI-backed AI via Firebase Cloud Function, but:
- It has **no structured tafsir data** — explanations are purely AI-generated with no grounding in classical scholarship
- It provides **no source citations** (no surah:verse + tafsir edition references)
- It uses **OpenAI GPT-4o-mini** instead of the specified **Gemini Flash via Firebase AI Logic**
- The **disclaimer is generic** ("Powered by AI") rather than the required scholarly attribution
- The `onExplain` callback **isn't even wired** in `SurahDetail` — the feature is currently disconnected

## 2. Competitive Research

### 2.1 Competitor Analysis

| App | Rating | Core Mechanic | What Works | What Fails | Differentiator |
|-----|--------|---------------|------------|------------|----------------|
| **Tarteel AI** | 4.8★ | AI-powered recitation + tajweed feedback | Real-time voice recognition, tajweed color-coding, AI tafsir | AI explanations can be generic, no multiple tafsir source picker | Recitation focus, not study-first |
| **Quran.com** | 4.7★ | Multi-translation reader with classical tafsir | 10+ tafsir editions, clean UI, offline support, free | Tafsir is text-dump only — no AI synthesis, no conversational Q&A | Breadth of tafsir sources |
| **RecitID** | 4.6★ | AI recitation identification + AI tafsir | AI-generated tafsir tied to verse context, modern UI | New app — limited tafsir sources, no classical scholar sourcing | AI-first approach like ours |
| **Qurani** | 4.5★ | 5 major tafsirs + hadith cross-references | Multiple tafsir sources (Ibn Kathir, Tabari, Qurtubi) in-line | Dense academic UI, no AI layer, no conversational interface | Academic depth |
| **Islam360** | 4.4★ | All-in-one Islamic reference (Quran + Hadith + Fiqh) | Comprehensive content library, multi-language | Tafsir buried in settings, clunky navigation, overwhelming for new users | Breadth over depth |

### 2.2 Universal Insight

Every successful tafsir app is a **content reader** — they dump classical text on screen. None combine:
1. **Structured classical tafsir** (authority/trust) with
2. **AI synthesis** (accessibility/personalization) in
3. A **conversational interface** (engagement)

### 2.3 QuranNotes Differentiation

QuranNotes uniquely bridges the gap:
- **Classical sources first**: Ibn Kathir (primary) and Al-Sa'di (secondary) as structured, verse-keyed data
- **AI synthesis on top**: Gemini Flash summarizes the tafsir into accessible language
- **Conversational layer**: "Ask about this verse" input enables follow-up questions grounded in the tafsir text
- **Spiritual aesthetic**: Unlike academic-looking competitors, our bottom sheet feels like a natural extension of the reading experience — warm, premium, dark mode native

---

## 3. Architecture (Phase 1)

### 3.1 Data Layer

```
Tafsir Data (JSON, bundled in-app):
├── ibn_kathir/          → Structured by surah:verse
│   ├── surah_001.json   → { verses: { 1: "...", 2: "...", ... } }
│   ├── surah_002.json
│   └── ...
├── al_sadi/
│   ├── surah_001.json
│   └── ...
└── index.ts             → TafsirDataService (load by surah:verse + source)
```

- **Format**: JSON files keyed by surah number, each containing a map of verse numbers to commentary text
- **Size estimate**: ~15-20 MB total (Ibn Kathir is larger; Al-Sa'di is more concise)
- **Loading strategy**: Lazy-load per surah on demand, cache in memory via `Map<string, string>`
- **Source**: Open-source tafsir datasets (e.g., tanzil.net, quran.com API dumps, or altafsir.com)

### 3.2 AI Layer

**Switch from OpenAI → Gemini Flash via Firebase AI Logic:**

```
@react-native-firebase/ai SDK
    ↓
Firebase AI Logic (Gemini Developer API backend)
    ↓
Gemini 2.0 Flash (free tier: 15 RPM, 1M TPM)
```

- **No server required**: Client SDK calls Gemini directly via Firebase project
- **Cost**: Free tier covers ~1,500 queries/day at typical prompt sizes. Well within "effectively $0" constraint
- **Prompt strategy**: Feed the structured tafsir text as context → ask Gemini to summarize/answer in accessible language
- **Caching**: AsyncStorage cache keyed by `tafsir_{source}_{surah}_{verse}` to avoid redundant API calls

### 3.3 UI Layer

**Replace** the existing `VerseTafseerModal.tsx` with a new `TafsirBottomSheet.tsx`:

```
┌─────────────────────────────────────┐
│  ═══ (drag handle)                  │
│                                     │
│  📖 Tafsir          [source pills]  │
│      Al-Fatiha · Verse 3            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Arabic verse text (right-algn) ││
│  │  English translation (italic)   ││
│  └─────────────────────────────────┘│
│                                     │
│  ── Commentary ──                   │
│  [Ibn Kathir commentary text here]  │
│  ...scrollable...                   │
│                                     │
│  ── AI Summary (optional) ──        │
│  [Gemini-generated accessible       │
│   explanation, grounded in tafsir]  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 💬 Ask about this verse...      ││
│  └─────────────────────────────────┘│
│                                     │
│  ⚠️ Sourced from verified tafsir.  │
│  Consult a scholar for personal    │
│  guidance.                          │
└─────────────────────────────────────┘
```

### 3.4 Entry Point

- **No new UI**: Reuse existing `onExplain` prop in `VerseItem.tsx` (lightbulb icon already exists)
- **Wire it**: Pass `onExplain` callback in `SurahDetail`'s `renderItem` to open `TafsirBottomSheet`
- **Icon change**: Swap lightbulb icon → `book-open-variant` to signal "Tafsir" (not generic "explain")

### 3.5 Source Picker

- **Pills row**: `[Ibn Kathir]  [Al-Sa'di]` — horizontally scrollable, chip-style
- **Default**: Ibn Kathir (primary)
- **Persistence**: Remember last-selected source via `SettingsContext` or `AsyncStorage`

---

## 4. Constraints Compliance

| Constraint | How We Meet It |
|-----------|----------------|
| Cost = ~$0 | Gemini Flash free tier (15 RPM, 1M TPM). AsyncStorage caching prevents repeat calls |
| Every AI response cites surah:verse + tafsir source | Prompt engineered to include `Source: Ibn Kathir, Surah X:Y`. Structured tafsir text passed as grounding context |
| Disclaimer required | Fixed footer: "Sourced from verified tafsir. Consult a scholar for personal guidance." |
| Natural extension of QuranNotes | Bottom sheet with drag handle, zinc-scale dark mode, gold accents, moti spring animations |
| Follow existing design system | Uses `DesignSystem.ts` tokens, theme colors, `Shadows`, `BorderRadius`, `Spacing` throughout |

---

## 5. Non-Goals (Phase 1)

- ❌ "Ask the Quran" chat (Phase 2)
- ❌ Tafsir Browse Mode (Phase 3)
- ❌ Vector search / embeddings
- ❌ Server-side infrastructure
- ❌ Premium gating (Phase 1 is free for all users)
- ❌ Arabic tafsir text (English only for V1)
- ❌ More than 2 tafsir sources

# Tafsir & AI Q&A — Integration Impact Assessment

> Verify no existing feature breaks when adding Tafsir Phase 1.

---

## 1. QuranReader / SurahDetail (`app/surah/[id].tsx`)

### Impact: **MEDIUM** — New prop wired, new modal added

| Area | Current State | Change Required | Risk |
|------|--------------|-----------------|------|
| `VerseItem` rendering | `onExplain` prop exists but is **not passed** in `renderItem` | Wire `onExplain` callback to open TafsirBottomSheet | Low — additive only |
| Tafseer state | `setTafseerVerse` state exists but is **unused** (eslint-disable comment) | Repurpose existing state to drive TafsirBottomSheet visibility | Low — cleaning up dead code |
| Modal stacking | Share sheet, highlight picker, recording modal coexist | TafsirBottomSheet uses same `Modal` pattern — only one visible at a time | Low — existing pattern |
| Scroll position | Complex scroll controller with lock system | TafsirBottomSheet is a modal overlay — **does not affect scroll state** | None |
| Audio playback | StickyAudioPlayer renders below FlatList | TafsirBottomSheet renders above all — **no z-index conflict** | None |

### Action Items:
1. Wire `onExplain={() => openTafsirSheet(item)}` in `renderItem`
2. Add `TafsirBottomSheet` component + state management to SurahDetail
3. Remove unused `VerseTafseerModal` import/state if fully replaced

---

## 2. VerseItem Component (`src/features/quran-reading/presentation/VerseItem.tsx`)

### Impact: **LOW** — Icon change only

| Area | Current State | Change Required | Risk |
|------|--------------|-----------------|------|
| `onExplain` prop | Exists with `lightbulb-outline` icon | Change icon to `book-open-variant` (MaterialCommunityIcons) | None |
| Haptic feedback | Already implemented on `onExplain` press | No change needed | None |
| Layout | Icon already in `controlsRow` | No layout change | None |

---

## 3. Existing VerseTafseerModal (`src/features/quran-reading/presentation/VerseTafseerModal.tsx`)

### Impact: **REPLACED** — Superseded by TafsirBottomSheet

| Area | Current State | Change Required | Risk |
|------|--------------|-----------------|------|
| File | 245-line component using `GeminiAPI.ts` | Replace with new `TafsirBottomSheet` in `features/tafsir/` | Low — clean replacement |
| Usage | Exported but **not imported anywhere** | Safe to deprecate/remove | None |
| `GeminiAPI.ts` | Used only by VerseTafseerModal | Can be retired once TafsirService replaces it | Low |

---

## 4. GeminiAPI Service (`src/core/api/GeminiAPI.ts`)

### Impact: **REPLACED** — New TafsirService uses Firebase AI Logic SDK

| Area | Current State | Change Required | Risk |
|------|--------------|-----------------|------|
| Firebase Cloud Function | Calls `explainVerse` function | No longer needed for tafsir | None — function can stay for other uses |
| OpenAI fallback | Direct REST call to `api.openai.com` | Not used by new feature | None |
| AsyncStorage cache | Keys: `tafseer_{surah}_{verse}` | New service uses different keys: `tafsir_{source}_{surah}_{verse}` | None — no collisions |

---

## 5. Notification Ecosystem

### Impact: **NONE**

- Tafsir is entirely on-demand (user-initiated)
- No background processes, no scheduled tasks
- No notification triggers

---

## 6. Navigation & Layout

### Impact: **NONE**

- No new screens or routes added
- TafsirBottomSheet is a modal within the existing SurahDetail screen
- No changes to tab bar, drawer, or stack navigation
- No impact on `app/_layout.tsx` provider hierarchy

---

## 7. Data Flows (Reading History, Adhkar, Khatma)

### Impact: **NONE**

- Tafsir does not read from or write to reading history, adhkar, or khatma state
- ReadingPositionService continues to work independently
- No AsyncStorage key conflicts (new prefix: `tafsir_`)

---

## 8. RevenueCat / Pro Gating

### Impact: **NONE for Phase 1**

- Phase 1 is entirely free — no `ProContext` integration
- No new entitlement checks
- No paywall triggers
- Future Phase 2+ may add AI query limits for free users

---

## 9. Firebase Dependencies

### Impact: **NEW DEPENDENCY** — Firebase AI Logic SDK

| Dependency | Current | New | Risk |
|-----------|---------|-----|------|
| `@react-native-firebase/app` | ✅ Already installed | No change | None |
| `@react-native-firebase/ai` | ❌ Not installed | **NEW** — add to `package.json` | Medium — requires native rebuild |
| Firebase Console | Project exists | Enable AI Logic, set up Gemini Developer API | Low — console configuration only |
| `firebase/compat` | Used by `GeminiAPI.ts` | New service uses `@react-native-firebase/ai` (non-compat) | None — different import path |

### Action Items:
1. `npm install @react-native-firebase/ai`
2. `npx expo prebuild --clean` (native rebuild for new native module)
3. Enable Firebase AI Logic in Firebase Console → AI Logic page
4. Verify Gemini Developer API is enabled for the project

---

## 10. Bundle Size Impact

| Asset | Estimated Size | Notes |
|-------|---------------|-------|
| Tafsir JSON (Ibn Kathir, English) | ~10-12 MB | Can be optimized with gzip (~3 MB) |
| Tafsir JSON (Al-Sa'di, English) | ~5-8 MB | Shorter commentary |
| `@react-native-firebase/ai` SDK | ~200 KB | Lightweight SDK wrapper |
| New UI components | <50 KB | TafsirBottomSheet, SourcePicker |
| **Total delta** | ~15-20 MB uncompressed | Consider: fetch-on-demand vs bundle trade-off |

### Mitigation Option:
If 20 MB bundled is too heavy, alternative: host JSON as static files on Firebase Hosting and fetch + cache per surah. Trade-off: first load requires internet. Tafsir text would then not be truly offline.

**Recommendation**: Bundle for Phase 1 (guaranteed offline). Optimize later if app size becomes an issue.

---

## 11. Existing Components Modified

| File | Modification | Lines Changed (est.) |
|------|-------------|---------------------|
| `app/surah/[id].tsx` | Wire `onExplain`, add TafsirBottomSheet state | ~15 lines added |
| `src/features/quran-reading/presentation/VerseItem.tsx` | Change icon from `lightbulb-outline` to `book-open-variant` | 1 line |
| `package.json` | Add `@react-native-firebase/ai` | 1 line |

---

## 12. Brand Coherence Check

| Criterion | Status |
|-----------|--------|
| Follows existing design system (`DesignSystem.ts`) | ✅ Uses `Spacing`, `BorderRadius`, `Shadows` tokens |
| Uses established typography (no new fonts) | ✅ User's Quran font for Arabic. System font for UI text |
| Matches premium dark mode aesthetic | ✅ Zinc-scale background, gold accent for header |
| Feels like a natural extension | ✅ Same bottom sheet pattern as Share, Highlight picker |
| No new color inventions | ✅ Reuses `#D4A853` gold from existing `VerseTafseerModal` |
| Haptic feedback on primary actions | ✅ Light haptic on icon tap, medium on source switch |
| Spring animations (moti) | ✅ Sheet entrance: `damping: 20`, same as existing modal |

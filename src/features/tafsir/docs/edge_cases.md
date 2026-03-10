# Tafsir & AI Q&A — Edge Case Matrix (MECE)

> Mutually Exclusive, Collectively Exhaustive edge cases for Phase 1.

---

## 1. Network & Connectivity

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 1.1 | **No internet when opening tafsir** | Tafsir commentary loads normally (bundled JSON). AI input shows "Requires internet" hint. No error banner. |
| 1.2 | **Internet lost mid-AI-query** | Loading spinner stops. Error: "Connection lost. Tafsir commentary is still available above." Retry visible. |
| 1.3 | **Slow connection (>10s response)** | 10s timeout for AI. Show "Taking longer than usual…" after 5s. On timeout: "AI unavailable right now." |
| 1.4 | **Airplane mode** | Identical to 1.1. No network probes. No crashes. |
| 1.5 | **VPN/firewall blocking Firebase** | AI section errors gracefully. Tafsir text always works. |

---

## 2. Data Integrity

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 2.1 | **Tafsir JSON missing for a surah** | Show "Commentary not yet available for this surah." AI input remains functional. |
| 2.2 | **Tafsir JSON corrupted (parse error)** | Catch JSON.parse error. Show fallback message. Log error in dev mode. No crash. |
| 2.3 | **Verse number doesn't exist in tafsir data** | Show "Commentary not available for this specific verse." Graceful, not empty screen. |
| 2.4 | **AI returns empty response** | Show "Unable to generate explanation. Please try again." Don't show empty bubble. |
| 2.5 | **AI returns response without citations** | Append disclaimer anyway. Log warning for prompt tuning. |
| 2.6 | **AI returns inappropriate/wrong content** | Disclaimer mitigates. System prompt enforces scholarly tone. No user-generated content risk. |
| 2.7 | **Cached AI response from old prompt version** | Cache key includes prompt version hash. Old cache auto-invalidates on prompt update. |

---

## 3. App Lifecycle

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 3.1 | **App backgrounded while AI is loading** | Request completes in background. On resume, result displayed. |
| 3.2 | **App killed while AI is loading** | Request abandoned. On relaunch, no stale state. User can re-request. |
| 3.3 | **App killed with TafsirBottomSheet open** | Sheet dismissed on kill. On relaunch, user is at QuranReader. No orphan modals. |
| 3.4 | **Memory pressure during tafsir load** | JSON lazy-loaded per surah (not all 114). Memory footprint <2 MB per surah. |
| 3.5 | **Rapid open/close of bottom sheet** | Debounce sheet animation. No duplicate API calls. Loading state properly reset. |

---

## 4. Concurrent Operations

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 4.1 | **Audio playing while tafsir is open** | Audio continues uninterrupted. TafsirBottomSheet is read-only, no audio interference. |
| 4.2 | **Recording active while tafsir is open** | Recording bar visible above sheet. No conflict — tafsir is non-audio. |
| 4.3 | **User switches tafsir source while AI is loading** | Cancel pending AI request. Load new source's text immediately. AI section resets. |
| 4.4 | **User submits AI question, then switches source** | AI response tagged to original source. New source text shown. AI section shows "Response for Ibn Kathir:" label. |
| 4.5 | **Share sheet + tafsir sheet collision** | Only one bottom sheet visible at a time. Dismiss share first, then open tafsir. |
| 4.6 | **Highlight picker + tafsir collision** | Highlight picker dismisses. Tafsir opens. No z-index conflict. |

---

## 5. Content & Localization

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 5.1 | **Very long tafsir text (e.g., Al-Baqarah 282)** | ScrollView inside bottom sheet. Max height 80% screen. Smooth scrolling. |
| 5.2 | **Very short tafsir text (1 sentence)** | Sheet auto-sizes to content. Min height 55% screen. No awkward empty space. |
| 5.3 | **Arabic text with complex diacritics** | Uses user's chosen Quran font. Line height ≥ 38px (existing standard). |
| 5.4 | **RTL layout issues** | Arabic text right-aligned. English left-aligned. Source pills LTR. No layout breaks. |
| 5.5 | **Translation language mismatch** | Phase 1: English tafsir only. If user's translation is non-English, tafsir is still in English (documented limitation). |

---

## 6. Subscription & Auth

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 6.1 | **Anonymous user opens tafsir** | Full access. No auth requirement for Phase 1. |
| 6.2 | **Free user opens tafsir** | Full access. No Pro gate for Phase 1. |
| 6.3 | **Pro user opens tafsir** | Full access. Same experience as free. |
| 6.4 | **Subscription expires while tafsir is open** | No impact — Phase 1 has no subscription dependency. |
| 6.5 | **User logs out while tafsir is open** | Sheet remains visible (read-only). AI requests fail gracefully on next attempt. |

---

## 7. Performance

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 7.1 | **First tafsir open for a surah (cold load)** | JSON parsed from bundle. Target: <200ms. Cached in memory for subsequent opens. |
| 7.2 | **Subsequent opens (warm cache)** | Instant. Map lookup. <10ms. |
| 7.3 | **AI response latency** | Gemini Flash typical: 1-3s. Show loading spinner. Skeleton not needed for short wait. |
| 7.4 | **Large Surah JSON (Al-Baqarah: 286 verses)** | Lazy-load only the requested verse's commentary, not the entire surah at once. |
| 7.5 | **Offline cache grows very large** | AI cache: LRU eviction after 500 entries (~2 MB). Tafsir JSON: always in bundle, no growth. |

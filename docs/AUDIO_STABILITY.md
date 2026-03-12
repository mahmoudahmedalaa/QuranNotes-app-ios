# ⚠️ AUDIO STABILITY RULE — DO NOT MODIFY ⚠️

> **Status:** LOCKED — March 2026
> **Owner:** Core Engineering
> **Applies to:** All files under `src/features/audio-player/`
> **Full Architecture Reference:** `src/features/audio-player/AUDIO_ARCHITECTURE.md`

---

## Rule

**No modifications** to the following files without explicit user approval:

| File | Purpose |
|---|---|
| `infrastructure/AudioContext.tsx` | Global audio state, playback orchestration |
| `infrastructure/AudioPlayerService.ts` | RNTP wrapper, queue management, event system |
| `infrastructure/QuranAudioApi.ts` | Quran.com API v4 integration |
| `domain/Reciter.ts` | Reciter definitions and Quran.com IDs |

## Why This Rule Exists

The audio player went through **6+ rounds of regression-causing changes** between March 10-12, 2026.
Each "fix" introduced new bugs because the subsystem has subtle interdependencies:

- **Stale closures** in event listeners (refs vs state)
- **Generation counters** for reciter switching (replaces fragile timeouts)
- **Debounce timing** for playback state updates
- **Optimistic state** with rollback on failure
- **Full-surah vs per-verse mode** event segregation
- **Timestamp validation** to guard against API responses without verse timestamps

Modifying any of these without understanding the full flow **will** break something.

## Current State

- **12 reciters** — all use Quran.com full-surah gapless audio
- **0 per-verse fallback reciters** — all removed due to audible gaps
- **API:** Quran.com v4 `chapter_recitations`
- **See `AUDIO_ARCHITECTURE.md`** for the complete reciter list and extension guide

## Approved Changes (No Review Needed)

- Adding new reciters to `Reciter.ts` (with valid `quranComId` **AND** verified timestamps)
- UI changes to components that *consume* audio state (e.g., `StickyAudioPlayer.tsx`)
- Logging or debug output changes

## ⚠️ Prohibited Changes

- Changing event handlers in `AudioPlayerService.subscribeToEvents()`
- Modifying the `isReloading` / `playIntentTimestamp` / `notifyListeners` triad
- Adding new playback modes without architectural review
- Removing the timestamp validation check in `QuranAudioApi`
- Creating additional `AudioPlayerService` instances

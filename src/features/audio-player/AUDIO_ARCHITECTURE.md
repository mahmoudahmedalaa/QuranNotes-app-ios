# Audio Playback Architecture — Complete Reference

> **Last updated:** March 12, 2026
> **Status:** LOCKED — See `docs/AUDIO_STABILITY.md`
> **Maintainer note:** Read this ENTIRELY before touching any audio code.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  UI Components                                                       │
│  (SurahScreen, VerseRecommendationSheet, StickyAudioPlayer)         │
│                         │                                            │
│                    useAudio() hook                                   │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │           AudioContext.tsx                            │            │
│  │  Global React Context provider (singleton)           │            │
│  │  • State: isPlaying, playingVerse, playlist           │            │
│  │  • Orchestrates: playFromVerse, playVerse, playSurah  │            │
│  │  • Listens to PlaybackStatus from Service             │            │
│  │  • Persists sessions to AsyncStorage                  │            │
│  │  • Tracks Khatma completion on queue end               │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │        AudioPlayerService.ts (singleton)              │            │
│  │  Bridge to react-native-track-player (RNTP)          │            │
│  │  • Setup, event handling, state debouncing           │            │
│  │  • loadFullSurah() — gapless single-MP3 mode         │            │
│  │  • loadPlaylist() — per-verse queue mode              │            │
│  │  • playVerse() — standalone single-verse mode         │            │
│  │  • Pre-download cache for gapless transitions         │            │
│  │  • Lock screen / Dynamic Island integration           │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│          react-native-track-player (native bridge)                   │
│          AVQueuePlayer (iOS) / ExoPlayer (Android)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current State (What Works Perfectly)

**All 12 reciters use Quran.com full-surah gapless audio.** Zero gaps between verses. Smooth, seamless playback. No per-verse fallback reciters remain.

### API: Quran.com v4

- **Endpoint:** `GET /api/v4/chapter_recitations/{reciterId}/{chapterNum}?segments=true`
- **Returns:** `audio_url` (single MP3 for entire surah) + `timestamps[]` (verse-level timing in ms)
- **Client:** `QuranAudioApi.ts` — handles fetching, parsing, caching, retries, and timeouts
- **Cache:** In-memory `Map<string, ChapterAudio>` keyed by `"reciterId:chapter"`
- **Timeout:** 8 seconds per request, 1 automatic retry on failure
- **Validation:** Returns `null` if timestamps are empty (prevents runtime errors)

---

## 3. Current Reciters (12 Active)

All reciters use **full-surah gapless playback** via Quran.com API v4.

| ID | Name | Quran.com ID | Style | Verified |
|---|---|---|---|---|
| `alafasy` | Mishary Rashid Alafasy | 7 | Modern, clear | ✅ |
| `abdulbasit` | Abdul Basit (Murattal) | 2 | Classic, measured | ✅ |
| `abdulbasit_mujawwad` | Abdul Basit (Mujawwad) | 1 | Melodic, elaborate | ✅ |
| `minshawy` | Al-Minshawi (Murattal) | 9 | Traditional, soft | ✅ |
| `husary` | Mahmoud Khalil Al-Husary | 6 | Educational, clear | ✅ |
| `sudais` | Abdurrahman As-Sudais | 3 | Powerful, Makkah style | ✅ |
| `shuraym` | Saud Al-Shuraym | 10 | Strong, Madinah style | ✅ |
| `ghamadi` | Saad Al-Ghamdi | 13 | Gentle, measured | ✅ |
| `hussary_mujawwad` | Al-Husary (Muallim) | 12 | Learning mode, slow | ✅ |
| `shatri` | Abu Bakr Al-Shatri | 4 | Melodic, expressive | ✅ |
| `rifai` | Hani Ar-Rifai | 5 | Smooth, modern | ✅ |
| `tablawi` | Mohamed Al-Tablawi | 11 | Egyptian, resonant | ✅ |

### Removed Reciters

| Reciter | Reason | Date |
|---|---|---|
| **Al-Minshawi (Mujawwad)** (ID 8) | API returns audio but **no verse timestamps** → crashes gapless playback | March 12, 2026 |
| **Maher Al-Muaiqly** | No Quran.com API support → per-verse mode only → audible gaps | March 12, 2026 |
| **Ahmed Al-Ajamy** | No Quran.com API support → per-verse mode only → audible gaps | March 12, 2026 |
| **Ali Jaber** | No Quran.com API support → per-verse mode only → audible gaps | March 12, 2026 |
| **Ali Al-Hudhaify** | No Quran.com API support → per-verse mode only → audible gaps | March 12, 2026 |

---

## 4. Playback Modes (Technical Detail)

### Mode 1: Full-Surah Gapless (PRIMARY — ALL CURRENT RECITERS)

**How it works:**
1. `AudioContext.playFromVerse()` is called with a surah and verse number
2. Context checks `hasFullSurahAudio(reciter)` → always `true` for all current reciters
3. `QuranAudioApi.getChapterAudio(quranComId, chapter)` fetches the single MP3 URL + timestamps
4. `AudioPlayerService.loadFullSurah(surahNum, audioUrl, timestamps, ...)` is called
5. Player resets, adds a single track, optionally seeks to the start verse's timestamp
6. A **200ms polling interval** (`setInterval`) reads `TrackPlayer.getProgress()` and runs **binary search** on the timestamps array to find the current verse
7. When the detected verse changes, `currentVerseKey` is emitted to listeners → UI updates verse highlight

**Verse detection (binary search):**
```typescript
// QuranAudioApi.ts — findVerseAtPosition()
// Given position in ms, binary searches timestamps[] to find the matching verse
// O(log n) — handles all 286 verses of Al-Baqarah efficiently
```

**Lock screen controls:**
- **Next/Previous:** `seekToVerse()` jumps to the next/previous verse's `timestampFrom` within the single track
- **Play/Pause:** Standard `TrackPlayer.play()` / `TrackPlayer.pause()`
- **Metadata:** Updated per verse change via `updateNowPlayingVerse()`

### Mode 2: Per-Verse Queue (FALLBACK — NO CURRENT RECITERS USE THIS)

> This mode exists in the codebase for robustness but is not active for any current reciter.

**How it works:**
1. Each verse is loaded as a separate track in RNTP's native queue
2. Native player handles track transitions (AVQueuePlayer on iOS)
3. Pre-downloads next 2 tracks to cache for faster transitions
4. `PlaybackActiveTrackChanged` event detects verse changes

**Known limitation:** 1-3 second gaps between verses even with caching (iOS AVQueuePlayer limitation)

### Mode 3: Single Verse (STANDALONE)

**Used by:** Mood sheet, daily check-in — any "play one verse" context without a surah.

**How it works:**
1. `AudioContext.playVerse(surahNum, verseNum)` is called
2. Player resets, adds single track from everyayah.com CDN
3. Track plays and emits `didJustFinish` when done

---

## 5. File-by-File Reference

### `domain/Reciter.ts`
- Defines `Reciter` interface and `RECITERS` array
- `quranComId: number` — maps to `chapter_recitations` API
- `subfolder: string` — everyayah.com path segment (legacy, kept for single-verse mode)
- `cdnFolder: string` — everyayah.com CDN folder (legacy, kept for single-verse mode)
- `DEFAULT_RECITER` — Alafasy (first in array)
- `getReciterById(id)` — lookup with fallback to default
- `hasFullSurahAudio(reciter)` — checks `quranComId !== undefined`

### `infrastructure/QuranAudioApi.ts`
- `getChapterAudio(reciterId, chapter)` — main API call with caching + retry
- `findVerseAtPosition(timestamps, positionMs)` — binary search for verse detection
- `clearAudioCache()` — flush in-memory cache
- `VerseTimestamp` — `{ verseKey, timestampFrom, timestampTo, duration }` (all in ms)
- **Validation:** Returns `null` if API responds with empty timestamps (protects against Minshawi Mujawwad-type failures)

### `infrastructure/AudioPlayerService.ts` (938 lines, singleton)
- **Setup:** `setup()` — idempotent RNTP initialization with capabilities
- **Full-surah:** `loadFullSurah(surahNum, audioUrl, timestamps, ...)` — primary playback method
- **Per-verse:** `loadPlaylist(surahNum, verses, startIndex, cdnFolder, ...)` — fallback queue
- **Single verse:** `playVerse(surah, verse, cdnFolder, ...)` — standalone play
- **Verse navigation:** `seekToVerse(verseKey)`, `skipToNextVerse()`, `skipToPreviousVerse()`
- **Progress polling:** `startProgressPolling()` — 200ms interval for full-surah verse tracking
- **Event handling:** `subscribeToEvents()` — processes RNTP native events with debouncing
- **Pre-download cache:** `downloadVerseToCache(trackId, url)` — fetches MP3 to file system for per-verse mode
- **Lock screen:** `updateNowPlayingVerse()` — native now-playing metadata
- **State debounce:** 500ms timer absorbs transient Loading/Buffering RNTP states
- **Play intent grace period:** 3 seconds after `play()` — suppresses false non-playing states

### `infrastructure/AudioContext.tsx` (672 lines, React Context)
- **Provider:** `AudioProvider` — wraps the app, provides `useAudio()` hook
- **State:** `playingVerse`, `isPlaying`, `isLoading`, `playlist`, `currentSurahNum/Name`
- **Session persistence:** `lastSession` saved to AsyncStorage for mini-player resume
- **Completed playback tracking:** `lastCompletedPlayback` — used by Khatma feature
- **Reciter switching:** Detects `settings.reciterId` changes, restarts playback with new reciter
- **Generation counter:** Prevents stale reciter-switch callbacks from executing
- **Reading history:** Records listening sessions via `ReadingHistoryService`

---

## 6. ⚠️ Critical Invariants — NEVER BREAK THESE

### Invariant 1: The Three Protections
**ANY method that calls `TrackPlayer.play()` MUST have:**

```typescript
// 1. isReloading guard around reset()
this.isReloading = true;
try {
    await TrackPlayer.reset();
    // ... add tracks ...

    // 2. playIntentTimestamp BEFORE play()
    this.playIntentTimestamp = Date.now();
    await TrackPlayer.play();

    // 3. Explicit notifyListeners AFTER play()
    this.notifyListeners({
        isPlaying: true,
        isBuffering: false,
        positionMillis: 0,
        durationMillis: 0,
        didJustFinish: false,
    });
} finally {
    this.isReloading = false;
}
```

**WHY:** Without these, RNTP's native event timing causes `isPlaying: false` to leak to the UI during the `Playing → Buffering → Playing` sequence. The 3-second grace period from `playIntentTimestamp` absorbs all transient non-playing states.

### Invariant 2: AudioContext Bulletproof Guard
`AudioContext.tsx` verifies with native RNTP before clearing playback state on `didJustFinish`. This prevents premature state wipes from RNTP's unreliable queue-end events.

### Invariant 3: Single Service Instance
`AudioPlayerService` is instantiated ONCE (line ~26 in `AudioContext.tsx`). ALL audio goes through `AudioContext`. Never create parallel instances.

### Invariant 4: Event Segregation by Mode
- **`PlaybackActiveTrackChanged`** → Per-verse mode ONLY (track index tracking)
- **`PlaybackQueueEnded`** → Full-surah mode ONLY (genuine end of single track)
- Mixing these causes false queue-end events to kill playback mid-surah.

### Invariant 5: Timestamp Validation
`QuranAudioApi.getChapterAudio()` returns `null` if `timestamps.length === 0`. Callers (AudioContext) must handle this gracefully. This is the safety net that prevents Minshawi Mujawwad-type crashes.

---

## 7. Regression History

| Date | What Broke | Root Cause | Fix |
|---|---|---|---|
| Mar 10, 2026 | Audio stopped after 1 verse | `PlaybackQueueEnded` fired between per-verse tracks after `expo prebuild` | Segregated events: `QueueEnded` only for full-surah, `ActiveTrackChanged` for per-verse |
| Mar 10, 2026 | Play button unresponsive after reciter switch | Stale closures in event listeners held old state | Added `useRef` mirrors for all state + generation counter for reciter switches |
| Mar 11, 2026 | Verse 1 flash when switching reciters | UI briefly showed verse 1 before new reciter loaded | Added optimistic state update with generation check |
| Mar 11, 2026 | Desync between verse play button and sticky player | Pause/play state not propagated to all consumers | Unified through single `AudioContext` with ref-synced state |
| Mar 12, 2026 | Minshawi Mujawwad playback crash | API returns audio without timestamps → `findVerseAtPosition` fails | Added timestamp validation in `QuranAudioApi` + removed reciter |
| Mar 12, 2026 | Per-verse reciters had 1-3s gaps | Inherent iOS AVQueuePlayer limitation for HTTP URLs | Removed all per-verse reciters; 100% full-surah now |

---

## 8. How to Extend This System

### Adding a New Reciter

1. **Verify the Quran.com API has timestamps for the reciter:**
   ```bash
   curl "https://api.quran.com/api/v4/chapter_recitations/{ID}/1?segments=true" | jq '.audio_file.timestamps | length'
   ```
   The response must include a non-empty `timestamps` array. If it returns `0` or `null`, the reciter CANNOT be added.

2. **Add the entry to `Reciter.ts`:**
   ```typescript
   {
       id: 'unique_slug',
       name: 'Display Name',
       subfolder: 'ar.slug',           // everyayah.com path (for single-verse fallback)
       cdnFolder: 'CDN_Folder_Name',   // everyayah.com CDN folder
       quranComId: <NUMBER>,            // Quran.com chapter_recitations ID
   },
   ```

3. **Test playback** for Al-Fatiha (1), Al-Baqarah (2 — longest), and An-Nas (114 — shortest).

4. **Verify verse tracking:** Play a few verses, confirm the UI highlight follows the audio precisely.

### Available Quran.com Reciter IDs (Verified March 2026)

| ID | Reciter | Has Timestamps | Status |
|---|---|---|---|
| 1 | Abdul Basit (Mujawwad) | ✅ | Active |
| 2 | Abdul Basit (Murattal) | ✅ | Active |
| 3 | Abdurrahman As-Sudais | ✅ | Active |
| 4 | Abu Bakr Al-Shatri | ✅ | Active |
| 5 | Hani Ar-Rifai | ✅ | Active |
| 6 | Mahmoud Khalil Al-Husary | ✅ | Active |
| 7 | Mishary Rashid Alafasy | ✅ | Active |
| 8 | Al-Minshawi (Mujawwad) | ❌ No timestamps | **Removed** |
| 9 | Al-Minshawi (Murattal) | ✅ | Active |
| 10 | Saud Al-Shuraym | ✅ | Active |
| 11 | Mohamed Al-Tablawi | ✅ | Active |
| 12 | Al-Husary (Muallim) | ✅ | Active |
| 13 | Saad Al-Ghamdi | ✅ | Active |

### Switching to a Different API

If Quran.com v4 ever becomes unreliable, the **Quran Foundation CDN** (`cdn.islamic.network` or `audio.qurancdn.com`) uses the same audio files. The architecture would remain identical — you'd only need to update `QuranAudioApi.ts`:

1. Change `API_BASE` URL
2. Update the JSON parsing to match the new response format
3. Ensure the new API returns `audio_url` + `timestamps` with `verse_key`, `timestamp_from`, `timestamp_to`

### Adding New Playback Features

| Feature | Where to Change | Complexity |
|---|---|---|
| Repeat verse | `AudioPlayerService.seekToVerse()` — seek back to same verse timestamp | Low |
| Speed control | `TrackPlayer.setRate()` — already supported by RNTP | Low |
| Background timer | `AudioContext` — add a timer that calls `pause()` after N minutes | Low |
| Offline download | `downloadVerseToCache()` already exists — extend to download full surah MP3 | Medium |
| Surah-to-surah continue | `AudioContext` — on queue end, load next surah's audio | Medium |

---

## 9. Key Files Quick Reference

| File | Lines | Role |
|---|---|---|
| `domain/Reciter.ts` | ~117 | Reciter definitions, IDs, helpers |
| `infrastructure/QuranAudioApi.ts` | ~153 | Quran.com API client, verse timestamp parser, binary search |
| `infrastructure/AudioPlayerService.ts` | ~938 | RNTP bridge: setup, events, playback, caching, lock screen |
| `infrastructure/AudioContext.tsx` | ~672 | Global React state: orchestration, persistence, Khatma tracking |
| `infrastructure/AudioRecorderService.ts` | ~varies | Recording (unrelated to playback — uses expo-av) |
| `presentation/StickyAudioPlayer.tsx` | ~varies | Sticky player UI component |

---

## 10. Testing Checklist

After ANY audio code change, test **ALL** of these:

- [ ] Surah page → tap verse play → audio plays immediately, highlight follows
- [ ] Surah page → tap different verse mid-playback → switches to correct position
- [ ] Full surah plays to end → state clears, session saved, Khatma tracked
- [ ] Mood sheet → tap verse → audio plays (no surah context, single verse)
- [ ] Sticky player → shows correct state (play/pause/verse info/reciter name)
- [ ] Sticky player → pause → resume → audio continues from same position
- [ ] Sticky player → stop → shows "Continue" session with correct verse
- [ ] Lock screen controls → next/previous verse works (seeks within track)
- [ ] Switch reciters mid-playback → audio restarts with new reciter, no flash to verse 1
- [ ] Rapidly switch reciters → no crash, no hung state, latest selection wins
- [ ] All 12 reciters play Al-Fatiha (short) and Al-Baqarah (long) without issues
- [ ] Background audio continues when app is minimized
- [ ] Dynamic Island shows correct now-playing info on iOS

---

## 11. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react-native-track-player` | ^4.x | Native audio queue, lock screen, background playback |
| `expo-file-system` | SDK 52+ | Pre-download cache for per-verse fallback |
| `@react-native-async-storage/async-storage` | ^1.x | Session persistence |

---

**This document is the single source of truth for the audio system.** All other audio docs (`docs/architecture/audio-player-system.md`, `docs/AUDIO_STABILITY.md`) defer to this.

# Notification System Design Document

## Philosophy

**Low noise · High value · Personalized**

Every notification should feel like a gentle friend, never a corporate system. We cap at **3 notifications per day** (hard constraint) and prioritize contextual relevance over generic reminders.

---

## 1. Complete Notification Map

### Revised 3-Slot Architecture

The current system has 4+ notification IDs but we're constrained to 3 meaningful touchpoints per day. After analysis, here is the optimized slot allocation:

| Slot | ID | Default Time | Trigger | Configurable? |
|------|----|-------------|---------|---------------|
| **1 — Daily Quran Reminder** | `daily-quran-reminder` | User-chosen (default 12:30 PM) | `dailyReminderEnabled` | ✅ Toggle + time picker in Settings |
| **2 — Contextual Nudge** | `contextual-nudge` | 2:00 PM | `khatmaReminderEnabled \|\| streakReminderEnabled` | ❌ Auto (enabled by default) |
| **3 — Adhkar Window** | `adhkar-morning` / `adhkar-evening` / `adhkar-night` | 10:30 AM / 6:15 PM / 9:00 PM | `adhkarReminderEnabled` | ✅ Toggle in Settings |

### Contextual Nudge Priority Cascade (Slot 2)

```
1. Khatma progress   → if khatmaEnabled AND 0 < juzRemaining < 30
2. Streak reminder   → if streakEnabled AND streak >= 2
3. Hadith wisdom     → if user has opened Hadith feature (NEW)
4. Re-engagement     → fallback for all other cases
```

### What Happens to Hadith & Prayer?

| Feature | Decision | Rationale |
|---------|----------|-----------|
| **Hadith** | Integrated into Slot 2 as Priority 3 | Adding a separate toggle clutters Settings. Hadith fits naturally as a "contextual nudge" — it's daily wisdom that complements streak/khatma nudges. |
| **Prayer notifications** | **Remove dead code** | `prayerNotifications` has zero scheduling logic, zero UI. It's pure dead weight. If prayer notifications are ever needed, they should be built properly from scratch. |
| **AI Tafsir** | **Not adding now** | The premium feature is too new. Adding notification touchpoints before understanding usage patterns would be premature. Revisit after 1-2 months of data. |

### Adhkar Sub-slots

Adhkar uses 3 separate notification IDs under one toggle. This is intentional — each adhkar period (morning/evening/night) is a distinct spiritual practice with its own timing. However, they count as **one conceptual slot** because users think of "Adhkar reminders" as a single category.

**Actual notification count per day (worst case):**
- Slot 1: 1 notification
- Slot 2: 1 notification
- Slot 3: up to 3 notifications (morning + evening + night adhkar)

**Total: up to 5 OS notifications**, but only **3 conceptual categories**. This is acceptable because:
1. Adhkar notifications are spread across the entire day (10:30 AM, 6:15 PM, 9:00 PM)
2. They never feel spammy since each arrives at its natural time
3. Users who enable adhkar expect time-specific reminders

---

## 2. End-to-End User Journeys

### 🆕 New User (Day 1)
**Defaults:** dailyReminder=OFF, streak/khatma=ON (hidden), adhkar=ON, hadith=OFF

| Time | Notification | Notes |
|------|-------------|-------|
| 10:30 AM | Morning Adhkar | Adhkar enabled by default |
| 2:00 PM | Re-engagement nudge | No streak/khatma data yet, gets gentle daily message |
| 6:15 PM | Evening Adhkar | — |
| 9:00 PM | Night Adhkar | — |

*No Daily Quran Reminder (Slot 1) because it's off by default — user must opt in.*

### 📖 Active User (Day 7) — 5-day streak, Khatma at Juz 12
**Settings:** dailyReminder=ON (Dhuhr 12:30), streak=ON, khatma=ON, adhkar=ON

| Time | Notification | Notes |
|------|-------------|-------|
| 10:30 AM | Morning Adhkar | — |
| 12:30 PM | Daily Quran Reminder | "Your daily anchor — Let the Quran ground you today..." |
| 2:00 PM | Khatma progress | Priority 1 wins: "Only 18 Juz left!" |
| 6:15 PM | Evening Adhkar | — |
| 9:00 PM | Night Adhkar | — |

### 😴 Lapsed User (Day 14) — inactive 4 days, streak broken
**Settings:** dailyReminder=ON, streak=ON (but streak=0), khatma=OFF

| Time | Notification | Notes |
|------|-------------|-------|
| 10:30 AM | Morning Adhkar | — |
| 12:30 PM | Daily Quran Reminder | Random from 30-message pool |
| 2:00 PM | Re-engagement | "We missed you — Your Quran journey is still here..." |
| 6:15 PM | Evening Adhkar | — |

### 👑 Power User (Pro subscriber) — uses AI Tafsir, reads hadith daily
**Settings:** all ON

| Time | Notification | Notes |
|------|-------------|-------|
| 10:30 AM | Morning Adhkar | — |
| 12:30 PM | Daily Quran Reminder | — |
| 2:00 PM | Khatma/Streak nudge | Contextual based on state |
| 6:15 PM | Evening Adhkar | — |
| 9:00 PM | Night Adhkar | — |

### 🎯 Minimal User — disabled daily reminder, only uses adhkar

| Time | Notification | Notes |
|------|-------------|-------|
| 10:30 AM | Morning Adhkar | Only adhkar slot active |
| 6:15 PM | Evening Adhkar | — |
| 9:00 PM | Night Adhkar | — |

---

## 3. Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| **Daily reminder time overlaps with adhkar** | Both fire independently. iOS/Android handle notification stacking gracefully. The content is different enough that overlap is acceptable. |
| **Contextual nudge: streak=0, no khatma** | Falls through to Hadith (Priority 3) or Re-engagement (Priority 4) |
| **User changes timezone** | `expo-notifications` DAILY triggers use local time. The OS handles timezone transitions automatically. |
| **App not opened in 30 days** | Same notification text repeats (DAILY trigger). The message freshness strategy below mitigates this. |
| **All notifications disabled** | `cancelAllReminders()` clears everything. No notifications fire. |
| **Midnight rollover** | Foreground resync (`AppState → active`) clears the fingerprint, forcing re-evaluation next time app opens. |
| **Scheduling at 11:59 PM** | DAILY triggers fire at the specified hour/minute the next day. Today's slot is missed (acceptable). |

---

## 4. Slot Optimization Proposal

### Current State → Proposed State

```diff
  Slot 1: Daily Quran Reminder        → NO CHANGE
- Slot 2: Khatma > Streak > Re-engage → ADD Hadith as Priority 3
+ Slot 2: Khatma > Streak > Hadith > Re-engage
  Slot 3: Adhkar (3 sub-slots)        → NO CHANGE
- Slot 4: Hadith Daily (unreachable)  → REMOVE (merged into Slot 2)
```

### Why This Works
- **Hadith in Slot 2**: If user has no khatma progress AND no streak, they get hadith wisdom instead of generic re-engagement. This is more personalized and valuable.
- **No new toggles**: Hadith piggybacks on the existing contextual nudge mechanism.
- **Graceful degradation**: If hadith doesn't apply, re-engagement still fires as the final fallback.

### 2:00 PM Contextual Nudge Timing
The current 2:00 PM time is solid. It's:
- After lunch (natural break time in most cultures)
- Not too early (post-Dhuhr prayer window)
- Not too late (still actionable for the day)

**Recommendation: Keep 2:00 PM.** No change needed.

---

## 5. Settings UI Proposal

### Current (2 rows in one card)
```
NOTIFICATIONS
┌─────────────────────────────────────────┐
│ 📖 Daily Quran Reminder        [ON/OFF]│
│    ├ Reminder Time              [⌄]    │
│    └ { prayer chips + custom picker }   │
│ ─────────────────────────────────────── │
│ ✨ Adhkar Reminders             [ON/OFF]│
│    Morning, evening & night             │
└─────────────────────────────────────────┘
```

### Proposed (keep same, no changes)

The current UI is **exactly right**. Two toggles cover everything:
1. **Daily Quran Reminder** — controls Slot 1
2. **Adhkar Reminders** — controls Slot 3

Slot 2 (contextual nudge) is always-on when khatma/streak defaults are enabled, which is the correct behavior — users shouldn't need to think about this.

**No new toggles needed.** The user explicitly said too many toggles = clutter.

---

## 6. Message Freshness Strategy

### Problem
`DAILY` trigger fires the same randomly-selected message every day until re-scheduling occurs. Users who don't open the app for 5+ days see the same text.

### Solution: Date-Seeded Pseudo-Random Selection

Instead of `Math.random()`, use the current date as a seed for deterministic rotation:

```typescript
private static pickMessage<T>(pool: T[]): T {
    const today = new Date();
    const seed = today.getFullYear() * 10000
               + (today.getMonth() + 1) * 100
               + today.getDate();
    return pool[seed % pool.length];
}
```

**Benefits:**
- Different message each day — even without app opens
- Deterministic — same seed produces same message, so re-scheduling mid-day doesn't change the message
- Zero storage overhead — no need to track "last used" messages
- Pool coverage — with 30 daily messages, full rotation every 30 days

**Applied to all message pools:** DAILY_REMINDERS, RE_ENGAGEMENT, STREAK, KHATMA, ADHKAR (morning/evening/night), HADITH.

For streak and khatma messages (which take dynamic parameters), the pool index is date-seeded but the dynamic values (streak count, juz remaining) are injected at scheduling time.

---

## 7. Implementation Changes Summary

### Remove Dead Code
- Delete `prayerNotifications: boolean` from `AppSettings` interface
- Delete `prayerNotifications: false` from `DEFAULT_SETTINGS`
- Delete the `prayerNotifications` loading line in `loadSettings()`
- Remove the `PRAYER_TIMES` constant and related prayer UI from settings (this is for the reminder time picker, NOT actual prayer notifications — verify before removing)

### Integrate Hadith into Contextual Nudge
- In `scheduleContextualNudge()`, add Priority 3 (Hadith) between Streak and Re-engagement
- Remove standalone `scheduleHadithReminder()` call from `NotificationScheduler`
- Keep `hadithNotificationsEnabled` setting for future use, but don't require UI toggle
- Remove `hadithNotificationHour`/`hadithNotificationMinute` settings (no longer needed since hadith uses contextual nudge timing)

### Message Freshness
- Add `pickMessage<T>(pool: T[])` helper using date-seeded index
- Replace all `Math.floor(Math.random() * pool.length)` with `pickMessage(pool)`

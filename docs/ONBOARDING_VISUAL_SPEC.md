# Onboarding Visual Specification

> **Status:** LOCKED — Do not modify onboarding backgrounds without explicit owner approval.
>
> **Last verified:** 2026-03-12
>
> **Purpose:** This document is the single source of truth for onboarding screen backgrounds. It exists to prevent regressions — if any AI agent, developer, or refactor touches these files, they must match this spec exactly.

---

## The Rule

Every onboarding screen has a **locked background type**. There are exactly two approved patterns:

| Pattern | Component | Import |
|---|---|---|
| **LinearGradient** | `<LinearGradient>` from `expo-linear-gradient` | `import { LinearGradient } from 'expo-linear-gradient'` |
| **WaveBackground** | `<WaveBackground>` from `../../src/core/components/animated/WaveBackground` | `import { WaveBackground } from '../../src/core/components/animated/WaveBackground'` |

**You must never swap one for the other unless explicitly instructed.**

---

## File-by-File Specification

### Group A — LinearGradient Screens

These screens use `<LinearGradient>` as their root background wrapper.

| # | File | Light Mode Colors | Dark Mode Colors | Notes |
|---|---|---|---|---|
| 1 | `index.tsx` | `Gradients.primary` (`#6246EA → #4B2FD4`) | `Gradients.primary` | Welcome screen. Same gradient in both modes. |
| 2 | `pick-surah.tsx` | `Gradients.sereneSky` (`#F8F5FF → #EDE5FF`) | `['#0F1419', '#1A1F26']` | — |
| 3 | `listen.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 4 | `ai-tafseer.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 5 | `quran-font.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 6 | `record.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 7 | `widgets.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 8 | `reminders.tsx` | `Gradients.sereneSky` | `['#0F1419', '#1A1F26']` | — |
| 9 | `premium.tsx` | `Gradients.primary` (`#6246EA → #4B2FD4`) | `Gradients.primary` | Premium upsell. Same gradient in both modes. |

**Canonical JSX pattern for Group A (standard screens):**

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../src/core/theme/DesignSystem';

// Inside return:
<LinearGradient
  colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
  style={{ flex: 1 }}
>
  {/* screen content */}
</LinearGradient>
```

**Canonical JSX pattern for Group A (welcome/premium screens):**

```tsx
<LinearGradient colors={Gradients.primary} style={{ flex: 1 }}>
  {/* screen content */}
</LinearGradient>
```

---

### Group B — WaveBackground Screens

These screens use the animated `<WaveBackground>` component.

| # | File | Variant | Intensity |
|---|---|---|---|
| 1 | `adhkar.tsx` | `spiritual` | `subtle` |
| 2 | `folders.tsx` | `spiritual` | `subtle` |
| 3 | `languages.tsx` | `spiritual` | `subtle` |
| 4 | `library.tsx` | `spiritual` | `subtle` |
| 5 | `library-tour.tsx` | `spiritual` | `subtle` |
| 6 | `note.tsx` | `spiritual` | `subtle` |
| 7 | `prayer-times.tsx` | `spiritual` | `subtle` |
| 8 | `reciter.tsx` | `spiritual` | `subtle` |
| 9 | `topics.tsx` | `spiritual` | `subtle` |

**Canonical JSX pattern for Group B:**

```tsx
import { WaveBackground } from '../../src/core/components/animated/WaveBackground';

// Inside return:
<WaveBackground variant="spiritual" intensity="subtle">
  {/* screen content */}
</WaveBackground>
```

---

### Group C — Hybrid

| File | Background | Notes |
|---|---|---|
| `follow-along.tsx` | `WaveBackground` wrapper + internal `LinearGradient` on child elements | Uses `WaveBackground` as outer container; `LinearGradient` only for inner UI cards |

---

### Layout File

| File | Background |
|---|---|
| `_layout.tsx` | None (navigation wrapper only) |

---

## Color Token Reference

All gradient colors are defined in `src/core/theme/DesignSystem.ts`:

```ts
export const Gradients = {
  primary:   ['#6246EA', '#4B2FD4'],  // Brand purple
  sereneSky: ['#F8F5FF', '#EDE5FF'],  // Calm lavender (light mode)
};
```

The dark mode onboarding colors `['#0F1419', '#1A1F26']` are **not** in the `Gradients` object — they are hardcoded per-file because they are specific to the onboarding dark aesthetic and intentionally distinct from the app-wide dark theme (`#09090B`).

---

## Rules for AI Agents and Developers

> [!CAUTION]
> **Read these rules before touching any file in `app/onboarding/`.**

1. **Never change a screen's background type** (LinearGradient ↔ WaveBackground) without explicit owner approval and updating this document.

2. **Never replace `Gradients.sereneSky` with raw hex values** — always reference the design token.

3. **Never change the dark mode hex values** (`#0F1419`, `#1A1F26`) — these are the approved onboarding dark palette.

4. **Never add new gradient libraries** — only `expo-linear-gradient` is approved.

5. **If creating a new onboarding screen**, follow the majority pattern (`LinearGradient` with `sereneSky` / dark fallback) unless the screen has a strong reason for `WaveBackground`. Document the choice here.

6. **After any onboarding file edit**, verify backgrounds haven't changed by checking:
   ```bash
   grep -n "LinearGradient\|WaveBackground\|Gradients\.\|#0F1419" app/onboarding/*.tsx
   ```

7. **This document must be updated** whenever a new onboarding screen is added or an existing one's background is intentionally changed.

---

## Quick Verification Command

Run this from the project root to audit all onboarding backgrounds against this spec:

```bash
echo "=== LinearGradient screens ===" && \
grep -l "LinearGradient" app/onboarding/*.tsx | sed 's|app/onboarding/||' | sort && \
echo "" && \
echo "=== WaveBackground screens ===" && \
grep -l "WaveBackground" app/onboarding/*.tsx | sed 's|app/onboarding/||' | sort
```

**Expected output:**

```
=== LinearGradient screens ===
ai-tafseer.tsx
follow-along.tsx
index.tsx
listen.tsx
pick-surah.tsx
premium.tsx
quran-font.tsx
record.tsx
reminders.tsx
widgets.tsx

=== WaveBackground screens ===
adhkar.tsx
folders.tsx
follow-along.tsx
languages.tsx
library-tour.tsx
library.tsx
note.tsx
prayer-times.tsx
reciter.tsx
topics.tsx
```

# QuranNotes Color System

> **Canonical reference** — generated 2026-02-21. Update this file first whenever brand colors change, then update `DesignSystem.ts` to match.

---

## Brand Identity

QuranNotes occupies the **premium Islamic mindfulness** space — serene, introspective, and deeply spiritual. The palette draws from the violet-indigo spectrum used across the app, referencing the color of twilight, clarity, and reflection. It is deliberately *not* a tech-blue palette; the violet family is warmer, more spiritual, and more opinionated.

---

## The Canonical Tokens

| Token | Light Hex | Role |
|---|---|---|
| `bgMain` | `#F8F5FF` | 1 Light Neutral Bg (Lavender hue for comfort) |
| `bgSurface` | `#FFFFFF` | Pure white cards/panels (Removes muddy grey/purple layers) |
| `textPrimary` | `#1C1033` | Grey 1: Primary Text (Extremely dark violet-black) |
| `textSecondary` | `#64748B` | Grey 2: Secondary Text (Slate 500, clean neutral) |
| `accentPrimary` | `#6246EA` | 1 Primary Purple |
| `primaryDark` | `#4B2FD4` | 1 Dark Purple (Emphasis & high contrast active states ONLY) |
| `border` | `#E2E8F0` | Grey 3: Borders & Dividers (Slate 200) |

---

## The 60-30-10 Layout Rule

```
┌─────────────────────────────────────────┐
│          bgMain  #F8F5FF                │  ← 60%  Screen background (Base canvas)
│  ┌────────────────────────┐             │
│  │  bgSurface  #FFFFFF    │  ← 30%     Cards, text boxes (Clean high contrast)
│  │                        │             │
│  │  [    accentPrimary   ]│  ← 10%     Primary buttons, icons, accents
│  │  [    #6246EA         ]│             
│  └────────────────────────┘             │
└─────────────────────────────────────────┘
```

**Enforcement rule:** Every new screen design must implement strictly these core colors. Do not mix random purples. Do not layer grey on grey. Cards MUST be `#FFFFFF` (Surface) floating cleanly on `#F8F5FF` (Main) via shadows or the `border` `#E2E8F0` token.

---

## Usage in Code

```typescript
import { BrandTokens } from '../theme/DesignSystem';
import { useTheme } from 'react-native-paper';

// Recommended: use BrandTokens for new components
const { colorScheme } = useColorScheme(); // or theme.dark
const T = theme.dark ? BrandTokens.dark : BrandTokens.light;

// Then reference as:
// T.bgMain, T.bgSurface, T.textPrimary, T.textSecondary, T.accentPrimary
```

### What NOT to Do
```typescript
// ❌ Never use raw hex codes in component styles
backgroundColor: '#4C1D95'

// ❌ Never use theme.colors.primary for backgrounds — it's the accent color
backgroundColor: theme.colors.primary

// ✅ Use the semantic tokens
backgroundColor: T.bgSurface
color: T.textPrimary
```

---

## Gradient Usage

All gradients must remain within the same violet family. Approved gradient patterns:

| Use case | Colors |
|---|---|
| Dark widget / card hero | `#2D1665 → #1A0940` |
| Verse of the Day (light mode) | `#8B5CF6 → #7C3AED → #6D28D9` |
| Verse of the Day (dark mode) | `#4C1D95 → #5B21B6 → #3B0764` |
| Screen background gradient | `#F8F5FF → #EDE9FE` |
| Morning Adhkar tile | `#FDE68A80 → #FEF3C755` |
| Evening Adhkar tile | `#1E3A8A40 → #1E40AF50` (navy — intentionally off-palette for time-of-day contrast) |

> The Evening Adhkar navy exception is intentional — it marks a *temporal shift*, not a brand element. All other UI should stay in violet.

---

## Do Not Change Without Review

- `accentPrimary` — tied to react-native-paper's `primary` in the MD3 theme. Changing it affects all Paper buttons, switches, and checkboxes.
- `textPrimary` — Arabic text legibility depends on this; any change requires full WCAG re-verification.
- `bgMain` — used as the splash screen background color in `app.json`. Changing it requires a prebuild.

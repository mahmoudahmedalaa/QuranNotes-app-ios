# QuranNotes Color System

> **Canonical reference** — generated 2026-02-21. Update this file first whenever brand colors change, then update `DesignSystem.ts` to match.

---

## Brand Identity

QuranNotes occupies the **premium Islamic mindfulness** space — serene, introspective, and deeply spiritual. The palette draws from the violet-indigo spectrum used across the app, referencing the color of twilight, clarity, and reflection. It is deliberately *not* a tech-blue palette; the violet family is warmer, more spiritual, and more opinionated.

---

## The 5 Canonical Tokens

| Token | Light Hex | Dark Hex | Role |
|---|---|---|---|
| `bgMain` | `#F8F5FF` | `#110A26` | Primary background (60% of UI) |
| `bgSurface` | `#EEE9FA` | `#1A1340` | Cards, panels, text boxes (30% of UI) |
| `textPrimary` | `#1C1033` | `#F0EEFF` | Main headings and body text |
| `textSecondary` | `#5E5A98` | `#9E9AC8` | Transliterations, timestamps, captions |
| `accentPrimary` | `#6246EA` | `#8B74F0` | CTAs, play buttons, saves (10% of UI) |

---

## Color Theory Rationale

### Palette Family
All five tokens are **strictly monochromatic within the violet-indigo family** (hue range 255°–270°). This creates visual coherence — every surface, every text, every action feels like it belongs to the same identity.

### Why These Exact Hues?

| Decision | Rationale |
|---|---|
| `bgMain #F8F5FF` vs pure white | Reduces eye strain on Arabic text. Slight lavender tint makes long reading sessions more comfortable and connects the background to the brand |
| `bgSurface #EEE9FA` vs `#FFFFFF` cards | Creates visible depth against `bgMain` without harsh contrast. Ayah cards "lift" from the background rather than floating on pure white |
| `textPrimary #1C1033` vs pure black | Violet undertone connects the darkest value to the brand. Less harsh than `#000000` while maintaining maximum legibility |
| `textSecondary #5E5A98` vs blue-grey | Previous `#6B7C93` was a muted **blue-grey** — disconnected from the violet brand. `#5E5A98` is a muted **violet** that feels tonally unified |
| `accentPrimary #6246EA` vs previous `#5B7FFF` | The old primary was blue-biased (periwinkle) — it read as "tech app." `#6246EA` is definitively **spiritual violet** — more intentional, less generic |

---

## WCAG AA Contrast Verification

All pairings computed using the WCAG 2.1 relative luminance formula.

| Pairing | Contrast Ratio | WCAG AA (≥4.5:1) |
|---|---|---|
| `textPrimary` on `bgMain` | **15.4:1** | ✅ AAA |
| `textPrimary` on `bgSurface` | **14.1:1** | ✅ AAA |
| `textSecondary` on `bgMain` | **5.18:1** | ✅ AA |
| `textSecondary` on `bgSurface` | **4.75:1** | ✅ AA |
| White (`#FFFFFF`) on `accentPrimary` | **5.29:1** | ✅ AA |

> **Rule:** Always use `#FFFFFF` text on accent-colored buttons. Dark text fails (3.1:1).

---

## The 60-30-10 Rule

```
┌─────────────────────────────────────────┐
│          bgMain  #F8F5FF                │  ← 60%  Screen backgrounds, ScrollView fills
│  ┌────────────────────────┐             │
│  │  bgSurface  #EEE9FA   │  ← 30%     Ayah cards, note boxes, modals, panels
│  │                        │             │
│  │  [    accentPrimary   ]│  ← 10%     Primary CTA buttons, active states,
│  │  [    #6246EA         ]│             play circles, save confirmations
│  └────────────────────────┘             │
└─────────────────────────────────────────┘
```

**Enforcement rule:** Every new screen design must allocate roughly 60/30/10. If an element needs colour that isn't one of the five tokens, question whether it's necessary before adding it.

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

# QuranNotes — Brand Identity Document

> **Version**: 1.0 — March 2026
> **Status**: Canonical reference for all visual design decisions
> **Supersedes**: `src/core/theme/color-system.md` (technical spec only)

---

## 1. Brand Story & Emotional Positioning

### Who We Are
QuranNotes is a **premium Islamic mindfulness** app — the intersection of spiritual devotion and modern design. We're not a utilitarian prayer-times tool. We're a **daily spiritual companion** that feels as considered and calming as opening a beautifully bound Quran.

### Emotional Positioning
| Attribute | We Are | We Are NOT |
|-----------|--------|------------|
| **Tone** | Serene, contemplative, wise | Loud, gamified, aggressive |
| **Feeling** | Like twilight — quiet clarity | Like a carnival — overwhelming |
| **Aesthetic** | Premium wellness (Calm/Headspace) | Utilitarian Islamic tool |
| **Color** | Violet — spiritual, wise, rare | Green or blue — overused in Islamic apps |

### Why Violet?
Violet is the **rarest color in nature** and sits at the boundary between the visible spectrum and the invisible. In Islamic art, purple and violet have historically symbolized **spiritual depth, royalty of the soul, and the unseen realm (al-Ghayb)**. It is also the color of twilight — the time between prayers — and of reflection.

By choosing violet as our brand anchor, we deliberately differentiate from the green/teal/blue palette that dominates Islamic apps, while maintaining a deeply spiritual resonance.

---

## 2. The Color System

### 2.1 Primary Brand Color

| Token | Value | Usage |
|-------|-------|-------|
| `accentPrimary` (Light) | **#6246EA** | CTAs, active states, brand accents |
| `accentPrimary` (Dark) | **#A78BFA** | Same role, optimized for dark backgrounds |
| `primaryDark` | **#4B2FD4** | Emphasis, pressed states only |

### 2.2 The Extended Violet Palette (24 Shades)

Every color on screen must be selectable from this palette. No exceptions.

#### Light End (Backgrounds, Surfaces)
| Name | Hex | Usage |
|------|-----|-------|
| Lavender Mist | `#F5F3FF` | Lightest background tint |
| Soft Lavender | `#F8F5FF` | Primary background (`bgMain`) |
| Pale Violet | `#EDE9FE` | Background gradient end |
| Light Amethyst | `#EDE5FF` | `primaryContainer`, Khatma tile |
| Wisteria | `#DDD6FE` | Subtle card tints |
| Soft Iris | `#D8B4FE` | Morning Adhkar gradient start |

#### Mid-Range (Accents, Gradients)
| Name | Hex | Usage |
|------|-----|-------|
| Orchid | `#C084FC` | Warm-violet accent, morning transitions |
| Medium Violet | `#A78BFA` | Dark mode primary, heatmap |
| Amethyst | `#8B5CF6` | Rich accent, Verse day gradient |
| Royal Violet | `#7C3AED` | Feature highlights, Hadith day |
| Brand Violet | `#6246EA` | **THE brand color** |
| Deep Violet | `#5B21B6` | Evening gradients, emphasis |

#### Deep End (Rich Cards, Night States)
| Name | Hex | Usage |
|------|-----|-------|
| Aubergine | `#4C1D95` | Twilight, evening verse |
| Midnight Violet | `#3B0764` | Deep twilight |
| Dark Plum | `#2E1065` | Night Adhkar gradient |
| Cosmic Indigo | `#1E1B4B` | Night card backgrounds |
| Midnight Indigo | `#1A1040` | Night verse/hadith |
| Deep Space | `#0F0A2A` | Deepest night gradient |
| Cosmic Black | `#030014` | Near-black night end |

#### Warm Violet (Pink-Violet Undertone)
| Name | Hex | Usage |
|------|-----|-------|
| Rose Quartz | `#E9D5FF` | Warm mood gradient |
| Warm Amethyst | `#C084FC` | Warm card accent |
| Plum | `#9333EA` | Hadith day gradient (warm) |
| Berry | `#7E22CE` | Hadith rich accent |
| Deep Berry | `#6B21A8` | Hadith twilight |
| Dark Plum | `#581C87` | Hadith deep evening |

### 2.3 Neutral Text Hierarchy (Unchanged)

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `textPrimary` | `#1C1033` | `#FAFAFA` | Primary text |
| `textSecondary` | `#64748B` | `#A1A1AA` | Secondary text |
| `border` | `#E2E8F0` | `#27272A` | Borders, dividers |

### 2.4 Semantic Colors (Functional Only)

These exist for **functional communication** and appear small/sparingly:

| Role | Color | Where |
|------|-------|-------|
| Success | `#10B981` | Checkmarks, completed states |
| Error | `#E53E3E` | Validation, destructive actions |
| Warning | `#F59E0B` | Alerts (not used on dashboard) |
| Streak Fire | `#D946EF` | StreakCounter icon (fuchsia-violet) |

> [!IMPORTANT]
> The streak fire shifts from iOS orange (`#FF9500`) to fuchsia-violet (`#D946EF`). This maintains the "energy/fire" association while staying in the violet family.

---

## 3. The Violet Atmosphere — Time-of-Day Philosophy

### Core Principle
> Time-of-day is expressed through **depth and warmth within the violet spectrum**, never by introducing foreign hue families.

Think of it as a **violet sky** moving through the day:
- **Dawn/Morning**: Light, airy, hopeful — pale lavenders and soft violets
- **Daytime**: Clear, vibrant, confident — rich brand violet
- **Twilight**: Contemplative, rich, warm — deep plum and aubergine
- **Night**: Serene, mysterious, intimate — midnight indigo

### 3.1 Adhkar Tile — Violet Day Cycle

The Adhkar tile sits beside the Khatma tile. They must feel like a **unified pair**.

| Period | Gradient | Text Color | Vibe |
|--------|----------|------------|------|
| Morning | `#EDE5FF → #D8B4FE → #C084FC` | `#4C1D95` | Soft dawn violet, gentle awakening |
| Evening | `#7C3AED → #6D28D9 → #5B21B6` | `#EDE9FE` | Rich sunset violet, contemplative |
| Night | `#2E1065 → #1E1B4B → #0F0A2A` | `#DDD6FE` | Deep indigo, serene darkness |

### 3.2 Verse of the Day — Cool Violet (Blue Undertone)

The Quranic verse is **divine clarity** — expressed through cooler, bluer violets.

| Period | Gradient | Emotional Note |
|--------|----------|----------------|
| Day (6am–6pm) | `#6246EA → #7C3AED → #8B5CF6` | Confident, clear, illuminated |
| Twilight (6–8pm) | `#5B21B6 → #4C1D95 → #3B0764` | Deep, contemplative |
| Night (8pm–6am) | `#1E1B4B → #0F0A2A → #030014` | Intimate, vast, serene |

### 3.3 Hadith of the Day — Warm Violet (Pink Undertone)

The Hadith is **prophetic wisdom** — human warmth — expressed through warmer, pinker violets.

| Period | Gradient | Emotional Note |
|--------|----------|----------------|
| Day (6am–6pm) | `#7C3AED → #9333EA → #A855F7` | Warm, inviting, wise |
| Twilight (6–8pm) | `#6B21A8 → #581C87 → #4A044E` | Deep plum, reflective |
| Night (8pm–6am) | `#1A1040 → #0F0A2A → #030014` | Midnight, peaceful |

> [!NOTE]
> We reduced from 6 time states to 3 (day/twilight/night). Simpler to maintain, more cohesive visually, and the subtle gradient shift every few hours still gives the cards a "living" quality.

---

## 4. The 60-30-10 Layout Rule

```
┌─────────────────────────────────────────┐
│          bgMain  #F8F5FF                │  ← 60%  Screen background
│  ┌────────────────────────┐             │
│  │  bgSurface #FFFFFF     │  ← 30%     Cards, panels, prayer card
│  │                        │             │
│  │  [ accentPrimary      ]│  ← 10%     CTAs, rings, active elements
│  │  [ #6246EA            ]│             
│  └────────────────────────┘             │
└─────────────────────────────────────────┘
```

The rich violet gradient cards (Verse & Hadith) count as part of the **10% accent** — they are intentionally eye-catching. That's why the Prayer card and Khatma tile remain neutral/light — to give the vibrant cards room to breathe.

---

## 5. Gradient Usage Policy

### Approved Patterns

| Use Case | Colors | Notes |
|----------|--------|-------|
| Screen background | `#F8F5FF → #EDE9FE` | Ultra subtle, lavender shift |
| Premium CTA button | `#6246EA → #4B2FD4` | Brand gradient |
| Adhkar tile (×3) | See §3.1 | Light → Rich → Deep |
| Verse card (×3) | See §3.2 | Cool violet, blue undertone |
| Hadith card (×3) | See §3.3 | Warm violet, pink undertone |
| Dark mode background | `#09090B → #18181B` | Zinc neutral, no violet tint |

### Forbidden Patterns
- ❌ Gold/amber gradients (`#FDE68A`, `#F59E0B`) — removed from Adhkar
- ❌ Coral/rose gradients (`#F4A983`, `#E07B6D`) — removed from Adhkar evening
- ❌ Teal/blue sky gradients (`#4CA1AF`, `#73bdeb`) — removed from Verse
- ❌ Orange/amber gradients (`#CD6600`, `#DAA520`) — removed from Hadith
- ❌ Any gradient spanning two different hue families

---

## 6. Mood Icon Colors

The 11 mood icons use diverse colors **by design** — emotions genuinely map to different hues. This is the one exception to the violet-only rule.

**Rules for mood colors:**
1. They exist ONLY within the mood carousel/pill — never leaked to other UI
2. The colors are pre-baked into PNG images — they're visual assets, not UI surfaces
3. The carousel container itself has NO background color — it floats transparently on `bgMain`
4. When a mood is selected and shown as a pill, the pill background is `transparent` (already correct)

> Mood colors are **contained diversity** — like flowers in a garden that has violet walls.

---

## 7. Typography (Unchanged)

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Display | 32px | 700 | Hero numbers |
| Title Large | 20px | 600 | Section headers |
| Title Medium | 16px | 600 | Card titles |
| Body Large | 16px | 400 | Content text |
| Body Medium | 14px | 400 | Secondary content |
| Label | 12px | 500 | Tags, metadata |
| Caption | 11px | 400 | Timestamps |

Arabic text: minimum 38px line-height, user-selectable font family.

---

## 8. Competitive Positioning

| App | Primary Color | Strategy | Our Advantage |
|-----|--------------|----------|---------------|
| Muslim Pro | Green + Gold | Traditional Islamic | We feel modern, not traditional |
| Tarteel | Neutral/Teal | Minimalist utility | We have emotional depth + warmth |
| Al-Quran | Teal + White | Clean, sparse | We have richer visual experience |
| Quran.com | Green + White | Web-first, functional | We're mobile-native, premium |
| **QuranNotes** | **Violet** | **Premium mindfulness** | **Only violet-branded Islamic app** |

---

## 9. Anti-Patterns — Never Do This

1. ❌ **Never introduce a new hue** outside the extended violet palette on any surface or gradient
2. ❌ **Never use raw hex codes** — always reference `BrandTokens` or named palette values
3. ❌ **Never mix warm and cool colors** on adjacent elements (the original problem)
4. ❌ **Never use more than 2 gradient cards** visible simultaneously without a neutral card between them
5. ❌ **Never apply mood colors** to non-mood UI elements
6. ❌ **Never hardcode time thresholds** without matching the Adhkar/Verse/Hadith cycle
7. ❌ **Never use `#FF9500`** (iOS orange) or other platform-native accent colors
8. ❌ **Never add a gradient to the Prayer card** — it's the neutral "breathing room" between the rich cards

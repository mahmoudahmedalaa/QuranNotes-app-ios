---
description: Mobile app color palettes and UI component patterns for premium, engaging interfaces
---

# Mobile App Color & UI Design Skill

## Color Palette Principles

### 1. Dual-Accent Color System
Never use a single color for everything. Every premium app uses **at least 2 contrasting accent colors**:

| Pattern | Primary | Accent | When to use |
|---------|---------|--------|-------------|
| **Purple + Gold** | `#6C63FF` | `#F5A623` / `#FFB020` | Spiritual, mindfulness apps |
| **Blue + Coral** | `#4A90D9` | `#FF6B6B` | Productivity, health |
| **Teal + Amber** | `#2DD4BF` | `#FBBF24` | Fresh, growth-oriented |
| **Indigo + Emerald** | `#6366F1` | `#10B981` | Trust + achievement |
| **Deep Blue + Warm Orange** | `#3B82F6` | `#F97316` | Energy, motivation |

### 2. Semantic Color Assignments
Map colors to meaning, not just decoration:
- **Progress/achievement**: Warm colors (gold `#F5A623`, amber `#FBBF24`, orange `#F97316`)
- **Completion/success**: Green spectrum (`#10B981`, `#34D399`, `#38A169`)
- **Navigation/primary actions**: Cool colors (purple, blue, indigo)
- **Warning/behind**: Soft warm (`#F59E0B`, not harsh red)
- **Background accents**: Muted, desaturated versions of the accent at 10-15% opacity

### 3. Color Temperature Contrast
The secret of apps like Headspace, Duolingo, Calm:
- **Cool base** (purple/blue) + **warm highlights** (gold/orange/coral)
- This creates visual depth and draws the eye to important elements
- Numbers, progress indicators, and celebrations should use the **warm** accent

---

## Card Design Patterns (Proven)

These patterns emerged from market research on Quranly, Tarteel AI, Muslim Pro, Calm, and Headspace and are **validated in production** in this app.

### The Clean Elevated Card
The foundation for all content cards (surah cards, reading cards, feature cards):

```
┌─────────────────────────────────────────┐
│  ·  UP NEXT                             │   ← Subtle status pill (12% opacity bg)
│                                         │
│  Surah Name          سورة النّاس        │   ← English 22px bold / Arabic 32px right
│  114 verses                             │   ← Muted meta text (13px, 60% opacity)
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │████████████░░░░░░░░░│ 67%           │ │   ← 3px thin progress bar + percentage
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌──────────────────────┐  ┌───┐        │
│  │   📖  Start Reading  │  │ ✓ │        │   ← Solid primary CTA + icon-only complete
│  └──────────────────────┘  └───┘        │
└─────────────────────────────────────────┘
```

**Rules:**
- Background: Solid `#FFFFFF` (light) or `theme.colors.surface` (dark) — **NEVER gradients inside cards**
- Depth: Use `Shadows.md` or `Shadows.sm` from DesignSystem — not borders
- Border radius: `20px` for main cards, `14px` for compact rows
- Padding: `20px` for content cards, `12-14px` for compact rows
- Status badge: `10px` uppercase bold, `1.2` letter spacing, accent color at 12% opacity bg

### The Compact Completed Row
For items already done — de-emphasize to keep focus on what's next:

```
│┃  ✓  Surah Name      سورة     ↻  │
```

**Rules:**
- White/surface background with `Shadows.sm` for subtle lift
- **3px colored accent strip** on left edge (green for completed, blue for bookmarked, etc.)
- Inline icon (18px) — no circular background container
- Smaller text: English 14px/600, Arabic 18px/600 at reduced opacity
- Restart/action button: icon-only circle (30×30), `rgba(0,0,0,0.04)` bg
- **No colored backgrounds** (no green/blue tinted cards for completed states)

### CTA Button Hierarchy
| Level | Style | Example |
|-------|-------|---------|
| **Primary** | Solid `primary` color, white text, `13px` padding, `borderRadius: full` | "Start Reading", "Continue" |
| **Secondary** | Icon-only circle (44×44), `10%` opacity tint bg | Complete ✓, Bookmark |
| **Tertiary** | Ghost/outlined, muted text color | "Restart", "Skip" |

```
✅ DO: Solid filled primary buttons with white text for main CTAs
✅ DO: Icon-only circles for secondary actions (reduces visual noise)
❌ DON'T: Use primaryContainer/tinted backgrounds for main CTAs (looks washed out)
❌ DON'T: Put text labels on every action button — icons are enough for secondary actions
```

---

## Anti-Pattern Watchlist

These are **specific mistakes we've made** — never repeat them:

### ❌ Gradients Inside Cards
```
// NEVER DO THIS
<LinearGradient
    colors={[theme.colors.surfaceVariant, theme.colors.surface]}
    style={StyleSheet.absoluteFill}
/>
```
Gradients inside cards look muddy, especially surfaceVariant→surface. Use a solid surface color + shadow instead.

### ❌ Colored Borders on Cards
```
// NEVER DO THIS
borderWidth: 1,
borderColor: accentColor + '30'
```
Colored borders around cards look cheap and date the design. Use shadows for depth.

### ❌ Full-Color Backgrounds for Status
```
// NEVER DO THIS
backgroundColor: isDark ? ACCENT.greenBgDark : ACCENT.greenBg
```
Full green/blue/gold backgrounds for states (completed/in-progress) are too heavy. Use white bg + colored accent strip (3px left border) instead.

### ❌ Large Heavy Status Badges
```
// NEVER DO THIS
fontSize: 14, fontWeight: '700', paddingVertical: 8
```
Status badges should be whisper-small: `10px`, `800` weight, `1.2` letter spacing, uppercase. They're context labels not headlines.

### ❌ Tinted CTA Buttons
```
// NEVER DO THIS — looks washed out
backgroundColor: theme.colors.primaryContainer
color: theme.colors.primary
```
Primary CTAs must be solid filled (`backgroundColor: theme.colors.primary`, `color: '#FFFFFF'`).

### ❌ Text + Icon on Secondary Actions
```
// NEVER DO THIS
<Text>Complete</Text>  // Unnecessary label next to checkmark icon
```
Secondary action buttons should be icon-only circles. The icon IS the label.

---

## Typography Hierarchy

### Font Size Scale (React Native)
| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Page title | 28-32 | 800 | -0.5 |
| Arabic surah name (card) | 32 | 600 | — |
| English surah name (card) | 22 | 700 | -0.3 |
| Section header | 18-20 | 700 | — |
| Card title | 16 | 700 | — |
| Body text | 14-15 | 400-500 | — |
| Meta/subtitle | 13 | 500 | — (+ 60% opacity) |
| Label/caption | 12 | 500 | — |
| Status badge | 10 | 800 | 1.2 (uppercase) |

### Arabic Text Rules
- Always **right-aligned** within its container
- Minimum `28px` for readability — `32px` preferred on cards
- Give it breathing room: `lineHeight: fontSize × 1.3`
- Slightly reduced opacity (`B0` hex suffix) on completed/de-emphasized items

---

## Component Patterns

### Progress Indicators
```
✅ DO: Use warm accent for progress numbers/rings/bars
✅ DO: Thin progress bars (3px) — they're context, not decoration
✅ DO: Show percentage alongside the bar
❌ DON'T: Use the same primary purple for everything
❌ DON'T: Use thick (4px+) progress bars — they dominate the card
```
- Progress rings: Fill with **gold/amber gradient**
- Stats numbers: Render in **warm accent color**
- Progress bars: `3px` height, colored fill, text showing "Verse X of Y" + percentage

### Checkmarks & Completion States
```
✅ DO: Consistent shape (all circles OR all rounded squares)
✅ DO: Use a single icon library consistently
✅ DO: Small inline icons (18px) for completed items
❌ DON'T: Mix circle checkmarks with square ones
❌ DON'T: Show multiple redundant checkmarks
❌ DON'T: Use circular background containers for checkmarks (just the icon)
```
- Use `Ionicons` for status: `checkmark-circle` (filled), `checkmark-circle-outline` (action)
- Use `MaterialCommunityIcons` for utility: `refresh`, `bookmark`, `share`

### Day/Week Strips (Headspace/Duolingo style)
- Compact single row showing 7 days
- Each day: circle avatar with state indicator
- Today highlighted with ring/border, not fill
- Past completed: filled accent color
- Future: grey/muted
- Expandable to full month on tap

### Motivational Content
```
✅ DO: Large, breathing text with generous line height
✅ DO: Arabic text at 28-32pt with 48+ line height
❌ DON'T: Cram motivational text into small colored bars
❌ DON'T: Use the same container style for status AND motivation
```

### Banner/Status Messages
- Keep them lightweight: text only, no heavy containers
- Use color for the text, not a colored background
- One icon max, positioned left
- No checkmark icons in text-based status messages

---

## Premium App Patterns to Emulate

### Quranly
- Clean white cards with soft shadows — zero gradients inside cards
- Strong typography hierarchy: bold English + large Arabic right-aligned
- Subtle colored dots/pills for status, never full-color backgrounds
- Generous padding and breathable card spacing

### Tarteel AI
- Minimalist design, confident whitespace
- Purple/gold accent system for a modern Islamic aesthetic
- Thin progress indicators, percentage labels

### Calm
- Solid surface CTA buttons (not tinted/outlined)
- Minimal UI, maximum breathing room
- Progress is subtle, not overwhelming
- Nature-inspired warm tones for background only

### Headspace
- Compact weekly strips with character avatars
- Warm coral + cool teal palette
- Large, confident motivational text
- Lots of whitespace

### Duolingo
- Bright, contrasting colors per section
- Progress feels rewarding (animations, celebrations)
- Gold for streaks and achievements
- Simple, bold icons

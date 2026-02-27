---
description: Pre-delivery UI quality checklist. Run after completing any visual/UI changes to catch common issues before the user sees them.
---

# UI Pre-Delivery Checklist

Run this checklist after any UI work before notifying the user. Fix issues in-place — don't ask for permission.

## 1. Card & Container Audit
// turbo
Check all modified card/container components:

- [ ] **No gradients inside cards** — `LinearGradient` should NEVER be used as card backgrounds. Use solid `surface` color + `Shadows.md`
- [ ] **No colored borders** — Cards use shadows for depth, not `borderWidth` + colored `borderColor`
- [ ] **No full-color status backgrounds** — Completed/in-progress cards should be white/surface with a thin (3px) accent strip, not tinted backgrounds
- [ ] **Border radius consistency** — Main cards: `20px`, compact rows: `14px`, buttons: `borderRadius.full`

## 2. Typography Check
Review all text in modified components:

- [ ] **Arabic text** is ≥28px (32px preferred on cards), right-aligned, with breathing lineHeight
- [ ] **English titles** are bold (700 weight) with tight tracking (-0.3)
- [ ] **Meta/subtitle text** is muted (13px, 500 weight, 60% opacity)
- [ ] **Status badges** are 10px, 800 weight, 1.2 letter spacing, uppercase
- [ ] **No Typography.* tokens** in inline styles that override them — use raw values if customizing

## 3. Button Hierarchy
Check all interactive elements:

- [ ] **Primary CTA** is solid filled (`backgroundColor: theme.colors.primary`, `color: '#FFFFFF'`)
- [ ] **Secondary actions** are icon-only circles (44×44) — no unnecessary text labels
- [ ] **Tertiary actions** are ghost/outlined with muted colors
- [ ] **No `primaryContainer` backgrounds** on main CTAs — that's washed out

## 4. Color & Contrast
- [ ] **WCAG AA contrast** — body text ≥4.5:1, large text/headings ≥3:1 against background
- [ ] **Dark mode tested** — if `isDark` logic exists, verify both modes look correct
- [ ] **Accent colors are semantic** — green = done, gold = progress, blue/purple = primary action
- [ ] **No magic hex colors** — all colors from `theme.colors.*`, `ACCENT.*`, or `DesignSystem.*`

## 5. Touch Targets & Spacing
- [ ] **All tappable elements ≥44×44pt** — check `width`, `height`, `paddingVertical`
- [ ] **Card padding ≥20px** for main cards, ≥12px for compact rows
- [ ] **Gap between cards ≥10px** — use `gap` not manual margins

## 6. Icon Consistency
- [ ] **One library per context** — don't mix `Ionicons` and `MaterialCommunityIcons` for similar actions
- [ ] **No emoji as UI elements** — use proper icon components
- [ ] **Icon sizes match hierarchy** — primary 14-16px, secondary 13-14px, inline/meta 18px

## 7. Import Cleanup
// turbo
Run after removing any visual elements:

```bash
# Check for unused imports in modified files
grep -n "import.*LinearGradient" <modified-file>
grep -n "import.*unused" <modified-file>
```

- [ ] **No unused imports** — especially `LinearGradient`, `StyleSheet.absoluteFill` if gradients were removed
- [ ] **TypeScript clean** — run `npx tsc --noEmit` and verify zero errors

## 8. Visual Verification
Take a simulator screenshot and verify:

```bash
xcrun simctl io booted screenshot /tmp/ui-check.png
```

- [ ] **Cards read top-to-bottom** — clear visual hierarchy in every card
- [ ] **Nothing looks "flat"** — shadows are visible, cards have depth
- [ ] **Completed items are de-emphasized** — smaller, less bold, accent strip only
- [ ] **Active items draw the eye** — larger text, solid CTA, prominent
- [ ] **No cramped text** — everything has breathing room
- [ ] **Arabic text is beautiful** — large, right-aligned, not truncated

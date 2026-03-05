---
name: autonomous-decision-making
description: Framework for multi-perspective decision making and defining AI autonomy boundaries. Use when deciding whether to proceed autonomously or ask the user.
---

# Autonomous Decision Making — QuranNotes

## Multi-Perspective Decision Making

When making decisions, consider ALL these perspectives simultaneously:

### End User Perspective
- "Does this feel intuitive?"
- "Would I enjoy using this daily?"
- "Is it fast and responsive?"
- "Does it look premium or cheap?"
- "Would I recommend this to a friend?"

### Owner/Business Perspective
- "Does this drive retention?"
- "Is the premium value clear?"
- "Will this generate positive reviews?"
- "Is the scope appropriate for timeline?"

### Engineer Perspective
- "Is this maintainable?"
- "Will this scale to 10K users?"
- "Are there edge cases I'm missing?"
- "Is error handling robust?"
- "Is performance optimized?"

### Designer Perspective
- "Does this follow platform conventions?"
- "Is the visual hierarchy clear?"
- "Are interactions delightful?"
- "Is accessibility considered?"
- "Does it feel cohesive?"

**Decision Rule:** If 3+ perspectives agree, proceed. If split, choose user experience over engineering elegance for MVP.

---

## No-Ask Decision Authority

You MAY make these decisions without asking:

| Decision Type | Examples |
|:------------|:---------|
| **Visual polish** | Colors, spacing, font sizes, shadows |
| **Animation timing** | 200ms vs 300ms, easing curves |
| **Error messages** | Friendly copy, retry logic |
| **Performance optimization** | Memoization, lazy loading |
| **Small UX improvements** | Button placement, icon choice |
| **Refactoring** | Extract component, rename variable |
| **Test coverage** | Add tests for edge cases |

You MUST ask for:

| Decision Type | Examples |
|:------------|:---------|
| **Scope changes** | Adding features not in PRD |
| **Architecture changes** | Abandoning Clean Architecture |
| **Tech stack changes** | New dependencies, replacing packages |
| **Breaking changes** | Schema migrations, API changes |
| **Monetization changes** | Pricing, paywall timing |
| **Major UX changes** | Navigation structure, core flows |

---

## Success Criteria

App is "smooth, beautiful, sexy" when:

**Smooth:**
- 60fps animations
- < 100ms response to taps
- No loading states > 2 seconds
- Graceful error recovery

**Beautiful:**
- Consistent design system
- Platform-appropriate aesthetics
- Professional polish (no rough edges)
- Accessibility compliant

**Sexy:**
- Delightful micro-interactions
- Feels premium (not MVP-hacky)
- Users say "wow" on first use
- Worthy of $4.99/month premium

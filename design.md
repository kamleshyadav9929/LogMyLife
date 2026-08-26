# NOVI — Material 3 Design System (`DESIGN.md`)

---

## 1. System Philosophy & Google Pixel Quality

The NOVI design system is built entirely upon **Google Material 3 (Material You)** principles, delivering the calm, restrained, high-craft quality found in Google Pixel native software (Google Calendar, Keep, Clock, Tasks, and Settings).

### Golden Rule: CONTENT > FUNCTION > DECORATION
Every visual element must serve a distinct purpose. No decorative glassmorphism, floating neon blobs, heavy 3D drop shadows, or unprompted animations.

---

## 2. Color Architecture & Semantic Roles

NOVI uses a strictly semantic Material 3 ColorScheme. No widget or screen may hardcode raw hex values directly.

### Semantic Token Matrix

| Token | Light Mode | Dark Mode | Semantic Function |
| :--- | :--- | :--- | :--- |
| **`primary`** | `#1D4ED8` (Cobalt Indigo) | `#93C5FD` (Soft Sky) | Key primary actions, active indicators, brand accent |
| **`onPrimary`** | `#FFFFFF` | `#082F49` | Content rendered on top of `primary` |
| **`primaryContainer`** | `#EFF6FF` (Subtle Sky Tint) | `#1E3A8A` (Deep Slate Blue) | Selected chips, active destination pill, highlight cards |
| **`onPrimaryContainer`** | `#1E40AF` | `#DBEAFE` | Content rendered on `primaryContainer` |
| **`secondary`** | `#0F766E` (Botanical Sage) | `#5EEAD4` (Mint Sage) | Habits, routine badges, positive balance |
| **`onSecondary`** | `#FFFFFF` | `#042F2E` | Content rendered on `secondary` |
| **`secondaryContainer`** | `#F0FDFA` | `#134E4A` | Habit cards, routine tags |
| **`onSecondaryContainer`**| `#115E59` | `#CCFBF1` | Content on `secondaryContainer` |
| **`tertiary`** | `#D97706` (Warm Amber) | `#FCD34D` (Soft Honey) | Continuity, time warnings, focus intervals |
| **`tertiaryContainer`** | `#FEF3C7` | `#78350F` | Attention banners, streak indicators |
| **`onTertiaryContainer`** | `#92400E` | `#FDE68A` | Content on `tertiaryContainer` |
| **`error`** | `#DC2626` (Muted Crimson) | `#FCA5A5` (Soft Coral) | Missed activities, cancellations, destructive actions |
| **`onError`** | `#FFFFFF` | `#450A0A` | Content on `error` |
| **`errorContainer`** | `#FEE2E2` | `#7F1D1D` | Alert containers, interruption alerts |
| **`onErrorContainer`** | `#991B1B` | `#FEE2E2` | Content on `errorContainer` |
| **`surface`** | `#FFFFFF` (Pure Canvas) | `#0B0F19` (Deep Charcoal) | Primary background canvas |
| **`surfaceContainerLowest`**| `#FFFFFF` | `#080C14` | Recessed backgrounds |
| **`surfaceContainerLow`** | `#F8FAFC` | `#111827` | Primary card and section surface |
| **`surfaceContainer`** | `#F1F5F9` | `#1E293B` | Floating cards, modal sheets, search bars |
| **`surfaceContainerHigh`** | `#E2E8F0` | `#334155` | Elevated chips, action buttons, dialogs |
| **`surfaceContainerHighest`**| `#CBD5E1` | `#475569` | Unselected toggle tracks, strong chips |
| **`onSurface`** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary headlines, main body text |
| **`onSurfaceVariant`** | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Secondary subtitles, timestamps, placeholders |
| **`outline`** | `#CBD5E1` | `#475569` | Default 1px structural borders |
| **`outlineVariant`** | `#F1F5F9` | `#1E293B` | Hairline list dividers |

---

## 3. Typography Scale & Hierarchy

Typography creates structure and readability before color does. Most everyday UI relies cleanly on `title`, `body`, and `label`.

```text
Display:
  displayLarge:   32px / 40px line-height, SemiBold (600) — Milestones, big timer numbers
  displayMedium:  28px / 36px line-height, SemiBold (600)
  displaySmall:   24px / 32px line-height, SemiBold (600)

Headline:
  headlineLarge:  22px / 28px line-height, SemiBold (600)
  headlineMedium: 20px / 26px line-height, SemiBold (600) — Screen titles
  headlineSmall:  18px / 24px line-height, SemiBold (600)

Title:
  titleLarge:     17px / 24px line-height, SemiBold (600) — Modal headers, section headers
  titleMedium:    15px / 22px line-height, Medium (500)   — Card titles, list headings
  titleSmall:     13px / 18px line-height, Medium (500)   — Sub-group titles

Body:
  bodyLarge:      15px / 22px line-height, Regular (400)  — Primary reading text
  bodyMedium:     13px / 18px line-height, Regular (400)  — Descriptions, details
  bodySmall:      12px / 16px line-height, Regular (400)  — Caption notes

Label:
  labelLarge:     14px / 18px line-height, Medium (500)   — Button text, tab labels
  labelMedium:    12px / 16px line-height, Medium (500)   — Chips, tags, column headers
  labelSmall:     11px / 14px line-height, Medium (500)   — Timestamps, micro status indicators
```

---

## 4. Spacing Scale (8-Point Grid)

Strict adherence to standard spacing intervals ensures rhythm and breathing room:

```dart
class NoviSpacing {
  static const double space4  = 4.0;
  static const double space8  = 8.0;
  static const double space12 = 12.0;
  static const double space16 = 16.0;
  static const double space20 = 20.0;
  static const double space24 = 24.0;
  static const double space32 = 32.0;
  static const double space40 = 40.0;
  static const double space48 = 48.0;
  static const double space64 = 64.0;
}
```

---

## 5. Shape & Corner Radius Standards

NOVI balances soft squircle cards with purpose-driven pill controls.

```dart
class NoviShapes {
  static const double radiusSmall      = 8.0;   // Small badges, micro controls
  static const double radiusMedium     = 12.0;  // TextFields, action buttons
  static const double radiusCard       = 16.0;  // Standard cards, list containers
  static const double radiusLargeCard  = 20.0;  // Hero containers, section groups
  static const double radiusDialog     = 24.0;  // Confirmation dialogs
  static const double radiusSheet      = 28.0;  // Modal bottom sheets (top corners)
  static const double radiusPill       = 100.0; // Filter chips, navigation indicator, tags
}
```

---

## 6. Elevation & Depth

- **Primary Mechanism**: Tonal surface differences (`surface` vs `surfaceContainerLow` vs `surfaceContainer`).
- **Secondary Mechanism**: 1px subtle `outlineVariant` border.
- **Shadows**: Only subtle micro-shadows on floating elements (e.g. FAB, Bottom Sheets, Live Overlay). **Zero giant black drop shadows or glowing blurs.**

---

## 7. Icon System & Semantics

NOVI strictly uses **Material Symbols Rounded** (`Icons.rounded` / standard Material 3 icons).

### Semantic Icon Standardization
- Search → `Icons.search_rounded`
- Settings → `Icons.tune_rounded` or `Icons.settings_rounded`
- Add → `Icons.add_rounded`
- Delete → `Icons.delete_outline_rounded`
- Edit → `Icons.edit_outlined`
- Back → `Icons.arrow_back_rounded`
- More → `Icons.more_vert_rounded`
- Calendar / Schedule → `Icons.calendar_today_rounded` / `Icons.calendar_month_rounded`
- Focus / Timer → `Icons.timer_rounded`
- Habits / Rhythm → `Icons.repeat_rounded` / `Icons.routine_rounded`
- Insights / Trends → `Icons.insights_rounded` / `Icons.bar_chart_rounded`
- Check / Done → `Icons.check_rounded`
- Close → `Icons.close_rounded`
- Profile → `Icons.person_rounded`

---

## 8. Standard Reusable Components Catalog

Every component in NOVI strictly derives styling from `Theme.of(context)`:

1. **`NoviCard`**: Tonal background (`surfaceContainerLow`), 16dp radius, 1px `outlineVariant` border, tap ripple.
2. **`NoviButton`**: Filled (`primary`), Tonal (`secondaryContainer`), Outlined (`outline`), and Text buttons with minimum 48dp touch targets.
3. **`NoviChip`**: Filter and action pills with smooth selected/unselected state transitions.
4. **`NoviSectionHeader`**: Clean title with optional trailing "See all" or action button.
5. **`NoviEmptyState`**: Minimal, clear explanation of an empty screen with a single direct CTA.
6. **`NoviLoadingState`**: Integrated non-blocking skeleton or subtle tonal spinner.
7. **`NoviErrorState`**: Clear human explanation with a friendly "Try again" action.
8. **`NoviBanner`**: Contextual M3 notification banner (e.g., auto-shift notice with Undo).
9. **`NoviLiveTimerOverlay`**: Persistent floating bottom pill displaying active focus countdown and quick controls.
10. **`NoviModalSheet`**: Standard M3 28dp top-radius bottom sheet with drag handle.

---

## 9. Motion & Accessibility

- **Motion**: Duration 150–250ms with `Curves.easeInOutCubic` or `Curves.easeOutCubic`. Fast, purposeful, and never disorienting.
- **Accessibility**: All interactive elements have ≥ 48x48dp touch targets, WCAG 2.1 AA compliant color contrast (≥ 4.5:1 for body text, ≥ 3.0:1 for large text and icons), and full support for dynamic system font scaling.

---

*NOVI Material 3 Design System Specification finalized.*

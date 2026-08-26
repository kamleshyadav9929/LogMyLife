# Novi (Formerly LogMyLife) — Technical & UI Audit Report (`AUDIT.md`)

---

## 1. Executive Summary

This audit provides a comprehensive evaluation of the codebase architecture, data models, state flows, native bridges, user interface components, and styling conventions prior to executing the **Novi** rebrand and Material 3 design system overhaul.

---

## 2. Current Architecture & Codebase Map

The project is structured under a clean layered pattern in `lib/`:

```
lib/
├── core/
│   ├── constants/
│   │   └── app_constants.dart       # App presets, thresholds (minForegroundMs, etc.)
│   ├── database/
│   │   └── local_store.dart         # Local SharedPreferences offline store & seeder
│   └── theme/
│       └── app_theme.dart           # Legacy "Spatial" theme & AppColors
├── domain/
│   └── models/
│       └── models.dart              # Core domain entities & serialization
├── presentation/
│   ├── screens/
│   │   ├── master_dashboard_screen.dart   # Dashboard & daily briefing
│   │   ├── daily_planner_screen.dart      # Day schedule & timetable
│   │   ├── timeline_view_screen.dart      # Intent vs Reality timeline
│   │   ├── pomodoro_screen.dart           # Focus timer & interval presets
│   │   ├── habits_matrix_screen.dart      # 7-day habit matrix & streaks
│   │   ├── analytics_insights_screen.dart # Cognitive telemetry & syllabus
│   │   ├── settings_native_screen.dart    # Android permissions & settings
│   │   └── onboarding_screen.dart         # 3-step onboarding flow
│   └── widgets/
│       ├── spatial_card.dart              # Custom container with borders/shadows
│       ├── flame_streak_badge.dart        # Emoji flame streak chip
│       ├── circular_radial_gauge.dart     # Sweep-gradient canvas gauge
│       ├── add_activity_modal.dart        # Bottom sheet for activity creation
│       ├── activity_history_sheet.dart    # Occurrence reconciliation breakdown
│       ├── day_replay_sheet.dart          # Scrubbing timeline simulator
│       ├── reschedule_banner.dart         # Auto-shift undo banner
│       └── live_timer_overlay.dart        # Global floating timer bar
├── services/
│   ├── ai_insights_service.dart     # Focus scoring & daily briefing builder
│   ├── habit_engine.dart            # Streak calculations & XP progression
│   ├── native_bridge_service.dart   # Android MethodChannel platform interop
│   ├── reconciliation_engine.dart   # App usage session reconciliation
│   ├── scheduling_engine.dart       # Cascade shifts & conflict solver
│   ├── session_builder.dart         # Raw event aggregation & noise filtering
│   └── timer_engine.dart            # Live timer lifecycle & ValueNotifier
└── main.dart                        # App entry point, navigation host, theme mode
```

---

## 3. Detailed Audit by Subsystem

### A. Navigation & Routing
- **Structure**: Single `MainNavigationHost` with an `IndexedStack` hosting 7 tabs:
  1. `MasterDashboardScreen` (Overview)
  2. `DailyPlannerScreen` (Planner)
  3. `TimelineViewScreen` (Timeline)
  4. `PomodoroScreen` (Focus)
  5. `HabitsMatrixScreen` (Habits)
  6. `AnalyticsInsightsScreen` (Stats)
  7. `SettingsNativeScreen` (Settings)
- **Modals / Sheets**: Modal bottom sheets for `AddActivityModal`, `ActivityHistorySheet`, and `DayReplaySheet`.
- **Onboarding Gate**: Root `MaterialApp` renders `OnboardingScreen` if `!profile.hasCompletedOnboarding`.
- **Navigation Issues Identified**:
  - The 7-tab bottom navigation bar is visually dense and uses ad-hoc icon styling.
  - Active indicator colors and icon sizes are hardcoded in `main.dart` rather than using the centralized M3 `NavigationBarThemeData`.

### B. Screens & Feature Inventory

| Screen | Key Features | Current UX & Visual Deficiencies |
| :--- | :--- | :--- |
| **Master Dashboard** | Profile greeting, streak badge, radial gauge, AI briefing card, today's schedule snippet, active session cards, quick stats. | Ad-hoc card padding, emoji icons, hardcoded color hexes, crowded layout. |
| **Daily Planner** | Date selector (previous/next/today), Grid vs Timetable view switcher, auto-shift banner, occurrence cards with status chips, add button. | Disconnected style between timetable and grid views; buttons define custom colors inline. |
| **Timeline View** | Planned vs Reality comparison, confidence filters (All/High/Medium), Day Replay sheet trigger, session timeline list. | Visual noise in session cards; confidence tags use saturated badge colors. |
| **Pomodoro Focus** | 15/25/45/60m preset chips, radial pulsing countdown, ambient sound selector, session counter, background timer trigger. | Inconsistent pulse animation; hardcoded slate navy background container for timer digits. |
| **Habits Matrix** | 7-day trailing grid, completion checkboxes, streak counter, XP & level rewards, add habit dialog. | Emoji flames and harsh yellow/amber highlights; checkboxes lack smooth M3 micro-interactions. |
| **Insights** | Syllabus / goal progress bars, AI synchronization logs, cognitive focus score. | LinearProgressIndicator lacks M3 tonal tracks; text styles defined with raw font weights and colors. |
| **Settings** | UsageStats permission status, battery optimization exemption, raw event diagnostics log, profile card, theme mode switcher. | Switch controls and list tiles use manual custom cards instead of standard M3 `SwitchListTile` and `ListTile`. |
| **Onboarding** | 3-step PageView: Welcome, Android Permissions, Profile Goal Setup. | Slide indicators use custom animated boxes; typography lacks consistent M3 headline scaling. |

### C. State Management
- **Screen State**: Standard `StatefulWidget` with local `setState()` on data reload.
- **Global State**:
  - `TimerEngine.activeTimerNotifier` (`ValueNotifier<ActiveTimerState?>`) synchronizes live focus timer countdown across all screens and the persistent bottom overlay.
  - `LocalStore` serves as the centralized asynchronous single source of truth for persistent data.

### D. Database & Persistence Layer
- **Implementation**: `LocalStore` utilizes `SharedPreferences` with atomic JSON serialization (`Map<String, dynamic>`).
- **Data Entities**:
  - `UserProfile`, `PlannedActivity`, `ActivityOccurrence`, `ActivitySession`, `RawActivityEvent`, `InterruptionRecord`, `RescheduleEvent`, `ActivityRule`, `HabitItem`, `SubjectProgress`, `AISyncResult`, `UserCategory`.
- **Seed Fixtures**: Rich sample data populated on first launch (`_seedInitialData()`).

### E. Authentication & Profile
- Local offline profile model (`UserProfile`): name, email, targetDailyHours, currentStreak, longestStreak, xpPoints, level, onboarding flag.

### F. Reusable Widgets
- `SpatialCard`: Custom card wrapper with manual box shadows, border radius, and outline colors.
- `FlameStreakBadge`: Gamified streak chip with hardcoded amber gradients and flame emoji.
- `CircularRadialGauge`: Custom canvas painter with sweep gradient arc.
- `LiveTimerOverlay`: Global floating bar displayed above bottom navigation when timer is active.
- `RescheduleBanner`: Undo notification banner for automated timetable shifts.
- `AddActivityModal`, `ActivityHistorySheet`, `DayReplaySheet`: Specialized bottom sheets.

### G. Styling & Theme Subsystem
- **Current State**: `AppTheme` defines `lightTheme` and `darkTheme`, but screens bypass theme data and heavily rely on `AppColors` static constants (e.g. `AppColors.royalBlue`, `AppColors.flame`, `AppColors.emerald`, `AppColors.surfaceContainerLight`).
- **Typography**: Inline `TextStyle` declarations throughout with ad-hoc font sizes, weights, and colors.
- **Dark Mode**: Implemented via ternary operators (`isDark ? ... : ...`) scattered inside widget `build` methods rather than consuming `Theme.of(context).colorScheme`.

### H. Business Logic & Native Integration
- Pure functional engines for:
  - Scheduling & cascading (`SchedulingEngine`)
  - Session construction & noise filtering (`SessionBuilder`)
  - Reality reconciliation (`ReconciliationEngine`)
  - Streak computation & gamification (`HabitEngine`)
  - Focus scoring & briefing (`AIInsightsService`)
- Android native platform channel in `NativeBridgeService` communicating with Kotlin services (`UsageStatsManager`, `LogMyLifeForegroundService`).

---

## 4. Rebranding & Redesign Action Plan (Summary)

1. **Brand Transition**: Update all references, assets, copy, titles, and headers from "LogMyLife" to **Novi**.
2. **Centralized Theme**: Implement full M3 `ThemeData` (Light & Dark) in `lib/core/theme/app_theme.dart` using a calm, Pixel-inspired `ColorScheme`, standard `TextTheme`, and complete component themes (`CardThemeData`, `NavigationBarThemeData`, `FloatingActionButtonThemeData`, `InputDecorationTheme`, etc.).
3. **Component Library**: Create modular, reusable M3 components (`NoviCard`, `NoviChip`, `NoviBadge`, `NoviRadialGauge`, `NoviLiveTimerOverlay`, `NoviBanner`) that strictly consume `Theme.of(context)`.
4. **Screen-by-Screen Overhaul**: Refactor all 8 screens to use the new design system, eliminate arbitrary inline colors, refine information hierarchy, and enhance responsiveness and accessibility.
5. **Validation & Quality Assurance**: Run `flutter analyze` and `flutter test` to ensure zero regressions in logic, navigation, and state.

---

*Audit completed successfully.*

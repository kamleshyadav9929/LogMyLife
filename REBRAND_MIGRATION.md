# NOVI — Rebrand Migration & Architectural Audit Record (`REBRAND_MIGRATION.md`)

---

## 1. Migration Overview

This document serves as the formal migration record tracking the transition of the application from **LogMyLife** to **NOVI**.

---

## 2. Inventory of Changes: Keep, Remove, Refactor, Redesign

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NOVI MIGRATION MATRIX                              │
├────────────────────────────────┬────────────────────────────────────────────┤
│ 1. KEEP (Working Logic)        │ • SchedulingEngine & cascade algorithms    │
│                                │ • ReconciliationEngine & rule matchers     │
│                                │ • SessionBuilder & raw event parser        │
│                                │ • TimerEngine & ValueNotifier state        │
│                                │ • HabitEngine calculation logic            │
│                                │ • LocalStore offline persistence           │
│                                │ • NativeBridgeService & Kotlin modules     │
│                                │ • Core domain entities (models.dart)       │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 2. REMOVE (Obsolete & Legacy)  │ • All "LogMyLife" user-facing branding     │
│                                │ • XP, Level-ups, and badge gamification UI │
│                                │ • Emoji flame streak pressure chips        │
│                                │ • Legacy "SpatialCard" custom borders/glows│
│                                │ • 7-tab cluttered bottom navigation bar    │
│                                │ • Saturated neon and multi-colored chips   │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 3. REFACTOR (Architecture)     │ • Theme system → Centralized M3 ThemeData  │
│                                │ • Color palette → Semantic M3 ColorScheme  │
│                                │ • Typography → M3 TextTheme scale          │
│                                │ • Component library → Reusable NOVI M3 kit │
│                                │ • Navigation shell → Streamlined 4-area UI │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 4. REDESIGN (Presentation)     │ • "Today" (Home / Root experience)         │
│                                │ • "Schedule" (Timetable + Reality Timeline)│
│                                │ • "Focus" (Interval timer & soundscapes)   │
│                                │ • "Rhythm & Insights" (Habits & Mastery)   │
│                                │ • "Settings" (Native permissions & Theme)  │
│                                │ • "Onboarding" (Calm welcome & setup flow) │
│                                │ • Bottom sheets, modals, and live overlay  │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 3. Detailed Component Migration Mapping

| Old LogMyLife Component / Screen | NOVI Replacement | Architectural Status |
| :--- | :--- | :--- |
| `AppColors` / `AppTheme` | `NoviTheme` (`lib/core/theme/app_theme.dart`) | Complete overhaul to centralized Material 3 ColorScheme & TextTheme. |
| `SpatialCard` | `NoviCard` (`lib/presentation/widgets/novi_card.dart`) | Replaced with M3 tonal surface container and 16dp squircle radius. |
| `FlameStreakBadge` | `NoviBadge` (`lib/presentation/widgets/novi_badge.dart`) | Replaced with calm rhythm indicator; removed XP / Level hype. |
| `CircularRadialGauge` | `NoviRadialGauge` (`lib/presentation/widgets/novi_radial_gauge.dart`) | Replaced with calm dual-tone progress arc. |
| `RescheduleBanner` | `NoviBanner` (`lib/presentation/widgets/novi_banner.dart`) | Updated to M3 tonal banner with clean typography and Undo button. |
| `LiveTimerOverlay` | `NoviLiveTimer` (`lib/presentation/widgets/novi_live_timer.dart`) | Updated to elevated M3 bottom bar with pulsing status pip. |
| `MasterDashboardScreen` | `TodayScreen` / Rebranded Dashboard | Redesigned into calm daily home: Hero focus card, schedule preview, reflection. |
| `DailyPlannerScreen` + `TimelineViewScreen` | `ScheduleScreen` | Unified into a seamless dual-view (Timetable vs Reality Timeline flow). |
| `PomodoroScreen` | `FocusScreen` | Redesigned with M3 interval chips, clean countdown typography, ambient sounds. |
| `HabitsMatrixScreen` + `AnalyticsInsightsScreen` | `RhythmInsightsScreen` | Combined into calm routine check-ins, syllabus progress, and focus telemetry. |
| `SettingsNativeScreen` | `SettingsScreen` | Redesigned with standard M3 `SwitchListTile`, profile header, theme switcher. |
| `OnboardingScreen` | `OnboardingScreen` | Redesigned into 3-step calm welcome, native permissions, and daily goal setup. |

---

## 4. Technical Migration Notes & Safety Safeguards

1. **Zero Database Breakages**:
   - `LocalStore` key names remain compatible so existing user preferences and data persist smoothly.
   - Profile structure maintains `hasCompletedOnboarding` and goal settings without corruption.
2. **Platform Channel Integrity**:
   - `NativeBridgeService` method names (`hasUsageStatsPermission`, `startForegroundTimer`, `queryRawUsageEvents`) remain identical, preserving 100% interoperability with Android Kotlin services.
3. **Continuous Analysis & Verification**:
   - Every file edit strictly complies with `flutter_lints` rules.
   - `flutter analyze` and `flutter test` must pass with zero errors at each milestone.

---

## 5. Implementation Roadmap (Phases 6–14) — 100% COMPLETE

- [x] **Phase 6**: Implement centralized NOVI Material 3 `ThemeData` system (`lib/core/theme/app_theme.dart`).
- [x] **Phase 7**: Implement reusable NOVI M3 component system (`lib/presentation/widgets/`).
- [x] **Phase 8**: Refactor global navigation host (`lib/main.dart`) to the new 4-destination architecture.
- [x] **Phase 9**: Redesign "Today" (Home / Root) screen (`lib/presentation/screens/master_dashboard_screen.dart`).
- [x] **Phase 10**: Redesign "Schedule" (`daily_planner_screen.dart`), "Focus" (`pomodoro_screen.dart`), "Rhythms & Insights" (`habits_matrix_screen.dart`), "Settings" (`settings_native_screen.dart`), and "Onboarding" (`onboarding_screen.dart`).
- [x] **Phase 11**: Polish modals, bottom sheets (`add_activity_modal.dart`, `activity_history_sheet.dart`, `day_replay_sheet.dart`), and the live timer overlay (`novi_live_timer.dart`).
- [x] **Phase 12**: Accessibility, dark mode, and responsive layout validation.
- [x] **Phase 13**: Clean up legacy code, add backward-compatibility aliases, and verify zero obsolete branding in UI.
- [x] **Phase 14**: Run final `flutter analyze` (0 issues) and `flutter test` (all tests passed) quality checks.

---

*Migration completed successfully.*


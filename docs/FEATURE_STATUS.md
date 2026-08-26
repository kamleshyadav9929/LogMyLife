# NOVI — Feature Status Matrix

| Feature | UI | Logic | Persistence | Native | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Focus Timer (Solo Flow)** | ✓ | ✓ | ✓ | ✓ | **WORKING** | State machine (`IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`, `CANCELLED`). Wall-clock timestamp elapsed calculation, survives app restart and backgrounding. |
| **Foreground Timer Service** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Android `ForegroundService` with `WakeLock`, live countdown notification, and stop/finish action intents. |
| **Native Notifications** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Dual channels (`focus_timer`, `completion`). Handles Android 13+ `POST_NOTIFICATIONS` runtime permission. |
| **Notification Settings UX** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Settings switches control focus completion, schedule reminders, and daily summary alerts with system permission status sync. |
| **App Usage Tracking** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Android `UsageStatsManager` queries actual raw usage events. Fallback empty state when permission is off with zero fake data. |
| **App Usage Permission Flow** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Lifecycle observer (`WidgetsBindingObserver`) auto-detects permission grant upon returning from Android Settings. |
| **Privacy & Data Model** | ✓ | ✓ | ✓ | N/A | **WORKING** | 100% on-device processing disclosure. Explicit details on what is collected, why, and where it is stored. |
| **Schedule / Planner (CRUD)** | ✓ | ✓ | ✓ | N/A | **WORKING** | Create, edit, delete, reschedule, and complete occurrences with full date navigation across past and future dates. |
| **Focus ↔ Schedule Link** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Starting focus from scheduled activity binds `occurrenceId`, marks completion, saves session, and awards XP. |
| **Cascade Auto-Rescheduling** | ✓ | ✓ | ✓ | N/A | **WORKING** | Shifts dependent non-fixed activities on early/late start with full undo audit trail. |
| **Rhythms & Habit Streaks** | ✓ | ✓ | ✓ | N/A | **WORKING** | Streaks computed strictly from actual `completedDates`. Meaningful empty state when no routines exist. |
| **Syllabus & Mastery Tracks** | ✓ | ✓ | ✓ | N/A | **WORKING** | Learning tracks with target vs. completed hours tracking and full CRUD persistence. |
| **AI Insights Engine** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Metrics derived strictly from persisted sessions, occurrences, habits, and real usage events. Clean empty state for insufficient data. |
| **Multi-Session Plans** | ✓ | ✓ | ✓ | ✓ | **WORKING** | Guided focus blocks with structured step progression and smart recovery breaks. |
| **Ambient Sound Mixer** | ✓ | ✓ | ✓ | N/A | **WORKING** | 6-channel multitrack mixer (Rain, Brown noise, Cafe, Waves, Forest, Fireplace) with custom preset persistence. |
| **Theme & Dark Mode** | ✓ | ✓ | ✓ | N/A | **WORKING** | Light / Dark / AMOLED Zen themes with smooth system transitions. |
| **Data Backup & JSON Export** | ✓ | ✓ | ✓ | N/A | **WORKING** | Full database JSON export, clipboard copy, and atomic import/restore. |
| **Responsive Zero-Overflow** | ✓ | ✓ | ✓ | N/A | **WORKING** | Tested across 360px–600px widths with flexible layouts, constrained containers, and ellipsis handling. |
| **Offline-First Resilience** | ✓ | ✓ | ✓ | N/A | **WORKING** | Zero internet dependency for any core tracking, scheduling, focus, or insights feature. |

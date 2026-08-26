# LogMyLife — Native Activity Tracker & Session Builder Specification

Covers Master Spec §9–11, §31 (Phases 3–4). Depends on the Planner/
Scheduling spec (ActivityOccurrence model) and precedes the
Reconciliation Engine, which is out of scope for this document.

---

## PART A — Native Activity Tracker (Android)

### A.1 Purpose
Collect raw app-usage evidence from Android `UsageStatsManager` /
`UsageEvents` and hand it to the app layer as a normalized event
stream. The tracker never decides what an event *means* — it only
observes and reports.

### A.2 Architecture Boundary
```
Android UsageStatsManager / UsageEvents
        │
        ▼
Native Activity Collector (Kotlin/Java native module)
        │  normalized events only — no business logic here
        ▼
Bridge to RN (event stream / periodic pull)
        │
        ▼
Raw Event Store (SQLite — see Part B)
```
Rule: the native collector must be isolated behind a clean interface.
No scheduling, classification, or notification logic lives in the
native layer — it only emits events.

### A.3 Collection Strategy
- **No always-running JS polling loop.** The collector runs natively
  and reconciles periodically (e.g. via `WorkManager` periodic task
  or on app-foreground/interval triggers), respecting Android
  background/battery constraints.
- Query `UsageEvents` for the window since the last successful
  collection checkpoint, not the full history each time.
- Persist a `lastCollectedAt` checkpoint so collection resumes
  correctly after app restart.

### A.4 Event Contract
```
RawActivityEvent {
  eventId: string          // deterministic: hash(packageName + timestamp + eventType)
  packageName: string
  eventType: "MOVE_TO_FOREGROUND" | "MOVE_TO_BACKGROUND" | "SCREEN_ON"
           | "SCREEN_OFF" | "DEVICE_UNLOCKED" | "UNKNOWN"
  timestamp: number         // device event time (ms epoch)
  source: "usage_stats" | "system"
  deviceState: "active" | "locked" | "idle" | "unknown"
  receivedAt: number        // ms epoch when the app actually recorded it
}
```
`eventId` must be deterministic so re-querying the same Android event
twice never creates a duplicate row (see A.7).

### A.5 Permission Onboarding
- Usage Access is a special permission requiring the user to navigate
  to system settings — it cannot be requested via a normal runtime
  permission dialog.
- On first run (or whenever tracking is off), show a clear screen
  explaining *why* Usage Access is needed and deep-link to the
  settings screen (`ACTION_USAGE_ACCESS_SETTINGS`).
- Do not claim tracking is active until the permission is confirmed
  granted (check `AppOpsManager` / attempt a query and verify
  non-empty capability, not just "user tapped continue").

### A.6 Tracking Health States
```
TrackingHealth = "active" | "permission_denied" | "unavailable" | "degraded"
```
| State | Trigger | UI behavior |
|---|---|---|
| `active` | Permission granted, recent events collected successfully | No banner |
| `permission_denied` | Usage Access revoked or never granted | Persistent banner + "Enable Tracking" action; manual planner/timer still fully usable |
| `unavailable` | Permission granted but no events collected for a meaningful period (e.g. > 2h) with no plausible reason | Banner: tracking may be unavailable |
| `degraded` | Battery restrictions likely delaying collection (heuristic: checkpoint gap growing while app backgrounded) | Soft banner, lower urgency |

Never claim `active` state without a genuinely recent successful
collection. When in doubt, degrade the displayed status rather than
overstate it (Golden Rule: never fake precision).

### A.7 Deduplication at Collection Time
- Before inserting a `RawActivityEvent`, check `eventId` against
  already-stored events in the relevant time window.
- Android's `UsageEvents` query can return overlapping windows across
  collection runs — dedupe is mandatory, not optional.

### A.8 Edge Cases (Tracker Layer)
| Case | Expected behavior |
|---|---|
| Permission revoked mid-session | Stop new collection attempts, set health = `permission_denied`, keep existing data intact |
| Permission re-granted | Resume from last checkpoint, set health = `active` after first successful collection |
| Device reboot | Checkpoint persists; on next collection, gap before reboot is preserved as unknown, not backfilled |
| Clock changed (backward/forward jump) | Detect jump > threshold (e.g. 5 min) between `receivedAt` deltas vs `timestamp` deltas; flag suspicious events, do not silently trust them |
| Timezone changed | Store `timestamp` as UTC epoch ms always; render in local time only at display layer |
| Battery saver / Doze | Collection may lag — this is expected; reflect via `degraded` health, not an error state |
| App killed by OS mid-collection | Next run resumes from last committed checkpoint; partial batch is never treated as complete |

---

## PART B — Session Builder

### B.1 Purpose
Convert the raw, noisy `RawActivityEvent` stream into clean, immutable
`ActivitySession` records — the foundation the Reconciliation Engine
consumes later.

### B.2 Pipeline
```
RAW EVENTS (chronological, deduped)
   │
   ▼
1. Normalize timestamps (UTC ms)
   ▼
2. Remove duplicate events (by eventId)
   ▼
3. Validate package/source (drop malformed/unrecognized entries, keep evidence log)
   ▼
4. Debounce very short switches (see B.4)
   ▼
5. SESSION BUILDER
   - open session on MOVE_TO_FOREGROUND
   - update session while same package stays foreground
   - close session on MOVE_TO_BACKGROUND / SCREEN_OFF / DEVICE locked
   ▼
IMMUTABLE ActivitySession records
```

### B.3 Session Record
```
ActivitySession {
  id: string
  sourceType: "AUTO" | "TIMER" | "SYSTEM" | "MANUAL_CORRECTION"
  packageName: string | null       // null for TIMER/SYSTEM sessions
  plannedOccurrenceId: string | null
  startedAt: number
  endedAt: number | null           // null while session is still open
  durationSeconds: number | null   // computed on close, never mutated after
  confidence: "high" | "medium" | "unknown"
  classification: string | null    // category, if assigned
  createdAt: number
}
```
Rule: once `endedAt` is set, the session is closed and immutable.
Corrections happen via a separate `UserCorrection` record referencing
the session — never by mutating the closed session in place.

### B.4 Debounce Policy
- A foreground period shorter than a configurable minimum (default:
  3 seconds) does not open a session on its own.
- If the same package re-enters foreground within a short gap
  (default: 2 seconds) after backgrounding, treat it as a continuation
  of the same session rather than closing + reopening — this absorbs
  rapid A→A flicker from Android's event stream.
- Genuine rapid A→B→A switching (different packages) creates separate
  bounded sessions; only merge if a later policy explicitly allows it
  (do not merge by default — Golden Rule: don't fake precision).

### B.5 Foreground/Background Determination Rules
| Signal | Session effect |
|---|---|
| `MOVE_TO_FOREGROUND` | Open (or continue) session for that package |
| `MOVE_TO_BACKGROUND` | Close session |
| `SCREEN_OFF` | Close any open session immediately, regardless of package state |
| `DEVICE_UNLOCKED` after `SCREEN_OFF` | Does not reopen the prior session — a new foreground event is required |
| Notification received, app not opened | No session — notifications are not usage |
| Background audio/video continues after backgrounding | No foreground session continues by default; do not count as active use |
| Phone call | Recorded as a `SYSTEM` source session, not attributed as productive or distracting |

### B.6 Idle / Lock Handling
- `deviceState: "locked"` or `"idle"` at time of an event means no
  new session opens even if a `MOVE_TO_FOREGROUND`-like signal is
  present (defensive check — should not normally happen, but don't
  trust a single signal in isolation).
- An open session must close the moment `SCREEN_OFF` is observed,
  even if no `MOVE_TO_BACKGROUND` event arrived first.

### B.7 Unknown Package Handling
- If `packageName` doesn't resolve to a known/installed app label,
  still create the session with `classification: null`,
  `confidence: "unknown"`. Preserve the raw package identifier.
  Never drop the evidence.

### B.8 Idempotency
- Session building must be safe to re-run over the same raw event
  window without creating duplicate sessions.
- Use a deterministic session key derived from
  `(packageName, startedAt)` to detect "this session was already
  built" before inserting.
- If the builder crashes mid-batch, the next run must detect
  partially-built (open, never-closed) sessions from a prior run and
  either close them using available evidence or leave them open —
  never duplicate them.

### B.9 Edge Cases (Session Builder Layer)
| Case | Expected behavior |
|---|---|
| App opens for 1 second then closes | Debounced — no session, or a sub-threshold session marked low-confidence per policy |
| Rapid A→B→A within seconds | Two or more bounded sessions; no forced merge |
| Screen locked mid-use | Close session at lock instant, not at next event |
| Very long session (e.g. > 6h) | Allowed, but flagged for review — Android can misreport in rare cases; don't silently cap or fabricate |
| Session crosses midnight | Store as one session by UTC timestamps; render split by local calendar day only at display time, never split the underlying record |
| Duplicate raw events reach the builder | Deduped upstream (A.7) but builder must also be defensively idempotent (B.8) |
| Builder runs twice over the same window | Zero new sessions created the second time — fully idempotent |

---

## C — Handoff to Reconciliation (Out of Scope Here)

This spec produces clean `ActivitySession` rows. The Reconciliation
Engine (Master Spec §12–13, §31) later matches sessions against
`ActivityOccurrence` records using confidence rules. Do not build any
planned-vs-discovered matching logic here — Part A and B only observe
and structure raw reality.

---

## D — Antigravity Build Order

1. Native module: `UsageStatsManager` query wrapper + permission check.
2. `RawActivityEvent` table + checkpoint persistence + dedup (A.7).
3. Permission onboarding screen + `TrackingHealth` state derivation (A.5–A.6).
4. `ActivitySession` table + Session Builder pipeline (B.2–B.6).
5. Idempotency layer (B.8) — test by re-running the builder over fixed fixtures.
6. Unit tests for every row in tables A.8 and B.9 using deterministic fake event fixtures (no real device/clock dependency).
7. Manual device tests: permission revoke/re-grant, reboot, battery saver, screen lock during active session.

# LogMyLife — Scheduling Engine Specification (Planner Core)

Target: React Native, Android native module for UsageStatsManager.
This document defines the data model, rules, and algorithm for the
Dynamic Scheduling Engine (Master Spec §6, §19–20, §31–32). Antigravity
should implement directly from this — no ambiguity should be left to
interpretation.

---

## 1. Data Model

```
PlannedActivity {
  id: string                     // stable UUID, never reused
  title: string
  startAt: ISOString
  endAt: ISOString
  durationSeconds: number
  type: "normal" | "timerRequired" | "fixed" | "recurring"
  timerRequired: boolean
  fixed: boolean                 // true = cannot be auto-shifted
  minimumCompletionPercent: number   // default 80
  recurrenceId: string | null
  status: "scheduled" | "started" | "completed" | "incomplete" | "cancelled"
  createdAt: ISOString
  updatedAt: ISOString
}

ActivityOccurrence {              // one instance of a (possibly recurring) activity
  id: string
  plannedActivityId: string
  occurrenceDate: string          // YYYY-MM-DD, local
  plannedStart: ISOString
  plannedEnd: ISOString
  status: "scheduled" | "active" | "completed" | "incomplete" | "missed"
}

RescheduleEvent {                 // immutable audit trail — never edited or deleted
  id: string
  occurrenceId: string
  oldStart: ISOString
  oldEnd: ISOString
  newStart: ISOString
  newEnd: ISOString
  reason: "early_start" | "late_start" | "cascade" | "manual" | "conflict_resolution"
  createdAt: ISOString
}
```

Rule: `RescheduleEvent` rows are append-only. The current `plannedStart`/
`plannedEnd` on `ActivityOccurrence` is always the latest state; history
lives entirely in `RescheduleEvent`.

---

## 2. Core Invariants (must hold after every scheduling operation)

1. A `fixed` occurrence's `plannedStart`/`plannedEnd` never changes as a
   side effect of another activity's timer or cascade.
2. Two movable occurrences must never end up with overlapping
   `[plannedStart, plannedEnd)` ranges after a cascade completes.
3. Every shift produces exactly one `RescheduleEvent` row per occurrence
   moved — never zero (untracked move) and never duplicated.
4. Duration is preserved across a shift unless the user explicitly
   changes it (`newEnd - newStart == oldEnd - oldStart` for early/late
   start cases).
5. The cascade algorithm terminates in bounded iterations (see §5) —
   it must never loop indefinitely.
6. Running the same cascade computation twice with the same inputs
   produces the same output (deterministic, not order-dependent on
   anything but occurrence start time).

---

## 3. Trigger: Timer Start (Early / Late)

Input: `occurrence`, `actualStartAt`.

```
delta = actualStartAt - occurrence.plannedStart   // can be negative (early) or positive (late)

if delta == 0:
    no reschedule needed
    return

if occurrence.fixed:
    // fixed occurrences can still be manually timer-started early/late,
    // but this does NOT move the occurrence itself — record actual
    // session times separately from planned times. Do not reschedule.
    return

newStart = actualStartAt
newEnd   = newStart + occurrence.duration   // duration preserved

proposedShift = { occurrenceId: occurrence.id, newStart, newEnd,
                   reason: delta < 0 ? "early_start" : "late_start" }

runCascade([proposedShift])   // see §5
```

---

## 4. Determining "Movable" Candidates for Cascade

After the direct shift above, any *other* occurrence on the same local
day that is:
- not `fixed`, AND
- its current `[plannedStart, plannedEnd)` now overlaps the shifted
  occurrence's new range

...is a cascade candidate. Only same-day occurrences are considered;
cross-midnight cascades are out of scope for V1 (see edge case list,
§8).

---

## 5. Cascade Algorithm (Dry-Run First)

The engine must support computing a **proposed** set of shifts without
committing them (dry-run), so the UI can preview before the user
confirms. Commit is a separate, second step that replays the same
proposal transactionally.

```
function computeCascade(initialShift, allOccurrencesToday):
    MAX_ITERATIONS = 20            // guard against runaway cascades
    proposals = [initialShift]
    processed = Set()
    iterations = 0

    queue = [initialShift]

    while queue is not empty:
        iterations += 1
        if iterations > MAX_ITERATIONS:
            return { status: "unresolved", proposals, reason: "max_iterations_exceeded" }

        current = queue.pop(0)
        processed.add(current.occurrenceId)

        overlapping = find occurrences in allOccurrencesToday where:
            occurrence.id not in processed AND
            rangesOverlap(occurrence.plannedStart, occurrence.plannedEnd,
                          current.newStart, current.newEnd)

        for occ in overlapping (sorted by plannedStart ascending):
            if occ.fixed:
                // cannot move a fixed event — try to slot the CURRENT
                // (non-fixed) shift after the fixed event instead
                afterFixedStart = occ.plannedEnd
                afterFixedEnd = afterFixedStart + current.duration
                if afterFixedEnd <= current.originalWindow.end:  // still same day / valid window
                    current.newStart = afterFixedStart
                    current.newEnd = afterFixedEnd
                    // re-check for new overlaps caused by this adjustment
                    queue.push(current)
                else:
                    return { status: "conflict", proposals,
                             conflictWith: occ.id,
                             reason: "no_valid_slot_before_fixed_event" }
                continue

            // occ is movable: shift it to start right after `current` ends
            shiftedOcc = {
                occurrenceId: occ.id,
                newStart: current.newEnd,
                newEnd: current.newEnd + occ.duration,
                reason: "cascade"
            }
            proposals.push(shiftedOcc)
            queue.push(shiftedOcc)

    return { status: "ok", proposals }
```

Key points for Antigravity:
- `rangesOverlap` uses half-open intervals `[start, end)` so
  back-to-back activities (A ends exactly when B starts) do **not**
  count as overlapping.
- If `computeCascade` returns `status: "conflict"`, the UI must show
  an explicit conflict — never silently drop or overlap the activity.
- Commit step: once the user confirms (or auto-confirm is enabled),
  write all `proposals` as updated `ActivityOccurrence` rows AND one
  `RescheduleEvent` row per proposal, inside a single DB transaction
  (all-or-nothing — Master Spec §36).

---

## 6. One-Tap "Start Now"

Must call the exact same entry point as §3 (timer start), passing
`actualStartAt = now()`. Do not implement a second code path — this
is a common source of divergent bugs (spec §21).

---

## 7. Idempotency on Reconciliation Replay

If the app restarts mid-cascade-commit (crash recovery):
- Check whether `RescheduleEvent` rows for this `proposals` batch
  already exist (use a deterministic batch/proposal id, not just
  occurrence id, to detect partial commits).
- If a partial commit is detected, resume by writing only the missing
  rows — never re-apply shifts that already landed (would double-shift
  the occurrence).

---

## 8. Edge Cases This Algorithm Must Handle

| Case | Expected behavior |
|---|---|
| Timer starts 30 min early, no downstream conflicts | Simple shift, no cascade needed |
| Timer starts late, cascades into a fixed event | Movable event slots after fixed event if room exists, else conflict |
| Two movable activities both need to shift | Cascade processes in start-time order, each pushed after the previous |
| No valid slot exists anywhere in the day | Return `status: "conflict"`, surface to user, do not force a shift |
| User manually drags an activity (not timer-triggered) | Same cascade function, `reason: "manual"` |
| Occurrence is `fixed` and user tries to timer-start early | Session recorded, but occurrence itself does not move |
| App crash mid-commit | Resume via idempotency check (§7), never double-apply |
| Two cascades computed back-to-back before first commits | Second dry-run must read against *proposed* state of the first if chained, or be rejected/recomputed if the first hasn't committed yet — avoid stale-read shifts |

---

## 9. What Antigravity Should Build, In Order

1. `PlannedActivity` / `ActivityOccurrence` / `RescheduleEvent` tables + migrations.
2. `rangesOverlap`, `findNextValidSlot` pure helper functions (unit-testable in isolation).
3. `computeCascade` (dry-run, pure function — no DB writes).
4. `commitCascade` (transactional writer, calls `computeCascade` then persists).
5. Wire timer-start and "Start Now" to call `commitCascade`.
6. Manual drag-to-reschedule UI calls the same `computeCascade`/`commitCascade` pair.
7. Unit tests for every row in the edge-case table above, using deterministic fake occurrences (no real clock/timers).

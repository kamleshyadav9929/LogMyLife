# LogMyLife — Reconciliation Engine Specification

Covers Master Spec §12–13, §31–32 (Phase 5). Depends on:
- Planner/Scheduling spec (ActivityOccurrence, RescheduleEvent)
- Native Tracker + Session Builder spec (ActivitySession, RawActivityEvent)

This is the engine that decides how discovered `ActivitySession`
records relate to planned `ActivityOccurrence` records — without ever
inventing a relationship that isn't backed by explicit evidence.

---

## 1. Core Principle

Planner intent and automatic discovery are separate by default. A
session only becomes associated with a planned occurrence when a
**high-confidence rule** explicitly says so. Everything else stays
independent — visible, but not credited toward completion.

---

## 2. Confidence Levels

```
Confidence = "high" | "medium" | "unknown"
```

| Level | Meaning | Effect on completion |
|---|---|---|
| `high` | Explicit rule or direct timer binding | Counts toward `validDuration` / completion |
| `medium` | Plausible signal (e.g. package commonly tagged to this category, overlapping time window) but no explicit binding | Visible in diagnostics/insights only — never auto-credited |
| `unknown` | No matching rule, no timer binding | Shown as unclassified discovered activity |

Only two things ever produce `high` confidence:
1. A session created with `sourceType: "TIMER"`, directly bound to the
   occurrence that owns the timer.
2. A session matching an explicit `ActivityRule` the user created
   (e.g. "sessions from package `com.vscode` between 18:00–20:00 count
   toward 'DSA'").

---

## 3. ActivityRule Model
```
ActivityRule {
  id: string
  targetId: string           // plannedActivityId this rule feeds
  ruleType: "package_match" | "package_and_time_window" | "category_match"
  ruleValue: string           // e.g. package name, or JSON window spec
  confidence: "high"          // rules only ever produce high-confidence matches by design
  createdAt: number
  createdBy: "user"           // rules are always explicit user actions in V1 — never auto-generated
}
```
Rule: `ActivityRule` rows are never system-generated in V1. Auto-rule
suggestion is an AI/insights feature explicitly out of V1 scope
(Master Spec §0).

---

## 4. Reconciliation Algorithm

Runs per chronological time segment, matching the Master Spec §31
outline, expanded here with concrete matching logic.

```
function reconcileSegment(session: ActivitySession, occurrencesToday: ActivityOccurrence[], rules: ActivityRule[]):

    // Step 1 — TIMER sessions are already bound; nothing to match
    if session.sourceType == "TIMER":
        session.confidence = "high"
        session.plannedOccurrenceId already set at session creation
        return session

    // Step 2 — SYSTEM sessions (calls, etc.) never auto-bind to a planned activity
    if session.sourceType == "SYSTEM":
        session.confidence = "unknown"
        session.plannedOccurrenceId = null
        return session

    // Step 3 — AUTO sessions: check explicit high-confidence rules first
    matchingRule = rules.find(r =>
        r.ruleType matches session.packageName (and time window, if applicable))

    if matchingRule:
        session.confidence = "high"
        session.plannedOccurrenceId = matchingRule.targetOccurrenceIdForToday
        session.classification = matchingRule.targetId
        return session

    // Step 4 — no rule: check if session overlaps a planned occurrence in time only
    overlapping = occurrencesToday.find(o =>
        rangesOverlap(session.startedAt, session.endedAt, o.plannedStart, o.plannedEnd))

    if overlapping:
        // time overlap alone is NEVER enough for high confidence —
        // this is the case from Master Spec §12 (Instagram during planned Project)
        session.confidence = "medium"
        session.plannedOccurrenceId = null       // still NOT bound
        session.classification = "unexpected_activity"
        session.relatedOccurrenceId = overlapping.id   // for diagnostics/notification context only
        return session

    // Step 5 — no rule, no overlap
    session.confidence = "unknown"
    session.plannedOccurrenceId = null
    session.classification = null
    return session
```

Key point: `relatedOccurrenceId` (step 4) is a *diagnostic* pointer
used only to power the "This happened during your planned DSA
session" notification (§05.1 of the Notification spec) — it must
never be read by the completion-percentage calculation. Only
`plannedOccurrenceId` (set exclusively via TIMER binding or an
explicit rule) counts toward completion.

---

## 5. Completion Calculation

```
function calculateCompletion(occurrence: ActivityOccurrence):
    highConfidenceSessions = sessions where plannedOccurrenceId == occurrence.id
                                        and confidence == "high"

    validDurationSeconds = sum(session.durationSeconds for session in highConfidenceSessions)
                            minus qualifying interruption time (see §6)

    requiredSeconds = occurrence.durationSeconds * occurrence.minimumCompletionPercent

    if validDurationSeconds >= requiredSeconds:
        status = "completed"
    else:
        status = "incomplete"

    overtimeSeconds = max(0, validDurationSeconds - occurrence.durationSeconds)

    return { validDurationSeconds, status, overtimeSeconds }
```
This must be re-derivable from stored sessions at any time — never
store completion as an independently-mutable counter (Golden Rule,
Master Spec §28).

---

## 6. Interruption Handling

An interruption is a `medium`/`unknown` session that occurs **inside**
the time span of an active `TIMER` session for another occurrence.

```
function detectInterruption(timerSession, autoSessionsDuringTimer):
    for autoSession in autoSessionsDuringTimer:
        gapDuration = autoSession.durationSeconds
        if gapDuration < INTERRUPTION_THRESHOLD_SECONDS (default 60s):
            // too short to matter — ignore silently, do not create an interruption record
            continue
        create InterruptionRecord {
            timerSessionId: timerSession.id,
            autoSessionId: autoSession.id,
            startedAt: autoSession.startedAt,
            endedAt: autoSession.endedAt,
            durationSeconds: gapDuration
        }
        // subtract this duration from the timer's validDuration calculation
```
This directly implements the Master Spec §14 example: DSA 10:00–10:27,
WhatsApp interruption 10:27–10:31, DSA resumes 10:31–11:00 → valid DSA
time = 56m, WhatsApp = 4m recorded separately, not silently absorbed
into DSA's duration and not silently discarded either.

---

## 7. Idempotency

Reconciliation must be safe to re-run over the same sessions:
- Each `(sessionId, occurrenceId)` match is deterministic given the
  same rules and same session data — re-running produces the same
  `confidence`/`plannedOccurrenceId` assignment, not a new one.
- Store a `reconciledAt` timestamp on the session; re-running updates
  fields in place, it never creates a second reconciliation row per
  session.
- If an `ActivityRule` is added or edited *after* sessions already
  exist, a re-reconciliation pass over historical sessions is a
  deliberate user-triggered action ("Apply rule to past sessions?")
  — not automatic, since retroactively changing completion history
  silently would violate the "never silently rewrite history" rule.

---

## 8. Edge Cases

| Case | Expected behavior |
|---|---|
| Session time-overlaps a planned occurrence but has no rule | `medium` confidence, never auto-credited (Master Spec §12) |
| Two occurrences overlap in time and a session overlaps both | Session gets `relatedOccurrenceId` pointing to diagnostics only for both if needed; still not credited to either without a rule/timer |
| User adds a rule after the fact | Existing sessions unaffected until user explicitly requests re-reconciliation |
| Timer session itself has zero valid duration recorded (immediate stop) | `status = "incomplete"`, `validDurationSeconds = 0`, no crash/divide-by-zero |
| Interruption exactly at threshold boundary (e.g. 60s) | Use `>=` consistently — document and test the boundary explicitly |
| Multiple short interruptions during one timer session | Each recorded separately if above threshold; sum subtracted from valid duration |
| Session's package matches a rule, but session started before the rule existed | Rule applies based on current rule set at reconciliation time, not retroactively re-run automatically (see §7) |
| Occurrence deleted after sessions already reconciled to it | Sessions retain `plannedOccurrenceId` as historical record; occurrence itself is soft-referenced, not cascsäded-deleted (ties into Planner spec's "preserve historical identity" rule) |
| Unknown package with no classification, never becomes high confidence | Stays visible as unclassified discovered activity indefinitely, never silently dropped |

---

## 9. What Reconciliation Must Never Do

- Never assign `medium`/`unknown` confidence sessions to completion
  calculations, even temporarily.
- Never auto-create an `ActivityRule` — rules are always explicit
  user actions in V1.
- Never silently re-run and change historical completion percentages
  without an explicit user-triggered re-reconciliation action.
- Never treat time-overlap alone as proof of relevance — this is the
  single most important rule in this document (Master Spec §12).

---

## 10. Antigravity Build Order

1. `ActivityRule` table + simple rule CRUD (user-created only, V1 scope: package match and package+time-window).
2. `reconcileSegment` as a pure function — unit-testable against fixture sessions/occurrences/rules, no DB access inside the function itself.
3. Wire TIMER session creation to directly set `plannedOccurrenceId`/`confidence: high` at creation (bypasses the matching logic entirely, per §4 Step 1).
4. `calculateCompletion` as a pure function, re-derivable on demand — do not cache without an invalidation strategy tied to session/interruption changes.
5. Interruption detection (§6), wired to run whenever a TIMER session closes or an overlapping AUTO session closes.
6. Idempotency layer (§7): `reconciledAt` tracking, re-run tests.
7. Unit tests for every row in §8's edge case table using deterministic fixtures.
8. Wire reconciliation output into the Notification Engine's "Unexpected Activity" trigger (uses `relatedOccurrenceId`, never `plannedOccurrenceId`, for that specific notification).

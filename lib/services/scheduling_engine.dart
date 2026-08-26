import '../domain/models/models.dart';
import '../core/database/local_store.dart';

/// LogMyLife Scheduling & Cascade Engine
/// Implements logmylife-scheduling-spec.md and Master Spec §13.

class CascadeResult {
  final bool hasConflict;
  final String? conflictWith;
  final List<RescheduleChange> changes;
  final List<ActivityOccurrence> updatedOccurrences;

  CascadeResult({
    required this.hasConflict,
    this.conflictWith,
    required this.changes,
    required this.updatedOccurrences,
  });
}

class SchedulingEngine {
  /// Pure function: Computes cascade shift for subsequent occurrences when an activity shifts
  static CascadeResult computeCascade({
    required ActivityOccurrence targetOccurrence,
    required DateTime newStart,
    required DateTime newEnd,
    required List<ActivityOccurrence> allOccurrencesToday,
    required RescheduleReason reason,
  }) {
    final sorted = List<ActivityOccurrence>.from(allOccurrencesToday)
      ..sort((a, b) => a.plannedStart.compareTo(b.plannedStart));

    final targetIndex = sorted.indexWhere((o) => o.id == targetOccurrence.id);
    if (targetIndex < 0) {
      return CascadeResult(
        hasConflict: false,
        changes: [],
        updatedOccurrences: allOccurrencesToday,
      );
    }

    final changes = <RescheduleChange>[];
    final updatedList = List<ActivityOccurrence>.from(allOccurrencesToday);

    // 1. Record target occurrence shift
    final oldStart = targetOccurrence.plannedStart;
    final oldEnd = targetOccurrence.plannedEnd;

    final targetDurationSeconds = newEnd.difference(newStart).inSeconds;

    final updatedTarget = targetOccurrence.copyWith(
      plannedStart: newStart,
      plannedEnd: newEnd,
      durationSeconds: targetDurationSeconds,
    );

    final targetIdxInAll = updatedList.indexWhere((o) => o.id == targetOccurrence.id);
    if (targetIdxInAll >= 0) {
      updatedList[targetIdxInAll] = updatedTarget;
    }

    changes.add(RescheduleChange(
      occurrenceId: targetOccurrence.id,
      oldStart: oldStart,
      oldEnd: oldEnd,
      newStart: newStart,
      newEnd: newEnd,
    ));

    // 2. Cascade subsequent items
    DateTime currentCursor = newEnd;
    bool conflict = false;
    String? conflictWith;

    for (int i = targetIndex + 1; i < sorted.length; i++) {
      final occ = sorted[i];

      // If occurrence was scheduled after old cursor, check if new cursor pushes into it
      if (currentCursor.isAfter(occ.plannedStart)) {
        if (occ.fixed) {
          // Hard conflict: Cannot push fixed events
          conflict = true;
          conflictWith = occ.parentActivityTitle ?? occ.id;
          break;
        }

        final duration = occ.plannedEnd.difference(occ.plannedStart);
        final nextStart = currentCursor.add(const Duration(minutes: 5)); // 5 min buffer
        final nextEnd = nextStart.add(duration);

        final occIdx = updatedList.indexWhere((o) => o.id == occ.id);
        if (occIdx >= 0) {
          updatedList[occIdx] = occ.copyWith(
            plannedStart: nextStart,
            plannedEnd: nextEnd,
          );
        }

        changes.add(RescheduleChange(
          occurrenceId: occ.id,
          oldStart: occ.plannedStart,
          oldEnd: occ.plannedEnd,
          newStart: nextStart,
          newEnd: nextEnd,
        ));

        currentCursor = nextEnd;
      }
    }

    return CascadeResult(
      hasConflict: conflict,
      conflictWith: conflictWith,
      changes: changes,
      updatedOccurrences: updatedList,
    );
  }

  /// Applies cascade and writes RescheduleEvent audit trail
  static Future<RescheduleEvent?> applyReschedule({
    required ActivityOccurrence targetOccurrence,
    required DateTime newStart,
    required DateTime newEnd,
    required RescheduleReason reason,
  }) async {
    final todayStr = targetOccurrence.occurrenceDate;
    final allToday = await LocalStore.getOccurrences(todayStr);

    final cascade = computeCascade(
      targetOccurrence: targetOccurrence,
      newStart: newStart,
      newEnd: newEnd,
      allOccurrencesToday: allToday,
      reason: reason,
    );

    await LocalStore.saveOccurrences(cascade.updatedOccurrences);

    final eventId = 'resched_${DateTime.now().millisecondsSinceEpoch}';
    final rescheduleEvent = RescheduleEvent(
      id: eventId,
      causeOccurrenceId: targetOccurrence.id,
      oldStart: targetOccurrence.plannedStart,
      oldEnd: targetOccurrence.plannedEnd,
      newStart: newStart,
      newEnd: newEnd,
      reason: reason,
      changes: cascade.changes,
      status: RescheduleStatus.active,
    );

    await LocalStore.addRescheduleEvent(rescheduleEvent);
    return rescheduleEvent;
  }

  /// Undoes a previous reschedule event completely
  static Future<bool> undoReschedule(String rescheduleEventId) async {
    final allEvents = await LocalStore.getRescheduleEvents();
    final eventIdx = allEvents.indexWhere((e) => e.id == rescheduleEventId);
    if (eventIdx < 0) return false;

    final event = allEvents[eventIdx];
    if (event.status == RescheduleStatus.undone) return false;

    final allOccurrences = await LocalStore.getOccurrences();
    final occMap = {for (final o in allOccurrences) o.id: o};

    for (final change in event.changes) {
      final occ = occMap[change.occurrenceId];
      if (occ != null) {
        occMap[change.occurrenceId] = occ.copyWith(
          plannedStart: change.oldStart,
          plannedEnd: change.oldEnd,
          durationSeconds: change.oldEnd.difference(change.oldStart).inSeconds,
        );
      }
    }

    await LocalStore.saveOccurrences(occMap.values.toList());

    allEvents[eventIdx] = event.copyWith(
      status: RescheduleStatus.undone,
      inverseAppliedAt: DateTime.now(),
    );
    await LocalStore.saveRescheduleEvents(allEvents);

    return true;
  }
}

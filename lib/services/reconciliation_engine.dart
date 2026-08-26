import '../core/constants/app_constants.dart';
import '../domain/models/models.dart';

/// LogMyLife Reconciliation Engine
/// Implements logmylife-reconciliation-spec.md and Master Spec §12-§13.

class CompletionStats {
  final int validDurationSeconds;
  final int overtimeSeconds;
  final double completionPercentage;
  final bool isCompleted;

  CompletionStats({
    required this.validDurationSeconds,
    required this.overtimeSeconds,
    required this.completionPercentage,
    required this.isCompleted,
  });
}

class ReconciliationEngine {
  /// Pure function: Reconciles an ActivitySession against planned occurrences and explicit rules
  static ActivitySession reconcileSegment({
    required ActivitySession session,
    required List<ActivityOccurrence> occurrencesToday,
    required List<ActivityRule> rules,
  }) {
    // Step 1: TIMER sessions are already bound by definition
    if (session.sourceType == SessionSourceType.timer) {
      return session.copyWith(
        confidence: ConfidenceLevel.high,
        reconciledAt: DateTime.now().millisecondsSinceEpoch,
      );
    }

    // Step 2: SYSTEM sessions never auto-bind
    if (session.sourceType == SessionSourceType.system) {
      return session.copyWith(
        confidence: ConfidenceLevel.unknown,
        plannedOccurrenceId: null,
        reconciledAt: DateTime.now().millisecondsSinceEpoch,
      );
    }

    // Step 3: Check explicit user rules
    if (session.packageName != null && session.packageName!.isNotEmpty) {
      final sessionStartHour = DateTime.fromMillisecondsSinceEpoch(session.startedAt).hour;

      for (final rule in rules) {
        bool isMatch = false;

        if (rule.ruleType == RuleType.packageMatch) {
          isMatch = rule.ruleValue.toLowerCase() == session.packageName!.toLowerCase();
        } else if (rule.ruleType == RuleType.packageAndTimeWindow) {
          final isPkgMatch = rule.ruleValue.toLowerCase() == session.packageName!.toLowerCase();
          final startH = rule.startHour ?? 0;
          final endH = rule.endHour ?? 24;
          final isInWindow = sessionStartHour >= startH && sessionStartHour <= endH;
          isMatch = isPkgMatch && isInWindow;
        }

        if (isMatch) {
          // Find matching occurrence for today
          final targetOcc = occurrencesToday.firstWhere(
            (o) => o.plannedActivityId == rule.targetId,
            orElse: () => occurrencesToday.first,
          );

          return session.copyWith(
            confidence: ConfidenceLevel.high,
            plannedOccurrenceId: targetOcc.id,
            classification: targetOcc.categoryId,
            reconciledAt: DateTime.now().millisecondsSinceEpoch,
          );
        }
      }
    }

    // Step 4: Check time overlap only (Never auto-credited; medium confidence diagnostic pointer)
    final sessionStart = session.startedAt;
    final sessionEnd = session.endedAt ?? session.startedAt;

    for (final occ in occurrencesToday) {
      final occStart = occ.plannedStart.millisecondsSinceEpoch;
      final occEnd = occ.plannedEnd.millisecondsSinceEpoch;

      final overlaps = sessionStart < occEnd && sessionEnd > occStart;
      if (overlaps) {
        return session.copyWith(
          confidence: ConfidenceLevel.medium,
          plannedOccurrenceId: null, // Critical: Not credited to completion
          relatedOccurrenceId: occ.id,
          classification: 'unexpected_activity',
          reconciledAt: DateTime.now().millisecondsSinceEpoch,
        );
      }
    }

    // Step 5: No rule, no overlap -> unknown
    return session.copyWith(
      confidence: ConfidenceLevel.unknown,
      plannedOccurrenceId: null,
      classification: null,
      reconciledAt: DateTime.now().millisecondsSinceEpoch,
    );
  }

  /// Calculates actual completion percentage and status for an occurrence
  static CompletionStats calculateCompletion({
    required ActivityOccurrence occurrence,
    required List<ActivitySession> sessions,
    required List<InterruptionRecord> interruptions,
    int minimumCompletionPercent = 80,
  }) {
    // 1. Filter sessions with high confidence bound to this occurrence
    final highConfidenceSessions = sessions.where(
      (s) => s.plannedOccurrenceId == occurrence.id && s.confidence == ConfidenceLevel.high,
    );

    int grossDurationSeconds = 0;
    final timerSessionIds = <String>{};

    for (final s in highConfidenceSessions) {
      grossDurationSeconds += s.durationSeconds ?? 0;
      if (s.sourceType == SessionSourceType.timer) {
        timerSessionIds.add(s.id);
      }
    }

    // 2. Subtract qualifying interruptions during active timer sessions
    int totalInterruptionDeductions = 0;
    for (final intr in interruptions) {
      if (timerSessionIds.contains(intr.timerSessionId)) {
        if (intr.durationSeconds >= AppConstants.interruptionThresholdSeconds) {
          totalInterruptionDeductions += intr.durationSeconds;
        }
      }
    }

    final validDuration = (grossDurationSeconds - totalInterruptionDeductions).clamp(0, 999999);
    final targetDuration = occurrence.durationSeconds;
    final requiredDuration = (targetDuration * (minimumCompletionPercent / 100.0)).round();

    final isCompleted = validDuration >= requiredDuration;
    final overtimeSeconds = (validDuration - targetDuration).clamp(0, 999999);
    final pct = targetDuration > 0 ? (validDuration / targetDuration) * 100.0 : 0.0;

    return CompletionStats(
      validDurationSeconds: validDuration,
      overtimeSeconds: overtimeSeconds,
      completionPercentage: pct,
      isCompleted: isCompleted,
    );
  }

  /// Detects interruptions (>= 60s) inside a live or past timer session
  static List<InterruptionRecord> detectInterruptions({
    required ActivitySession timerSession,
    required List<ActivitySession> autoSessionsDuringTimer,
  }) {
    final results = <InterruptionRecord>[];
    final timerStart = timerSession.startedAt;
    final timerEnd = timerSession.endedAt ?? DateTime.now().millisecondsSinceEpoch;

    for (final autoSession in autoSessionsDuringTimer) {
      if (autoSession.id == timerSession.id) continue;

      final autoStart = autoSession.startedAt;
      final autoEnd = autoSession.endedAt ?? autoStart;

      // Check overlap inside timer span
      final overlapStart = autoStart > timerStart ? autoStart : timerStart;
      final overlapEnd = autoEnd < timerEnd ? autoEnd : timerEnd;

      if (overlapEnd > overlapStart) {
        final durationSeconds = ((overlapEnd - overlapStart) / 1000).round();
        if (durationSeconds >= AppConstants.interruptionThresholdSeconds) {
          results.add(InterruptionRecord(
            id: 'intr_${overlapStart}_${autoSession.packageName ?? 'app'}',
            timerSessionId: timerSession.id,
            autoSessionId: autoSession.id,
            startedAt: overlapStart,
            endedAt: overlapEnd,
            durationSeconds: durationSeconds,
          ));
        }
      }
    }

    return results;
  }
}

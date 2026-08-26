import 'dart:async';
import 'package:flutter/foundation.dart';
import '../domain/models/models.dart';
import '../domain/models/focus_models.dart';
import '../core/database/local_store.dart';
import 'native_bridge_service.dart';
import 'scheduling_engine.dart';
import 'reconciliation_engine.dart';

/// NOVI — Production Focus Pro & Deep Work Timer Engine
/// Resilient state machine (IDLE, RUNNING, PAUSED, COMPLETED, CANCELLED).
/// Calculates exact elapsed duration using wall-clock timestamps.
/// Persists active timer state to survive backgrounding, process recreation, and app restarts.

@immutable
class ActiveTimerState {
  final String occurrenceId;
  final String title;
  final DateTime startTime;
  final DateTime lastResumeTime;
  final int accumulatedElapsedSeconds;
  final int targetDurationSeconds;
  final int elapsedSeconds;
  final TimerEngineStatus status;
  final String sessionId;
  final FocusSessionMode mode;
  final String? intentionText;
  final FocusPlan? activePlan;
  final int activePlanStepIndex;
  final int pauseCount;
  final SoundscapeMix? soundMix;

  const ActiveTimerState({
    required this.occurrenceId,
    required this.title,
    required this.startTime,
    required this.lastResumeTime,
    this.accumulatedElapsedSeconds = 0,
    required this.targetDurationSeconds,
    this.elapsedSeconds = 0,
    this.status = TimerEngineStatus.idle,
    required this.sessionId,
    this.mode = FocusSessionMode.standard,
    this.intentionText,
    this.activePlan,
    this.activePlanStepIndex = 0,
    this.pauseCount = 0,
    this.soundMix,
  });

  bool get isRunning => status == TimerEngineStatus.running;
  bool get isPaused => status == TimerEngineStatus.paused;
  bool get isBreak => mode == FocusSessionMode.smartBreak || (activePlan != null && activePlan!.steps[activePlanStepIndex].isBreak);

  int calculateElapsed(DateTime now) {
    if (status == TimerEngineStatus.running) {
      final runningDeltaSec = now.difference(lastResumeTime).inSeconds.clamp(0, 86400 * 7);
      return accumulatedElapsedSeconds + runningDeltaSec;
    }
    return accumulatedElapsedSeconds;
  }

  ActiveTimerSnapshot toSnapshot() {
    return ActiveTimerSnapshot(
      occurrenceId: occurrenceId,
      title: title,
      startTimeEpochMs: startTime.millisecondsSinceEpoch,
      lastResumeTimeEpochMs: lastResumeTime.millisecondsSinceEpoch,
      accumulatedElapsedSeconds: accumulatedElapsedSeconds,
      targetDurationSeconds: targetDurationSeconds,
      sessionId: sessionId,
      status: status,
      mode: mode,
      intentionText: intentionText,
      pauseCount: pauseCount,
      soundMix: soundMix,
      activePlan: activePlan,
      activePlanStepIndex: activePlanStepIndex,
    );
  }

  ActiveTimerState copyWith({
    String? occurrenceId,
    String? title,
    DateTime? startTime,
    DateTime? lastResumeTime,
    int? accumulatedElapsedSeconds,
    int? targetDurationSeconds,
    int? elapsedSeconds,
    TimerEngineStatus? status,
    bool? isRunning,
    bool? isPaused,
    String? sessionId,
    FocusSessionMode? mode,
    String? intentionText,
    FocusPlan? activePlan,
    int? activePlanStepIndex,
    int? pauseCount,
    SoundscapeMix? soundMix,
  }) {
    TimerEngineStatus newStatus = status ?? this.status;
    if (isRunning != null) {
      newStatus = isRunning ? TimerEngineStatus.running : (isPaused == true ? TimerEngineStatus.paused : TimerEngineStatus.idle);
    } else if (isPaused != null) {
      newStatus = isPaused ? TimerEngineStatus.paused : TimerEngineStatus.running;
    }

    return ActiveTimerState(
      occurrenceId: occurrenceId ?? this.occurrenceId,
      title: title ?? this.title,
      startTime: startTime ?? this.startTime,
      lastResumeTime: lastResumeTime ?? this.lastResumeTime,
      accumulatedElapsedSeconds: accumulatedElapsedSeconds ?? this.accumulatedElapsedSeconds,
      targetDurationSeconds: targetDurationSeconds ?? this.targetDurationSeconds,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      status: newStatus,
      sessionId: sessionId ?? this.sessionId,
      mode: mode ?? this.mode,
      intentionText: intentionText ?? this.intentionText,
      activePlan: activePlan ?? this.activePlan,
      activePlanStepIndex: activePlanStepIndex ?? this.activePlanStepIndex,
      pauseCount: pauseCount ?? this.pauseCount,
      soundMix: soundMix ?? this.soundMix,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ActiveTimerState &&
        other.occurrenceId == occurrenceId &&
        other.title == title &&
        other.startTime == startTime &&
        other.lastResumeTime == lastResumeTime &&
        other.accumulatedElapsedSeconds == accumulatedElapsedSeconds &&
        other.targetDurationSeconds == targetDurationSeconds &&
        other.elapsedSeconds == elapsedSeconds &&
        other.status == status &&
        other.sessionId == sessionId &&
        other.mode == mode &&
        other.intentionText == intentionText &&
        other.activePlan == activePlan &&
        other.activePlanStepIndex == activePlanStepIndex &&
        other.pauseCount == pauseCount &&
        other.soundMix == soundMix;
  }

  @override
  int get hashCode => Object.hash(
        occurrenceId,
        title,
        startTime,
        lastResumeTime,
        accumulatedElapsedSeconds,
        targetDurationSeconds,
        elapsedSeconds,
        status,
        sessionId,
        mode,
        intentionText,
        activePlan,
        activePlanStepIndex,
        pauseCount,
        soundMix,
      );
}

class FocusCompletionEvent {
  final CompletionStats stats;
  final String sessionId;
  final String occurrenceId;
  final String taskTitle;
  final String? intentionText;
  final int durationSeconds;
  final int pauseCount;
  final FocusSessionMode mode;

  const FocusCompletionEvent({
    required this.stats,
    required this.sessionId,
    required this.occurrenceId,
    required this.taskTitle,
    this.intentionText,
    required this.durationSeconds,
    required this.pauseCount,
    this.mode = FocusSessionMode.standard,
  });
}

class TimerEngine {
  static ActiveTimerState? _activeTimer;
  static Timer? _ticker;
  static final ValueNotifier<ActiveTimerState?> activeTimerNotifier = ValueNotifier<ActiveTimerState?>(null);

  // Stream for timer completion events
  static final StreamController<CompletionStats> _completionStreamController = StreamController<CompletionStats>.broadcast();
  static Stream<CompletionStats> get onTimerCompleted => _completionStreamController.stream;

  // Stream for rich Focus Pro completion events
  static final StreamController<FocusCompletionEvent> _focusCompletionStreamController = StreamController<FocusCompletionEvent>.broadcast();
  static Stream<FocusCompletionEvent> get onFocusProCompleted => _focusCompletionStreamController.stream;

  static ActiveTimerState? get activeTimer => _activeTimer;

  /// Initializes and restores persistent timer state from LocalStore on app launch / resume
  static Future<void> init() async {
    final snapshot = await LocalStore.getActiveTimerSnapshot();
    if (snapshot == null) return;

    final now = DateTime.now();
    final elapsed = snapshot.calculateCurrentElapsed(now);

    // If target duration already reached in background, auto-complete
    if (elapsed >= snapshot.targetDurationSeconds) {
      final state = ActiveTimerState(
        occurrenceId: snapshot.occurrenceId,
        title: snapshot.title,
        startTime: DateTime.fromMillisecondsSinceEpoch(snapshot.startTimeEpochMs),
        lastResumeTime: DateTime.fromMillisecondsSinceEpoch(snapshot.lastResumeTimeEpochMs),
        accumulatedElapsedSeconds: snapshot.accumulatedElapsedSeconds,
        targetDurationSeconds: snapshot.targetDurationSeconds,
        elapsedSeconds: snapshot.targetDurationSeconds,
        status: TimerEngineStatus.completed,
        sessionId: snapshot.sessionId,
        mode: snapshot.mode,
        intentionText: snapshot.intentionText,
        pauseCount: snapshot.pauseCount,
        soundMix: snapshot.soundMix,
        activePlan: snapshot.activePlan,
        activePlanStepIndex: snapshot.activePlanStepIndex,
      );
      _activeTimer = state;
      activeTimerNotifier.value = state;
      await stopTimer();
      return;
    }

    _activeTimer = ActiveTimerState(
      occurrenceId: snapshot.occurrenceId,
      title: snapshot.title,
      startTime: DateTime.fromMillisecondsSinceEpoch(snapshot.startTimeEpochMs),
      lastResumeTime: snapshot.status == TimerEngineStatus.running ? now : DateTime.fromMillisecondsSinceEpoch(snapshot.lastResumeTimeEpochMs),
      accumulatedElapsedSeconds: elapsed,
      targetDurationSeconds: snapshot.targetDurationSeconds,
      elapsedSeconds: elapsed,
      status: snapshot.status,
      sessionId: snapshot.sessionId,
      mode: snapshot.mode,
      intentionText: snapshot.intentionText,
      pauseCount: snapshot.pauseCount,
      soundMix: snapshot.soundMix,
      activePlan: snapshot.activePlan,
      activePlanStepIndex: snapshot.activePlanStepIndex,
    );
    activeTimerNotifier.value = _activeTimer;

    if (_activeTimer!.isRunning) {
      _startLocalTicker();
    }
  }

  /// App lifecycle listener to sync elapsed time accurately when returning from background
  static void handleAppLifecycleResumed() {
    if (_activeTimer != null && _activeTimer!.isRunning) {
      final now = DateTime.now();
      final currentElapsed = _activeTimer!.calculateElapsed(now);
      _activeTimer = _activeTimer!.copyWith(elapsedSeconds: currentElapsed);
      activeTimerNotifier.value = _activeTimer;

      if (currentElapsed >= _activeTimer!.targetDurationSeconds) {
        stopTimer();
      }
    }
  }

  static Future<void> startTimer(
    ActivityOccurrence occurrence, {
    FocusSessionMode mode = FocusSessionMode.standard,
    String? intentionText,
    SoundscapeMix? soundMix,
    FocusPlan? plan,
    int planStepIndex = 0,
  }) async {
    if (_activeTimer != null) {
      await stopTimer();
    }

    final now = DateTime.now();
    final plannedStart = occurrence.plannedStart;
    final diffMinutes = now.difference(plannedStart).inMinutes;

    // Auto-reschedule if early start or late start > 5 mins
    if (diffMinutes.abs() >= 5) {
      final reason = diffMinutes < 0 ? RescheduleReason.earlyStart : RescheduleReason.lateStart;
      final newEnd = now.add(Duration(seconds: occurrence.durationSeconds));
      try {
        await SchedulingEngine.applyReschedule(
          targetOccurrence: occurrence,
          newStart: now,
          newEnd: newEnd,
          reason: reason,
        );
      } catch (e) {
        debugPrint('Auto-reschedule non-fatal warning: $e');
      }
    }

    final sessionId = 'sess_${now.millisecondsSinceEpoch}_timer';
    final title = occurrence.parentActivityTitle ?? 'Focus Activity';

    final session = ActivitySession(
      id: sessionId,
      sourceType: SessionSourceType.timer,
      packageName: null,
      appName: title,
      plannedOccurrenceId: occurrence.id,
      startedAt: now.millisecondsSinceEpoch,
      confidence: ConfidenceLevel.high,
      classification: occurrence.categoryId,
    );
    await LocalStore.upsertSession(session);

    final updatedOcc = occurrence.copyWith(status: OccurrenceStatus.active);
    await LocalStore.upsertOccurrence(updatedOcc);

    // Save initial intention if provided
    if (intentionText != null && intentionText.trim().isNotEmpty) {
      final intentionRecord = FocusIntentionRecord(
        id: 'intent_${now.millisecondsSinceEpoch}',
        sessionId: sessionId,
        occurrenceId: occurrence.id,
        taskTitle: title,
        intentionText: intentionText.trim(),
        status: IntentionStatus.pending,
        createdAt: now.millisecondsSinceEpoch,
      );
      await LocalStore.saveFocusIntention(intentionRecord);
    }

    final initialCompleted = occurrence.completedSeconds;

    _activeTimer = ActiveTimerState(
      occurrenceId: occurrence.id,
      title: title,
      startTime: now,
      lastResumeTime: now,
      accumulatedElapsedSeconds: initialCompleted,
      targetDurationSeconds: occurrence.durationSeconds,
      elapsedSeconds: initialCompleted,
      status: TimerEngineStatus.running,
      sessionId: sessionId,
      mode: mode,
      intentionText: intentionText,
      activePlan: plan,
      activePlanStepIndex: planStepIndex,
      pauseCount: 0,
      soundMix: soundMix,
    );
    activeTimerNotifier.value = _activeTimer;

    await LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());

    try {
      await NativeBridgeService.startForegroundTimer(
        title: title,
        durationSeconds: occurrence.durationSeconds,
        elapsedSeconds: initialCompleted,
      );
    } catch (e) {
      debugPrint('Native foreground timer non-fatal: $e');
    }

    _startLocalTicker();
  }

  static Future<void> startCustomFocusTimer({
    required String title,
    required int durationSeconds,
    String? categoryId,
    FocusSessionMode mode = FocusSessionMode.standard,
    String? intentionText,
    SoundscapeMix? soundMix,
  }) async {
    final now = DateTime.now();
    final todayStr = LocalStore.getTodayDateStr();
    final occId = 'occ_${todayStr}_focus_${now.millisecondsSinceEpoch}';

    final occurrence = ActivityOccurrence(
      id: occId,
      plannedActivityId: 'plan_focus_${now.millisecondsSinceEpoch}',
      occurrenceDate: todayStr,
      plannedStart: now,
      plannedEnd: now.add(Duration(seconds: durationSeconds)),
      durationSeconds: durationSeconds,
      timerRequired: true,
      fixed: false,
      status: OccurrenceStatus.active,
      categoryId: categoryId ?? 'cat_work',
      parentActivityTitle: title,
    );

    await LocalStore.upsertOccurrence(occurrence);
    await startTimer(
      occurrence,
      mode: mode,
      intentionText: intentionText,
      soundMix: soundMix,
    );
  }

  /// Start a guided multi-session plan
  static Future<void> startMultiSessionPlan(FocusPlan plan) async {
    if (plan.steps.isEmpty) return;
    final firstStep = plan.steps.first;
    final now = DateTime.now();
    final todayStr = LocalStore.getTodayDateStr();
    final occId = 'occ_${todayStr}_plan_${now.millisecondsSinceEpoch}';

    final occurrence = ActivityOccurrence(
      id: occId,
      plannedActivityId: 'plan_multiblock_${now.millisecondsSinceEpoch}',
      occurrenceDate: todayStr,
      plannedStart: now,
      plannedEnd: now.add(Duration(minutes: plan.totalMinutes)),
      durationSeconds: firstStep.durationMinutes * 60,
      timerRequired: true,
      fixed: false,
      status: OccurrenceStatus.active,
      categoryId: plan.categoryId,
      parentActivityTitle: '${plan.title}: ${firstStep.title}',
    );

    await LocalStore.upsertOccurrence(occurrence);
    await startTimer(
      occurrence,
      mode: firstStep.isBreak ? FocusSessionMode.smartBreak : FocusSessionMode.multiSessionPlan,
      plan: plan,
      planStepIndex: 0,
    );
  }

  /// Start a smart recovery break
  static Future<void> startSmartBreak({
    required int durationSeconds,
    required String taskTitle,
    String? occurrenceId,
  }) async {
    final now = DateTime.now();
    final todayStr = LocalStore.getTodayDateStr();
    final occId = occurrenceId ?? 'occ_${todayStr}_break_${now.millisecondsSinceEpoch}';

    final occurrence = ActivityOccurrence(
      id: occId,
      plannedActivityId: 'plan_break_${now.millisecondsSinceEpoch}',
      occurrenceDate: todayStr,
      plannedStart: now,
      plannedEnd: now.add(Duration(seconds: durationSeconds)),
      durationSeconds: durationSeconds,
      timerRequired: false,
      fixed: false,
      status: OccurrenceStatus.active,
      categoryId: 'cat_leisure',
      parentActivityTitle: 'Recovery: $taskTitle',
    );

    await LocalStore.upsertOccurrence(occurrence);
    await startTimer(occurrence, mode: FocusSessionMode.smartBreak);
  }

  static void setSoundMix(SoundscapeMix mix) {
    if (_activeTimer == null) return;
    _activeTimer = _activeTimer!.copyWith(soundMix: mix);
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void setFocusMode(FocusSessionMode mode) {
    if (_activeTimer == null) return;
    _activeTimer = _activeTimer!.copyWith(mode: mode);
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void updateIntention(String intention) {
    if (_activeTimer == null) return;
    _activeTimer = _activeTimer!.copyWith(intentionText: intention);
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void pauseTimer() {
    if (_activeTimer == null || !_activeTimer!.isRunning) return;
    _ticker?.cancel();

    final now = DateTime.now();
    final currentElapsed = _activeTimer!.calculateElapsed(now);

    _activeTimer = _activeTimer!.copyWith(
      status: TimerEngineStatus.paused,
      accumulatedElapsedSeconds: currentElapsed,
      elapsedSeconds: currentElapsed,
      pauseCount: _activeTimer!.pauseCount + 1,
    );
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void resumeTimer() {
    if (_activeTimer == null || _activeTimer!.isRunning) return;
    final now = DateTime.now();

    _activeTimer = _activeTimer!.copyWith(
      status: TimerEngineStatus.running,
      lastResumeTime: now,
    );
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());

    _startLocalTicker();
  }

  static void extendTimer(int additionalSeconds) {
    if (_activeTimer == null) return;
    _activeTimer = _activeTimer!.copyWith(
      targetDurationSeconds: _activeTimer!.targetDurationSeconds + additionalSeconds,
    );
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void resetTimer() {
    if (_activeTimer == null) return;
    final now = DateTime.now();
    _activeTimer = _activeTimer!.copyWith(
      accumulatedElapsedSeconds: 0,
      elapsedSeconds: 0,
      lastResumeTime: now,
    );
    activeTimerNotifier.value = _activeTimer;
    LocalStore.saveActiveTimerSnapshot(_activeTimer!.toSnapshot());
  }

  static void _startLocalTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (_activeTimer != null && _activeTimer!.isRunning) {
        final now = DateTime.now();
        final currentElapsed = _activeTimer!.calculateElapsed(now);

        _activeTimer = _activeTimer!.copyWith(elapsedSeconds: currentElapsed);
        activeTimerNotifier.value = _activeTimer;

        // Auto-complete when target duration is reached
        if (currentElapsed >= _activeTimer!.targetDurationSeconds) {
          final stats = await stopTimer();
          if (stats != null) {
            _completionStreamController.add(stats);
          }
        }
      }
    });
  }

  static Future<CompletionStats?> stopTimer({
    bool isCancelled = false,
    String? stopReason,
    bool forceCompleted = false,
  }) async {
    if (_activeTimer == null) return null;

    _ticker?.cancel();
    final now = DateTime.now();
    final currentTimer = _activeTimer!;
    final sessionId = currentTimer.sessionId;
    final occurrenceId = currentTimer.occurrenceId;
    final finalDuration = isCancelled ? currentTimer.elapsedSeconds : currentTimer.calculateElapsed(now);
    final title = currentTimer.title;
    final intention = currentTimer.intentionText;
    final pauseCount = currentTimer.pauseCount;
    final mode = currentTimer.mode;

    try {
      await NativeBridgeService.stopForegroundTimer();
    } catch (e) {
      debugPrint('Native stop foreground timer non-fatal: $e');
    }

    // Close session in DB
    final allSessions = await LocalStore.getActivitySessions();
    final sessionIdx = allSessions.indexWhere((s) => s.id == sessionId);
    if (sessionIdx >= 0) {
      final s = allSessions[sessionIdx];
      final closedSession = s.copyWith(
        endedAt: now.millisecondsSinceEpoch,
        durationSeconds: finalDuration,
      );
      allSessions[sessionIdx] = closedSession;
      await LocalStore.saveActivitySessions(allSessions);
    }

    // Record interruption if early stop reason was provided
    if (stopReason != null && stopReason.isNotEmpty) {
      final intrRecord = InterruptionRecord(
        id: 'intr_${now.millisecondsSinceEpoch}',
        timerSessionId: sessionId,
        autoSessionId: 'manual_early_stop',
        startedAt: now.millisecondsSinceEpoch,
        endedAt: now.millisecondsSinceEpoch,
        durationSeconds: 0,
        cause: stopReason,
      );
      await LocalStore.addInterruption(intrRecord);
    }

    // Reconcile and calculate completion
    final occurrences = await LocalStore.getOccurrences();
    final occIdx = occurrences.indexWhere((o) => o.id == occurrenceId);
    CompletionStats? stats;

    if (occIdx >= 0) {
      final occ = occurrences[occIdx];
      final interruptions = await LocalStore.getInterruptions();
      final freshSessions = await LocalStore.getActivitySessions();

      stats = ReconciliationEngine.calculateCompletion(
        occurrence: occ,
        sessions: freshSessions,
        interruptions: interruptions,
      );

      final isComplete = forceCompleted || (stats.isCompleted && !isCancelled);
      final newStatus = isComplete ? OccurrenceStatus.completed : OccurrenceStatus.active;

      occurrences[occIdx] = occ.copyWith(
        status: newStatus,
        completedSeconds: finalDuration,
        lastInterruptionReason: stopReason ?? occ.lastInterruptionReason,
      );
      await LocalStore.saveOccurrences(occurrences);

      if (isComplete) {
        final profile = await LocalStore.getUserProfile();
        final updatedProfile = profile.copyWith(
          xpPoints: profile.xpPoints + 150,
          level: ((profile.xpPoints + 150) / 400).floor() + 1,
        );
        await LocalStore.saveUserProfile(updatedProfile);

        // Native completion notification
        final notifPrefs = await LocalStore.getNotificationPreferences();
        if (notifPrefs.focusSessionCompletion) {
          try {
            await NativeBridgeService.showCompletionNotification(
              title: title,
              message: '$title completed! Great focus flow.',
            );
          } catch (e) {
            debugPrint('Native completion notification non-fatal: $e');
          }
        }
      }
    }

    // Clear persisted snapshot
    await LocalStore.clearActiveTimerSnapshot();

    _activeTimer = null;
    activeTimerNotifier.value = null;

    if (stats != null && !isCancelled && (forceCompleted || stats.isCompleted)) {
      _focusCompletionStreamController.add(
        FocusCompletionEvent(
          stats: stats,
          sessionId: sessionId,
          occurrenceId: occurrenceId,
          taskTitle: title,
          intentionText: intention,
          durationSeconds: finalDuration,
          pauseCount: pauseCount,
          mode: mode,
        ),
      );
    }

    return stats;
  }

  static Future<void> cancelTimer() async {
    await stopTimer(isCancelled: true);
  }
}

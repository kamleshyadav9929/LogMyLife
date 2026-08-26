import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logmylife/core/database/local_store.dart';
import 'package:logmylife/domain/models/focus_models.dart';
import 'package:logmylife/services/timer_engine.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStore.init();
    if (TimerEngine.activeTimer != null) {
      await TimerEngine.cancelTimer();
    }
  });

  tearDown(() async {
    if (TimerEngine.activeTimer != null) {
      await TimerEngine.cancelTimer();
    }
  });

  group('Focus Timer State Machine & Persistence Tests', () {
    test('Timer starts, transitions through states, and updates LocalStore', () async {
      final occurrences = await LocalStore.getOccurrences();
      final targetOcc = occurrences.first;

      final statesEmitted = <ActiveTimerState?>[];
      void listener() {
        statesEmitted.add(TimerEngine.activeTimerNotifier.value);
      }

      TimerEngine.activeTimerNotifier.addListener(listener);

      await TimerEngine.startTimer(targetOcc);

      expect(TimerEngine.activeTimer, isNotNull);
      expect(TimerEngine.activeTimer!.occurrenceId, targetOcc.id);
      expect(TimerEngine.activeTimer!.status, TimerEngineStatus.running);
      expect(TimerEngine.activeTimer!.isRunning, isTrue);
      expect(TimerEngine.activeTimer!.isPaused, isFalse);
      expect(statesEmitted.isNotEmpty, isTrue);

      // Verify snapshot saved in LocalStore
      final snapshot = await LocalStore.getActiveTimerSnapshot();
      expect(snapshot, isNotNull);
      expect(snapshot!.occurrenceId, targetOcc.id);
      expect(snapshot.status, TimerEngineStatus.running);

      // Pause
      TimerEngine.pauseTimer();
      expect(TimerEngine.activeTimer!.status, TimerEngineStatus.paused);
      expect(TimerEngine.activeTimer!.isPaused, isTrue);
      expect(TimerEngine.activeTimer!.isRunning, isFalse);

      final pausedSnapshot = await LocalStore.getActiveTimerSnapshot();
      expect(pausedSnapshot!.status, TimerEngineStatus.paused);

      // Resume
      TimerEngine.resumeTimer();
      expect(TimerEngine.activeTimer!.status, TimerEngineStatus.running);
      expect(TimerEngine.activeTimer!.isRunning, isTrue);
      expect(TimerEngine.activeTimer!.isPaused, isFalse);

      // Extend
      final prevTarget = TimerEngine.activeTimer!.targetDurationSeconds;
      TimerEngine.extendTimer(300);
      expect(TimerEngine.activeTimer!.targetDurationSeconds, prevTarget + 300);

      // Reset
      TimerEngine.resetTimer();
      expect(TimerEngine.activeTimer!.accumulatedElapsedSeconds, 0);

      // Stop & Clear Snapshot
      final stats = await TimerEngine.stopTimer();
      expect(TimerEngine.activeTimer, isNull);
      expect(TimerEngine.activeTimerNotifier.value, isNull);
      expect(stats, isNotNull);

      final clearedSnapshot = await LocalStore.getActiveTimerSnapshot();
      expect(clearedSnapshot, isNull);

      TimerEngine.activeTimerNotifier.removeListener(listener);
    });

    test('Timestamp calculation accounts for wall-clock delta correctly', () {
      final startTime = DateTime(2026, 8, 26, 10, 0, 0);
      final lastResume = DateTime(2026, 8, 26, 10, 10, 0);

      final state = ActiveTimerState(
        occurrenceId: 'occ_1',
        title: 'Deep Architecture Flow',
        startTime: startTime,
        lastResumeTime: lastResume,
        accumulatedElapsedSeconds: 600, // 10 minutes already accumulated
        targetDurationSeconds: 1800,
        status: TimerEngineStatus.running,
        sessionId: 'sess_1',
      );

      // 5 minutes later in wall-clock time
      final now = DateTime(2026, 8, 26, 10, 15, 0);
      final elapsed = state.calculateElapsed(now);

      // 600s + 300s = 900s
      expect(elapsed, 900);
    });

    test('ActiveTimerSnapshot computes background elapsed time accurately', () {
      final startTimeEpoch = DateTime(2026, 8, 26, 10, 0, 0).millisecondsSinceEpoch;
      final lastResumeEpoch = DateTime(2026, 8, 26, 10, 10, 0).millisecondsSinceEpoch;

      final snapshot = ActiveTimerSnapshot(
        occurrenceId: 'occ_1',
        title: 'Deep Architecture Flow',
        startTimeEpochMs: startTimeEpoch,
        lastResumeTimeEpochMs: lastResumeEpoch,
        accumulatedElapsedSeconds: 600,
        targetDurationSeconds: 1800,
        sessionId: 'sess_1',
        status: TimerEngineStatus.running,
      );

      // 10 minutes later in background
      final now = DateTime(2026, 8, 26, 10, 20, 0);
      final elapsed = snapshot.calculateCurrentElapsed(now);

      // 600s + 600s = 1200s
      expect(elapsed, 1200);
    });

    test('NotificationPreferences persistence saves and retrieves properly', () async {
      const prefs = NotificationPreferences(
        focusSessionCompletion: true,
        scheduleReminders: false,
        dailySummary: true,
      );

      await LocalStore.saveNotificationPreferences(prefs);
      final loaded = await LocalStore.getNotificationPreferences();

      expect(loaded.focusSessionCompletion, isTrue);
      expect(loaded.scheduleReminders, isFalse);
      expect(loaded.dailySummary, isTrue);
    });

    test('ActiveTimerState equality & copyWith produces distinct instances', () {
      final now = DateTime.now();
      final s1 = ActiveTimerState(
        occurrenceId: 'occ_1',
        title: 'Deep Focus',
        startTime: now,
        lastResumeTime: now,
        targetDurationSeconds: 1500,
        elapsedSeconds: 0,
        status: TimerEngineStatus.running,
        sessionId: 'sess_1',
      );

      final s2 = s1.copyWith(elapsedSeconds: 1);
      expect(s1 == s2, isFalse);
      expect(s1.elapsedSeconds, 0);
      expect(s2.elapsedSeconds, 1);

      final s3 = s2.copyWith(isPaused: true, isRunning: false);
      expect(s3.isPaused, isTrue);
      expect(s3.isRunning, isFalse);
    });
  });
}

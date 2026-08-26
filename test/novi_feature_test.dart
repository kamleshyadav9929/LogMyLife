import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logmylife/core/database/local_store.dart';
import 'package:logmylife/domain/models/models.dart';
import 'package:logmylife/domain/models/focus_models.dart';
import 'package:logmylife/services/timer_engine.dart';
import 'package:logmylife/services/habit_engine.dart';
import 'package:logmylife/services/reconciliation_engine.dart';
import 'package:logmylife/services/ai_insights_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStore.init();
  });

  group('LocalStore Full CRUD & Persistence Tests', () {
    test('Initializes with default demo data', () async {
      final occurrences = await LocalStore.getOccurrences();
      final habits = await LocalStore.getHabits();
      final syllabus = await LocalStore.getSyllabus();
      final profile = await LocalStore.getUserProfile();

      expect(occurrences.isNotEmpty, isTrue);
      expect(habits.isNotEmpty, isTrue);
      expect(syllabus.isNotEmpty, isTrue);
      expect(profile.name, isNotEmpty);
    });

    test('Occurrence CRUD operations', () async {
      final testOcc = ActivityOccurrence(
        id: 'occ_test_1',
        plannedActivityId: 'plan_test_1',
        occurrenceDate: '2026-08-25',
        plannedStart: DateTime(2026, 8, 25, 10, 0),
        plannedEnd: DateTime(2026, 8, 25, 11, 0),
        durationSeconds: 3600,
        status: OccurrenceStatus.scheduled,
        parentActivityTitle: 'Test Coding Block',
      );

      await LocalStore.upsertOccurrence(testOcc);
      var fetched = (await LocalStore.getOccurrences('2026-08-25')).firstWhere((o) => o.id == 'occ_test_1');
      expect(fetched.parentActivityTitle, 'Test Coding Block');

      // Update
      final updated = fetched.copyWith(
        parentActivityTitle: 'Updated Coding Block',
        status: OccurrenceStatus.completed,
      );
      await LocalStore.updateOccurrence(updated);

      fetched = (await LocalStore.getOccurrences('2026-08-25')).firstWhere((o) => o.id == 'occ_test_1');
      expect(fetched.parentActivityTitle, 'Updated Coding Block');
      expect(fetched.status, OccurrenceStatus.completed);

      // Delete
      await LocalStore.deleteOccurrence('occ_test_1');
      final allAfterDelete = await LocalStore.getOccurrences('2026-08-25');
      expect(allAfterDelete.any((o) => o.id == 'occ_test_1'), isFalse);
    });

    test('Habit CRUD and toggle operations', () async {
      final testHabit = HabitItem(
        id: 'hab_test_1',
        title: 'Morning Yoga',
        icon: '🧘',
        targetMinutes: 20,
      );

      final allHabits = await LocalStore.getHabits();
      allHabits.add(testHabit);
      await LocalStore.saveHabits(allHabits);

      var habits = await LocalStore.getHabits();
      expect(habits.any((h) => h.id == 'hab_test_1'), isTrue);

      // Toggle Habit
      await HabitEngine.toggleHabitCompletion('hab_test_1', '2026-08-25');
      habits = await LocalStore.getHabits();
      final toggled = habits.firstWhere((h) => h.id == 'hab_test_1');
      expect(toggled.completedDates.contains('2026-08-25'), isTrue);

      // Update Habit
      final updated = toggled.copyWith(title: 'Evening Yoga', targetMinutes: 30);
      await LocalStore.updateHabit(updated);
      final updatedFetched = (await LocalStore.getHabits()).firstWhere((h) => h.id == 'hab_test_1');
      expect(updatedFetched.title, 'Evening Yoga');
      expect(updatedFetched.targetMinutes, 30);

      // Delete Habit
      await LocalStore.deleteHabit('hab_test_1');
      expect((await LocalStore.getHabits()).any((h) => h.id == 'hab_test_1'), isFalse);
    });

    test('Subject Progress CRUD operations', () async {
      final subject = SubjectProgress(
        subjectName: 'Compiler Design',
        completedHours: 12.5,
        totalTargetHours: 80.0,
        colorHex: '#1B4D3E',
      );

      await LocalStore.addSubjectProgress(subject);
      var syllabus = await LocalStore.getSyllabus();
      expect(syllabus.any((s) => s.subjectName == 'Compiler Design'), isTrue);

      // Update
      final updated = SubjectProgress(
        subjectName: 'Compiler Design',
        completedHours: 15.0,
        totalTargetHours: 80.0,
        colorHex: '#1B4D3E',
      );
      await LocalStore.updateSubjectProgress(updated);
      syllabus = await LocalStore.getSyllabus();
      final fetched = syllabus.firstWhere((s) => s.subjectName == 'Compiler Design');
      expect(fetched.completedHours, 15.0);

      // Delete
      await LocalStore.deleteSubjectProgress('Compiler Design');
      syllabus = await LocalStore.getSyllabus();
      expect(syllabus.any((s) => s.subjectName == 'Compiler Design'), isFalse);
    });

    test('JSON Data Export and Import', () async {
      final exportedJson = await LocalStore.exportDataAsJson();
      expect(exportedJson, contains('profile'));
      expect(exportedJson, contains('occurrences'));
      expect(exportedJson, contains('habits'));

      // Clear all data
      await LocalStore.clearAllData();
      var emptyOccurrences = await LocalStore.getOccurrences();
      expect(emptyOccurrences.isEmpty, isTrue);

      // Import back
      final success = await LocalStore.importDataFromJson(exportedJson);
      expect(success, isTrue);

      final restoredOccurrences = await LocalStore.getOccurrences();
      expect(restoredOccurrences.isNotEmpty, isTrue);
    });
  });

  group('TimerEngine & Reconciliation Tests', () {
    test('TimerEngine custom focus timer flow and session recording', () async {
      expect(TimerEngine.activeTimerNotifier.value, isNull);

      await TimerEngine.startCustomFocusTimer(
        title: 'Deep System Architecture',
        durationSeconds: 1500, // 25 min
      );

      final active = TimerEngine.activeTimerNotifier.value;
      expect(active, isNotNull);
      expect(active!.title, 'Deep System Architecture');
      expect(active.targetDurationSeconds, 1500);
      expect(active.isRunning, isTrue);

      // Pause and Resume
      TimerEngine.pauseTimer();
      expect(TimerEngine.activeTimerNotifier.value?.isPaused, isTrue);

      TimerEngine.resumeTimer();
      expect(TimerEngine.activeTimerNotifier.value?.isRunning, isTrue);

      // Stop Timer
      await TimerEngine.stopTimer();
      expect(TimerEngine.activeTimerNotifier.value, isNull);

      final todaySessions = await LocalStore.getActivitySessions();
      expect(todaySessions.any((s) => s.appName.contains('System Architecture')), isTrue);
    });

    test('TimerEngine saves early stop reason and resumes cumulative task progress', () async {
      final now = DateTime.now();
      final occ = ActivityOccurrence(
        id: 'occ_resume_test',
        plannedActivityId: 'act_resume_test',
        occurrenceDate: '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
        plannedStart: now,
        plannedEnd: now.add(const Duration(minutes: 30)),
        durationSeconds: 1800, // 30 min
        completedSeconds: 0,
        parentActivityTitle: 'Flutter Architecture Review',
      );
      await LocalStore.upsertOccurrence(occ);

      // Start first session
      await TimerEngine.startTimer(occ);
      expect(TimerEngine.activeTimerNotifier.value?.elapsedSeconds, 0);

      // Stop early with reason
      await TimerEngine.stopTimer(stopReason: 'Distracted / Phone notification');

      final interruptions = await LocalStore.getInterruptions();
      expect(interruptions.any((i) => i.cause == 'Distracted / Phone notification'), isTrue);

      final updatedOccList = await LocalStore.getOccurrences();
      final updatedOcc = updatedOccList.firstWhere((o) => o.id == 'occ_resume_test');
      expect(updatedOcc.lastInterruptionReason, 'Distracted / Phone notification');

      // Now set completedSeconds manually to simulate 10 minutes of elapsed time
      final partialOcc = updatedOcc.copyWith(completedSeconds: 600);
      await LocalStore.upsertOccurrence(partialOcc);

      // Resuming task starts with previous progress
      await TimerEngine.startTimer(partialOcc);
      expect(TimerEngine.activeTimerNotifier.value?.accumulatedElapsedSeconds, 600);
      expect(TimerEngine.activeTimerNotifier.value?.elapsedSeconds, 600);

      await TimerEngine.stopTimer();
    });

    test('ReconciliationEngine accurately calculates audited evidence completion', () {
      final occ = ActivityOccurrence(
        id: 'occ_audit_1',
        plannedActivityId: 'plan_1',
        occurrenceDate: '2026-08-25',
        plannedStart: DateTime(2026, 8, 25, 9, 0),
        plannedEnd: DateTime(2026, 8, 25, 10, 0),
        durationSeconds: 3600, // 60 mins
        status: OccurrenceStatus.scheduled,
      );

      final matchingSession = ActivitySession(
        id: 'sess_1',
        appName: 'VS Code',
        startedAt: DateTime(2026, 8, 25, 9, 0).millisecondsSinceEpoch,
        endedAt: DateTime(2026, 8, 25, 10, 0).millisecondsSinceEpoch,
        durationSeconds: 3600,
        confidence: ConfidenceLevel.high,
        plannedOccurrenceId: 'occ_audit_1',
        sourceType: SessionSourceType.auto,
      );

      final result = ReconciliationEngine.calculateCompletion(
        occurrence: occ,
        sessions: [matchingSession],
        interruptions: [],
      );

      expect(result.isCompleted, isTrue);
      expect(result.validDurationSeconds, 3600);
      expect(result.completionPercentage, 100.0);
    });
  });

  group('AIInsightsService & Comprehensive Analytics Tests', () {
    test('Generates meaningful briefing from local state', () async {
      final briefing = await AIInsightsService.generateDailyBriefing();
      expect(briefing.headline, isNotEmpty);
      expect(briefing.deepWorkSummary, isNotEmpty);
      expect(briefing.actionItems.isNotEmpty, isTrue);
      expect(briefing.productivityScore, greaterThanOrEqualTo(0.0));
    });

    test('Computes ComprehensiveAnalytics for Today, Week, Month, and All', () async {
      for (final range in AnalyticsTimeRange.values) {
        final analytics = await AIInsightsService.getComprehensiveAnalytics(range);
        expect(analytics.timeRange, range);
        expect(analytics.categoryStats.isNotEmpty, isTrue);
        expect(analytics.weeklyTrend.length, 7);
        expect(analytics.chronotypeStats.length, 4);
        expect(analytics.goldenFocusWindow, isNotEmpty);
        expect(analytics.actionableRecommendations.isNotEmpty, isTrue);
        expect(analytics.flowScore, greaterThanOrEqualTo(0.0));
      }
    });

    test('ActiveTimerState copyWith and notification updates work reliably', () {
      final now = DateTime.now();
      final state1 = ActiveTimerState(
        occurrenceId: 'occ_1',
        title: 'Test Flow',
        startTime: now,
        lastResumeTime: now,
        targetDurationSeconds: 1500,
        elapsedSeconds: 0,
        status: TimerEngineStatus.running,
        sessionId: 'sess_1',
      );

      final state2 = state1.copyWith(elapsedSeconds: 1);
      expect(state1 == state2, isFalse);
      expect(state2.elapsedSeconds, 1);
      expect(state2.targetDurationSeconds, 1500);

      // Extend & reset
      final extended = state2.copyWith(targetDurationSeconds: state2.targetDurationSeconds + 300);
      expect(extended.targetDurationSeconds, 1800);

      final reset = extended.copyWith(elapsedSeconds: 0);
      expect(reset.elapsedSeconds, 0);
    });
  });
}


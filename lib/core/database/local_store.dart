import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../../domain/models/models.dart';
import '../../domain/models/focus_models.dart';

/// LogMyLife Local Store & Persistence Layer
/// Persists domain entities with atomic serialization and provides rich seed fixtures.

class LocalStore {
  static SharedPreferences? _prefs;

  static const String _keyProfile = 'logmylife_user_profile';
  static const String _keyPlanned = 'logmylife_planned_activities';
  static const String _keyOccurrences = 'logmylife_occurrences';
  static const String _keySessions = 'logmylife_sessions';
  static const String _keyRawEvents = 'logmylife_raw_events';
  static const String _keyInterruptions = 'logmylife_interruptions';
  static const String _keyReschedules = 'logmylife_reschedules';
  static const String _keyRules = 'logmylife_rules';
  static const String _keyHabits = 'logmylife_habits';
  static const String _keySyllabus = 'logmylife_syllabus';
  static const String _keyAiSync = 'logmylife_ai_sync';
  static const String _keyCategories = 'logmylife_categories';
  static const String _keyFocusIntentions = 'logmylife_focus_intentions';
  static const String _keySoundMixes = 'logmylife_sound_mixes';
  static const String _keyActiveSoundMix = 'logmylife_active_sound_mix';
  static const String _keyFocusPlans = 'logmylife_focus_plans';
  static const String _keyActiveTimerSnapshot = 'logmylife_active_timer_snapshot_v2';
  static const String _keyNotificationPreferences = 'logmylife_notification_preferences';
  static const String _keyIsInitialized = 'logmylife_is_initialized_v3';

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final isInitialized = _prefs?.getBool(_keyIsInitialized) ?? false;
    if (!isInitialized) {
      await _seedInitialData();
      await _prefs?.setBool(_keyIsInitialized, true);
    } else {
      await _migrateLegacyColors();
    }
  }

  static Future<void> _migrateLegacyColors() async {
    try {
      final categories = await getCategories();
      bool updated = false;
      final migrated = categories.map((c) {
        if (c.colorHex == '#2563EB' || c.colorHex.toUpperCase() == '#2563EB' || c.colorHex == '#1B4D3E' || c.colorHex == '#8C3E3C' || c.colorHex == '#A95754') {
          updated = true;
          return UserCategory(id: c.id, name: c.name, colorHex: '#DFDFDF', icon: c.icon, isDefault: c.isDefault);
        }
        return c;
      }).toList();
      if (updated) {
        await saveCategories(migrated);
      }

      final habits = await getHabits();
      bool habitsUpdated = false;
      final migratedHabits = habits.map((h) {
        if (h.colorHex == '#2563EB' || h.colorHex.toUpperCase() == '#2563EB' || h.colorHex == '#1B4D3E' || h.colorHex == '#8C3E3C' || h.colorHex == '#A95754') {
          habitsUpdated = true;
          return h.copyWith(colorHex: '#DFDFDF');
        }
        return h;
      }).toList();
      if (habitsUpdated) {
        await saveHabits(migratedHabits);
      }

      final syllabus = await getSyllabus();
      bool syllabusUpdated = false;
      final migratedSyllabus = syllabus.map((s) {
        if (s.colorHex == '#2563EB' || s.colorHex.toUpperCase() == '#2563EB' || s.colorHex == '#1B4D3E' || s.colorHex == '#8C3E3C' || s.colorHex == '#A95754') {
          syllabusUpdated = true;
          return SubjectProgress(
            subjectName: s.subjectName,
            completedHours: s.completedHours,
            totalTargetHours: s.totalTargetHours,
            colorHex: '#DFDFDF',
          );
        }
        return s;
      }).toList();
      if (syllabusUpdated) {
        await saveSyllabus(migratedSyllabus);
      }
    } catch (_) {}
  }

  static String getTodayDateStr() {
    return DateFormat('yyyy-MM-dd').format(DateTime.now());
  }

  // --- Seed Data Generator ---
  static Future<void> _seedInitialData() async {
    final now = DateTime.now();
    final todayStr = getTodayDateStr();

    // 1. User Profile
    final profile = UserProfile(
      id: 'usr_001',
      name: 'Alex Vance',
      email: 'alex.vance@novi.app',
      avatarUrl: '',
      targetDailyHours: 7,
      currentStreak: 8,
      longestStreak: 19,
      xpPoints: 1420,
      level: 4,
      hasCompletedOnboarding: true,
    );
    await saveUserProfile(profile);

    // 2. Categories
    final categories = [
      UserCategory(id: 'cat_work', name: 'Deep Work & Code', colorHex: '#DFDFDF', icon: '💻', isDefault: true),
      UserCategory(id: 'cat_study', name: 'DSA & Algorithms', colorHex: '#B5B5B5', icon: '🧠', isDefault: true),
      UserCategory(id: 'cat_health', name: 'Workout & Fitness', colorHex: '#DFDFDF', icon: '⚡', isDefault: true),
      UserCategory(id: 'cat_read', name: 'Books & Learning', colorHex: '#525252', icon: '📚', isDefault: true),
      UserCategory(id: 'cat_leisure', name: 'Recharge & Rest', colorHex: '#414141', icon: '☕', isDefault: true),
    ];
    await saveCategories(categories);

    // 3. Planned Activities & Occurrences for Today
    final planDsa = PlannedActivity(
      id: 'plan_dsa_01',
      title: 'DSA: Dynamic Programming & Graphs',
      startAt: DateTime(now.year, now.month, now.day, 9, 0),
      endAt: DateTime(now.year, now.month, now.day, 11, 0),
      durationSeconds: 7200,
      type: ActivityType.timerRequired,
      timerRequired: true,
      fixed: false,
      minimumCompletionPercent: 80,
      categoryId: 'cat_study',
    );

    final planApp = PlannedActivity(
      id: 'plan_app_02',
      title: 'Mobile App Native Integration',
      startAt: DateTime(now.year, now.month, now.day, 11, 30),
      endAt: DateTime(now.year, now.month, now.day, 13, 30),
      durationSeconds: 7200,
      type: ActivityType.normal,
      timerRequired: false,
      fixed: false,
      minimumCompletionPercent: 80,
      categoryId: 'cat_work',
    );

    final planGym = PlannedActivity(
      id: 'plan_gym_03',
      title: 'Evening Strength & Cardio',
      startAt: DateTime(now.year, now.month, now.day, 17, 30),
      endAt: DateTime(now.year, now.month, now.day, 18, 45),
      durationSeconds: 4500,
      type: ActivityType.fixed,
      timerRequired: false,
      fixed: true,
      minimumCompletionPercent: 80,
      categoryId: 'cat_health',
    );

    await savePlannedActivities([planDsa, planApp, planGym]);

    final occDsa = ActivityOccurrence(
      id: 'occ_${todayStr}_dsa',
      plannedActivityId: planDsa.id,
      occurrenceDate: todayStr,
      plannedStart: planDsa.startAt,
      plannedEnd: planDsa.endAt,
      durationSeconds: 7200,
      timerRequired: true,
      fixed: false,
      status: OccurrenceStatus.completed,
      categoryId: 'cat_study',
      parentActivityTitle: planDsa.title,
    );

    final occApp = ActivityOccurrence(
      id: 'occ_${todayStr}_app',
      plannedActivityId: planApp.id,
      occurrenceDate: todayStr,
      plannedStart: planApp.startAt,
      plannedEnd: planApp.endAt,
      durationSeconds: 7200,
      timerRequired: false,
      fixed: false,
      status: OccurrenceStatus.active,
      categoryId: 'cat_work',
      parentActivityTitle: planApp.title,
    );

    final occGym = ActivityOccurrence(
      id: 'occ_${todayStr}_gym',
      plannedActivityId: planGym.id,
      occurrenceDate: todayStr,
      plannedStart: planGym.startAt,
      plannedEnd: planGym.endAt,
      durationSeconds: 4500,
      timerRequired: false,
      fixed: true,
      status: OccurrenceStatus.scheduled,
      categoryId: 'cat_health',
      parentActivityTitle: planGym.title,
    );

    await saveOccurrences([occDsa, occApp, occGym]);

    // 4. Activity Rules
    final rules = [
      ActivityRule(
        id: 'rule_vscode',
        targetId: planApp.id,
        ruleType: RuleType.packageMatch,
        ruleValue: 'com.microsoft.vscode',
        confidence: ConfidenceLevel.high,
      ),
      ActivityRule(
        id: 'rule_chrome_dsa',
        targetId: planDsa.id,
        ruleType: RuleType.packageAndTimeWindow,
        ruleValue: 'com.android.chrome',
        startHour: 9,
        endHour: 12,
        confidence: ConfidenceLevel.high,
      ),
    ];
    await saveActivityRules(rules);

    // 5. Activity Sessions & Interruptions
    final sessionDsaStart = DateTime(now.year, now.month, now.day, 9, 2).millisecondsSinceEpoch;
    final sessionDsaEnd = DateTime(now.year, now.month, now.day, 10, 58).millisecondsSinceEpoch;

    final sessionDsa = ActivitySession(
      id: 'sess_${sessionDsaStart}_timer',
      sourceType: SessionSourceType.timer,
      packageName: null,
      appName: 'DSA Timer Focus',
      plannedOccurrenceId: occDsa.id,
      startedAt: sessionDsaStart,
      endedAt: sessionDsaEnd,
      durationSeconds: 6960,
      confidence: ConfidenceLevel.high,
      classification: 'cat_study',
      reconciledAt: sessionDsaEnd,
    );

    final whatsappStart = DateTime(now.year, now.month, now.day, 10, 15).millisecondsSinceEpoch;
    final whatsappEnd = DateTime(now.year, now.month, now.day, 10, 19).millisecondsSinceEpoch;

    final sessionWhatsapp = ActivitySession(
      id: 'sess_${whatsappStart}_whatsapp',
      sourceType: SessionSourceType.auto,
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      plannedOccurrenceId: null,
      relatedOccurrenceId: occDsa.id,
      startedAt: whatsappStart,
      endedAt: whatsappEnd,
      durationSeconds: 240,
      confidence: ConfidenceLevel.medium,
      classification: 'unexpected_activity',
      reconciledAt: whatsappEnd,
    );

    await saveActivitySessions([sessionDsa, sessionWhatsapp]);

    final interruption = InterruptionRecord(
      id: 'intr_$whatsappStart',
      timerSessionId: sessionDsa.id,
      autoSessionId: sessionWhatsapp.id,
      startedAt: whatsappStart,
      endedAt: whatsappEnd,
      durationSeconds: 240,
    );
    await saveInterruptions([interruption]);

    // 6. Habits
    final habits = [
      HabitItem(id: 'hab_1', title: 'Solve 2 LeetCode Problems', icon: '🧠', colorHex: '#DFDFDF', targetMinutes: 45, completedDaysStreak: 8, completedDates: [todayStr]),
      HabitItem(id: 'hab_2', title: 'Review System Design Docs', icon: '📖', colorHex: '#DFDFDF', targetMinutes: 30, completedDaysStreak: 5, completedDates: [todayStr]),
      HabitItem(id: 'hab_3', title: 'Daily Workout & Stretch', icon: '⚡', colorHex: '#DFDFDF', targetMinutes: 45, completedDaysStreak: 12, completedDates: []),
      HabitItem(id: 'hab_4', title: 'No Phone in Bed Before Sleep', icon: '🌙', colorHex: '#DFDFDF', targetMinutes: 60, completedDaysStreak: 4, completedDates: []),
    ];
    await saveHabits(habits);

    // 7. Syllabus Progress
    final syllabus = [
      SubjectProgress(subjectName: 'Data Structures & Algorithms', completedHours: 48, totalTargetHours: 80, colorHex: '#DFDFDF'),
      SubjectProgress(subjectName: 'System Architecture & OS', completedHours: 32, totalTargetHours: 60, colorHex: '#DFDFDF'),
      SubjectProgress(subjectName: 'Flutter & Kotlin Native', completedHours: 24, totalTargetHours: 40, colorHex: '#DFDFDF'),
    ];
    await saveSyllabus(syllabus);

    // 8. AI Insights
    final aiSync = [
      AISyncResult(
        id: 'ai_01',
        timestamp: 'Today at 8:30 AM',
        category: 'Focus Optimization',
        summary: 'Your peak cognitive output occurs between 9:00 AM and 12:30 PM with minimal context switching.',
        recommendation: 'Keep high-friction problem solving tasks booked before 1:00 PM for maximum retention.',
        productivityScore: 92.5,
      ),
      AISyncResult(
        id: 'ai_02',
        timestamp: 'Yesterday at 9:00 PM',
        category: 'Interruption Analysis',
        summary: 'Detected 4m WhatsApp distraction during deep focus. Quick recovery time was under 90 seconds.',
        recommendation: 'Consider enabling Focus DND mode during scheduled study occurrences.',
        productivityScore: 88.0,
      ),
    ];
    await saveAISyncResults(aiSync);
  }

  // --- Profile Operations ---
  static Future<UserProfile> getUserProfile() async {
    final str = _prefs?.getString(_keyProfile);
    if (str != null) {
      try {
        return UserProfile.fromMap(json.decode(str));
      } catch (_) {}
    }
    return UserProfile(id: 'user_1', name: 'Alex Vance');
  }

  static Future<void> saveUserProfile(UserProfile profile) async {
    await _prefs?.setString(_keyProfile, json.encode(profile.toMap()));
  }

  // --- Planned Activities ---
  static Future<List<PlannedActivity>> getPlannedActivities() async {
    final str = _prefs?.getString(_keyPlanned);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => PlannedActivity.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> savePlannedActivities(List<PlannedActivity> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyPlanned, str);
  }

  // --- Occurrences ---
  static Future<List<ActivityOccurrence>> getOccurrences([String? dateStr]) async {
    final str = _prefs?.getString(_keyOccurrences);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      final occs = list.map((e) => ActivityOccurrence.fromMap(e)).toList();
      if (dateStr != null) {
        return occs.where((o) => o.occurrenceDate == dateStr).toList();
      }
      return occs;
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveOccurrences(List<ActivityOccurrence> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyOccurrences, str);
  }

  static Future<void> upsertOccurrence(ActivityOccurrence occurrence) async {
    final all = await getOccurrences();
    final index = all.indexWhere((o) => o.id == occurrence.id);
    if (index >= 0) {
      all[index] = occurrence;
    } else {
      all.add(occurrence);
    }
    await saveOccurrences(all);
  }

  // --- Activity Sessions ---
  static Future<List<ActivitySession>> getActivitySessions([String? dateStr]) async {
    final str = _prefs?.getString(_keySessions);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      final sessions = list.map((e) => ActivitySession.fromMap(e)).toList();
      if (dateStr != null) {
        return sessions.where((s) {
          final sDate = DateFormat('yyyy-MM-dd').format(DateTime.fromMillisecondsSinceEpoch(s.startedAt));
          return sDate == dateStr;
        }).toList();
      }
      return sessions;
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveActivitySessions(List<ActivitySession> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keySessions, str);
  }

  static Future<void> upsertSession(ActivitySession session) async {
    final all = await getActivitySessions();
    final index = all.indexWhere((s) => s.id == session.id);
    if (index >= 0) {
      all[index] = session;
    } else {
      all.add(session);
    }
    await saveActivitySessions(all);
  }

  // --- Raw Events ---
  static Future<List<RawActivityEvent>> getRawActivityEvents() async {
    final str = _prefs?.getString(_keyRawEvents);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => RawActivityEvent.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveRawActivityEvents(List<RawActivityEvent> events) async {
    final str = json.encode(events.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyRawEvents, str);
  }

  // --- Interruptions ---
  static Future<List<InterruptionRecord>> getInterruptions() async {
    final str = _prefs?.getString(_keyInterruptions);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => InterruptionRecord.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveInterruptions(List<InterruptionRecord> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyInterruptions, str);
  }

  static Future<void> addInterruption(InterruptionRecord interruption) async {
    final list = await getInterruptions();
    list.add(interruption);
    await saveInterruptions(list);
  }

  // --- Reschedule Events ---
  static Future<List<RescheduleEvent>> getRescheduleEvents() async {
    final str = _prefs?.getString(_keyReschedules);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => RescheduleEvent.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveRescheduleEvents(List<RescheduleEvent> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyReschedules, str);
  }

  static Future<void> addRescheduleEvent(RescheduleEvent event) async {
    final list = await getRescheduleEvents();
    list.insert(0, event);
    await saveRescheduleEvents(list);
  }

  // --- Activity Rules ---
  static Future<List<ActivityRule>> getActivityRules() async {
    final str = _prefs?.getString(_keyRules);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => ActivityRule.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveActivityRules(List<ActivityRule> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyRules, str);
  }

  // --- Habits ---
  static Future<List<HabitItem>> getHabits() async {
    final str = _prefs?.getString(_keyHabits);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => HabitItem.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveHabits(List<HabitItem> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyHabits, str);
  }

  // --- Categories ---
  static Future<List<UserCategory>> getCategories() async {
    final str = _prefs?.getString(_keyCategories);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => UserCategory.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveCategories(List<UserCategory> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyCategories, str);
  }

  static Future<void> saveOccurrence(ActivityOccurrence occurrence) => upsertOccurrence(occurrence);
  static Future<void> saveHabit(HabitItem habit) => updateHabit(habit);
  static Future<void> deleteSubject(String subjectName) => deleteSubjectProgress(subjectName);

  // --- Syllabus Progress ---
  static Future<List<SubjectProgress>> getSyllabus() async {
    final str = _prefs?.getString(_keySyllabus);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => SubjectProgress.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveSyllabus(List<SubjectProgress> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keySyllabus, str);
  }

  static Future<void> saveRescheduleEvent(RescheduleEvent event) async {
    final all = await getRescheduleEvents();
    final index = all.indexWhere((e) => e.id == event.id);
    if (index >= 0) {
      all[index] = event;
    } else {
      all.insert(0, event);
    }
    await saveRescheduleEvents(all);
  }

  // --- AI Sync Results ---
  static Future<List<AISyncResult>> getAISyncResults() async {
    final str = _prefs?.getString(_keyAiSync);
    if (str == null) return [];
    try {
      final list = json.decode(str) as List;
      return list.map((e) => AISyncResult.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveAISyncResults(List<AISyncResult> list) async {
    final str = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyAiSync, str);
  }

  // --- Occurrences Mutations ---
  static Future<void> deleteOccurrence(String id) async {
    final all = await getOccurrences();
    all.removeWhere((o) => o.id == id);
    await saveOccurrences(all);
  }

  static Future<void> updateOccurrence(ActivityOccurrence occurrence) async {
    await upsertOccurrence(occurrence);
  }

  // --- Planned Activities Mutations ---
  static Future<void> deletePlannedActivity(String id) async {
    final all = await getPlannedActivities();
    all.removeWhere((p) => p.id == id);
    await savePlannedActivities(all);

    // Cascade delete occurrences linked to this plan
    final occs = await getOccurrences();
    occs.removeWhere((o) => o.plannedActivityId == id);
    await saveOccurrences(occs);
  }

  static Future<void> updatePlannedActivity(PlannedActivity activity) async {
    final all = await getPlannedActivities();
    final index = all.indexWhere((p) => p.id == activity.id);
    if (index >= 0) {
      all[index] = activity;
    } else {
      all.add(activity);
    }
    await savePlannedActivities(all);
  }

  // --- Habits Mutations ---
  static Future<void> deleteHabit(String id) async {
    final all = await getHabits();
    all.removeWhere((h) => h.id == id);
    await saveHabits(all);
  }

  static Future<void> updateHabit(HabitItem habit) async {
    final all = await getHabits();
    final index = all.indexWhere((h) => h.id == habit.id);
    if (index >= 0) {
      all[index] = habit;
    } else {
      all.add(habit);
    }
    await saveHabits(all);
  }

  // --- Syllabus Progress Mutations ---
  static Future<void> addSubjectProgress(SubjectProgress subject) async {
    final all = await getSyllabus();
    all.add(subject);
    await saveSyllabus(all);
  }

  static Future<void> updateSubjectProgress(SubjectProgress subject) async {
    final all = await getSyllabus();
    final index = all.indexWhere((s) => s.subjectName.toLowerCase() == subject.subjectName.toLowerCase());
    if (index >= 0) {
      all[index] = subject;
    } else {
      all.add(subject);
    }
    await saveSyllabus(all);
  }

  static Future<void> deleteSubjectProgress(String subjectName) async {
    final all = await getSyllabus();
    all.removeWhere((s) => s.subjectName.toLowerCase() == subjectName.toLowerCase());
    await saveSyllabus(all);
  }

  // --- Categories Mutations ---
  static Future<void> saveCategory(UserCategory category) async {
    final all = await getCategories();
    final index = all.indexWhere((c) => c.id == category.id);
    if (index >= 0) {
      all[index] = category;
    } else {
      all.add(category);
    }
    await saveCategories(all);
  }

  static Future<void> deleteCategory(String id) async {
    final all = await getCategories();
    all.removeWhere((c) => c.id == id && !c.isDefault);
    await saveCategories(all);
  }

  // --- Activity Rules Mutations ---
  static Future<void> saveActivityRule(ActivityRule rule) async {
    final all = await getActivityRules();
    final index = all.indexWhere((r) => r.id == rule.id);
    if (index >= 0) {
      all[index] = rule;
    } else {
      all.add(rule);
    }
    await saveActivityRules(all);
  }

  static Future<void> deleteActivityRule(String id) async {
    final all = await getActivityRules();
    all.removeWhere((r) => r.id == id);
    await saveActivityRules(all);
  }

  // --- Reset & Backup Management ---
  static Future<void> resetToDemoData() async {
    await _prefs?.clear();
    await _seedInitialData();
    await _prefs?.setBool(_keyIsInitialized, true);
  }

  static Future<void> clearAllData() async {
    await _prefs?.clear();
    await _prefs?.setBool(_keyIsInitialized, true);
    // Create a bare minimal clean profile
    final profile = UserProfile(
      id: 'usr_001',
      name: 'Alex Vance',
      email: 'alex@novi.app',
      targetDailyHours: 6,
      currentStreak: 0,
      longestStreak: 0,
      xpPoints: 0,
      level: 1,
      hasCompletedOnboarding: true,
    );
    await saveUserProfile(profile);
    await saveCategories([
      UserCategory(id: 'cat_work', name: 'Deep Work & Code', colorHex: '#DFDFDF', icon: '💻', isDefault: true),
      UserCategory(id: 'cat_study', name: 'DSA & Algorithms', colorHex: '#B5B5B5', icon: '🧠', isDefault: true),
      UserCategory(id: 'cat_health', name: 'Workout & Fitness', colorHex: '#DFDFDF', icon: '⚡', isDefault: true),
      UserCategory(id: 'cat_read', name: 'Books & Learning', colorHex: '#525252', icon: '📚', isDefault: true),
      UserCategory(id: 'cat_leisure', name: 'Recharge & Rest', colorHex: '#414141', icon: '☕', isDefault: true),
    ]);
  }

  static Future<String> exportDataAsJson() async {
    final data = {
      'profile': (await getUserProfile()).toMap(),
      'planned': (await getPlannedActivities()).map((e) => e.toMap()).toList(),
      'occurrences': (await getOccurrences()).map((e) => e.toMap()).toList(),
      'sessions': (await getActivitySessions()).map((e) => e.toMap()).toList(),
      'habits': (await getHabits()).map((e) => e.toMap()).toList(),
      'syllabus': (await getSyllabus()).map((e) => e.toMap()).toList(),
      'rules': (await getActivityRules()).map((e) => e.toMap()).toList(),
      'categories': (await getCategories()).map((e) => e.toMap()).toList(),
      'exportedAt': DateTime.now().toIso8601String(),
    };
    return const JsonEncoder.withIndent('  ').convert(data);
  }

  static Future<bool> importDataFromJson(String jsonStr) async {
    try {
      final Map<String, dynamic> data = json.decode(jsonStr);
      if (data.containsKey('profile')) {
        await saveUserProfile(UserProfile.fromMap(data['profile']));
      }
      if (data.containsKey('planned')) {
        final list = (data['planned'] as List).map((e) => PlannedActivity.fromMap(e)).toList();
        await savePlannedActivities(list);
      }
      if (data.containsKey('occurrences')) {
        final list = (data['occurrences'] as List).map((e) => ActivityOccurrence.fromMap(e)).toList();
        await saveOccurrences(list);
      }
      if (data.containsKey('sessions')) {
        final list = (data['sessions'] as List).map((e) => ActivitySession.fromMap(e)).toList();
        await saveActivitySessions(list);
      }
      if (data.containsKey('habits')) {
        final list = (data['habits'] as List).map((e) => HabitItem.fromMap(e)).toList();
        await saveHabits(list);
      }
      if (data.containsKey('syllabus')) {
        final list = (data['syllabus'] as List).map((e) => SubjectProgress.fromMap(e)).toList();
        await saveSyllabus(list);
      }
      if (data.containsKey('rules')) {
        final list = (data['rules'] as List).map((e) => ActivityRule.fromMap(e)).toList();
        await saveActivityRules(list);
      }
      if (data.containsKey('categories')) {
        final list = (data['categories'] as List).map((e) => UserCategory.fromMap(e)).toList();
        await saveCategories(list);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ==========================================
  // NOVI Focus Pro & Deep Work Persistence
  // ==========================================

  static Future<void> saveFocusIntention(FocusIntentionRecord record) async {
    final list = await getFocusIntentions();
    final idx = list.indexWhere((r) => r.id == record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.add(record);
    }
    final raw = json.encode(list.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyFocusIntentions, raw);
  }

  static Future<List<FocusIntentionRecord>> getFocusIntentions() async {
    final raw = _prefs?.getString(_keyFocusIntentions);
    if (raw == null || raw.isEmpty) return [];
    try {
      final List<dynamic> decoded = json.decode(raw);
      return decoded.map((e) => FocusIntentionRecord.fromMap(Map<String, dynamic>.from(e))).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveSoundMixes(List<SoundscapeMix> mixes) async {
    final raw = json.encode(mixes.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keySoundMixes, raw);
  }

  static Future<List<SoundscapeMix>> getSoundMixes() async {
    final raw = _prefs?.getString(_keySoundMixes);
    if (raw == null || raw.isEmpty) {
      return SoundscapeMix.defaultPresets;
    }
    try {
      final List<dynamic> decoded = json.decode(raw);
      final list = decoded.map((e) => SoundscapeMix.fromMap(Map<String, dynamic>.from(e))).toList();
      return list.isEmpty ? SoundscapeMix.defaultPresets : list;
    } catch (_) {
      return SoundscapeMix.defaultPresets;
    }
  }

  static Future<void> saveActiveSoundMix(SoundscapeMix mix) async {
    await _prefs?.setString(_keyActiveSoundMix, mix.toJson());
  }

  static Future<SoundscapeMix> getActiveSoundMix() async {
    final raw = _prefs?.getString(_keyActiveSoundMix);
    if (raw == null || raw.isEmpty) {
      return SoundscapeMix.deepWorkPreset;
    }
    try {
      return SoundscapeMix.fromJson(raw);
    } catch (_) {
      return SoundscapeMix.deepWorkPreset;
    }
  }

  static Future<void> saveFocusPlans(List<FocusPlan> plans) async {
    final raw = json.encode(plans.map((e) => e.toMap()).toList());
    await _prefs?.setString(_keyFocusPlans, raw);
  }

  static Future<List<FocusPlan>> getFocusPlans() async {
    final raw = _prefs?.getString(_keyFocusPlans);
    if (raw == null || raw.isEmpty) {
      return [
        FocusPlan.createStandardDsaBlock(),
        FocusPlan.createCodingSprint(),
      ];
    }
    try {
      final List<dynamic> decoded = json.decode(raw);
      return decoded.map((e) => FocusPlan.fromMap(Map<String, dynamic>.from(e))).toList();
    } catch (_) {
      return [
        FocusPlan.createStandardDsaBlock(),
        FocusPlan.createCodingSprint(),
      ];
    }
  }

  /// Calculates Adaptive Focus Recommendations from user's historical endurance
  static Future<AdaptiveFocusSuggestion> getAdaptiveFocusSuggestion() async {
    final allSessions = await getActivitySessions();
    final timerSessions = allSessions.where((s) => s.sourceType == SessionSourceType.timer && (s.durationSeconds ?? 0) >= 300).toList();

    if (timerSessions.isEmpty) {
      return const AdaptiveFocusSuggestion(
        recommendedFocusMinutes: 50,
        recommendedBreakMinutes: 10,
        rationale: 'Based on optimal flow-state research, 50m focus with 10m recovery maximizes cognitive retention.',
        bestTimeWindow: '9:00 AM – 11:30 AM',
        consistencyScore: 0.85,
        totalSessionsAnalyzed: 0,
      );
    }

    // Calculate median and average duration
    final durationsMins = timerSessions.map((s) => (s.durationSeconds ?? 0) ~/ 60).toList()..sort();
    final median = durationsMins[durationsMins.length ~/ 2];
    
    // Determine suggested focus duration clamped sensibly
    int suggestedFocus = 25;
    if (median >= 45) {
      suggestedFocus = 50;
    } else if (median >= 35) {
      suggestedFocus = 45;
    } else if (median >= 20) {
      suggestedFocus = 25;
    } else {
      suggestedFocus = 15;
    }

    final suggestedBreak = (suggestedFocus * 0.2).round().clamp(5, 15);

    return AdaptiveFocusSuggestion(
      recommendedFocusMinutes: suggestedFocus,
      recommendedBreakMinutes: suggestedBreak,
      rationale: 'Your longest productive blocks typically average $median–${(median * 1.15).round()} minutes. Starting a ${suggestedFocus}m block will keep you in optimal flow.',
      bestTimeWindow: '8:30 AM – 11:45 AM',
      consistencyScore: 0.88,
      totalSessionsAnalyzed: timerSessions.length,
    );
  }

  // ==========================================
  // Timer State Machine Snapshot Persistence
  // ==========================================

  static Future<void> saveActiveTimerSnapshot(ActiveTimerSnapshot snapshot) async {
    final raw = json.encode(snapshot.toMap());
    await _prefs?.setString(_keyActiveTimerSnapshot, raw);
  }

  static Future<ActiveTimerSnapshot?> getActiveTimerSnapshot() async {
    final raw = _prefs?.getString(_keyActiveTimerSnapshot);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = json.decode(raw);
      return ActiveTimerSnapshot.fromMap(Map<String, dynamic>.from(decoded));
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearActiveTimerSnapshot() async {
    await _prefs?.remove(_keyActiveTimerSnapshot);
  }

  // ==========================================
  // Notification Preferences Persistence
  // ==========================================

  static Future<void> saveNotificationPreferences(NotificationPreferences prefs) async {
    final raw = json.encode(prefs.toMap());
    await _prefs?.setString(_keyNotificationPreferences, raw);
  }

  static Future<NotificationPreferences> getNotificationPreferences() async {
    final raw = _prefs?.getString(_keyNotificationPreferences);
    if (raw == null || raw.isEmpty) {
      return const NotificationPreferences();
    }
    try {
      final decoded = json.decode(raw);
      return NotificationPreferences.fromMap(Map<String, dynamic>.from(decoded));
    } catch (_) {
      return const NotificationPreferences();
    }
  }
}


import 'dart:convert';

/// NOVI Focus Pro Domain Models
/// Defines models for Focus Intentions, Soundscape Mixer, Multi-Session Plans,
/// Adaptive Analytics, and Smart Breaks.

enum FocusSessionMode {
  standard,
  deepFocus,
  smartBreak,
  multiSessionPlan,
}

enum IntentionStatus {
  pending,
  completed,
  partiallyCompleted,
  rolledOver,
}

/// Pre-session intention and post-session reflection record
class FocusIntentionRecord {
  final String id;
  final String sessionId;
  final String occurrenceId;
  final String taskTitle;
  final String intentionText;
  final IntentionStatus status;
  final String? accomplishmentNote;
  final String? nextStepNote;
  final int focusQualityScore; // 0 to 100
  final int createdAt;
  final int? completedAt;

  const FocusIntentionRecord({
    required this.id,
    required this.sessionId,
    required this.occurrenceId,
    required this.taskTitle,
    required this.intentionText,
    this.status = IntentionStatus.pending,
    this.accomplishmentNote,
    this.nextStepNote,
    this.focusQualityScore = 0,
    required this.createdAt,
    this.completedAt,
  });

  FocusIntentionRecord copyWith({
    String? id,
    String? sessionId,
    String? occurrenceId,
    String? taskTitle,
    String? intentionText,
    IntentionStatus? status,
    String? accomplishmentNote,
    String? nextStepNote,
    int? focusQualityScore,
    int? createdAt,
    int? completedAt,
  }) {
    return FocusIntentionRecord(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      occurrenceId: occurrenceId ?? this.occurrenceId,
      taskTitle: taskTitle ?? this.taskTitle,
      intentionText: intentionText ?? this.intentionText,
      status: status ?? this.status,
      accomplishmentNote: accomplishmentNote ?? this.accomplishmentNote,
      nextStepNote: nextStepNote ?? this.nextStepNote,
      focusQualityScore: focusQualityScore ?? this.focusQualityScore,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sessionId': sessionId,
      'occurrenceId': occurrenceId,
      'taskTitle': taskTitle,
      'intentionText': intentionText,
      'status': status.name,
      'accomplishmentNote': accomplishmentNote,
      'nextStepNote': nextStepNote,
      'focusQualityScore': focusQualityScore,
      'createdAt': createdAt,
      'completedAt': completedAt,
    };
  }

  factory FocusIntentionRecord.fromMap(Map<String, dynamic> map) {
    return FocusIntentionRecord(
      id: map['id'] ?? '',
      sessionId: map['sessionId'] ?? '',
      occurrenceId: map['occurrenceId'] ?? '',
      taskTitle: map['taskTitle'] ?? '',
      intentionText: map['intentionText'] ?? '',
      status: IntentionStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => IntentionStatus.pending,
      ),
      accomplishmentNote: map['accomplishmentNote'],
      nextStepNote: map['nextStepNote'],
      focusQualityScore: map['focusQualityScore'] ?? 0,
      createdAt: map['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
      completedAt: map['completedAt'],
    );
  }

  String toJson() => json.encode(toMap());
  factory FocusIntentionRecord.fromJson(String source) =>
      FocusIntentionRecord.fromMap(json.decode(source));
}

/// Multi-track ambient audio mixer settings
class SoundscapeMix {
  final String id;
  final String name;
  final double rainVolume; // 0.0 to 1.0
  final double brownNoiseVolume;
  final double cafeVolume;
  final double wavesVolume;
  final double forestVolume;
  final double fireplaceVolume;
  final bool isCustom;
  final bool isMuted;

  const SoundscapeMix({
    required this.id,
    required this.name,
    this.rainVolume = 0.0,
    this.brownNoiseVolume = 0.0,
    this.cafeVolume = 0.0,
    this.wavesVolume = 0.0,
    this.forestVolume = 0.0,
    this.fireplaceVolume = 0.0,
    this.isCustom = false,
    this.isMuted = false,
  });

  bool get isPlaying =>
      !isMuted &&
      (rainVolume > 0 ||
          brownNoiseVolume > 0 ||
          cafeVolume > 0 ||
          wavesVolume > 0 ||
          forestVolume > 0 ||
          fireplaceVolume > 0);

  SoundscapeMix copyWith({
    String? id,
    String? name,
    double? rainVolume,
    double? brownNoiseVolume,
    double? cafeVolume,
    double? wavesVolume,
    double? forestVolume,
    double? fireplaceVolume,
    bool? isCustom,
    bool? isMuted,
  }) {
    return SoundscapeMix(
      id: id ?? this.id,
      name: name ?? this.name,
      rainVolume: rainVolume ?? this.rainVolume,
      brownNoiseVolume: brownNoiseVolume ?? this.brownNoiseVolume,
      cafeVolume: cafeVolume ?? this.cafeVolume,
      wavesVolume: wavesVolume ?? this.wavesVolume,
      forestVolume: forestVolume ?? this.forestVolume,
      fireplaceVolume: fireplaceVolume ?? this.fireplaceVolume,
      isCustom: isCustom ?? this.isCustom,
      isMuted: isMuted ?? this.isMuted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'rainVolume': rainVolume,
      'brownNoiseVolume': brownNoiseVolume,
      'cafeVolume': cafeVolume,
      'wavesVolume': wavesVolume,
      'forestVolume': forestVolume,
      'fireplaceVolume': fireplaceVolume,
      'isCustom': isCustom,
      'isMuted': isMuted,
    };
  }

  factory SoundscapeMix.fromMap(Map<String, dynamic> map) {
    return SoundscapeMix(
      id: map['id'] ?? '',
      name: map['name'] ?? 'Custom Mix',
      rainVolume: (map['rainVolume'] as num?)?.toDouble() ?? 0.0,
      brownNoiseVolume: (map['brownNoiseVolume'] as num?)?.toDouble() ?? 0.0,
      cafeVolume: (map['cafeVolume'] as num?)?.toDouble() ?? 0.0,
      wavesVolume: (map['wavesVolume'] as num?)?.toDouble() ?? 0.0,
      forestVolume: (map['forestVolume'] as num?)?.toDouble() ?? 0.0,
      fireplaceVolume: (map['fireplaceVolume'] as num?)?.toDouble() ?? 0.0,
      isCustom: map['isCustom'] ?? false,
      isMuted: map['isMuted'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());
  factory SoundscapeMix.fromJson(String source) =>
      SoundscapeMix.fromMap(json.decode(source));

  // Curated Soundscape Presets
  static const SoundscapeMix deepWorkPreset = SoundscapeMix(
    id: 'preset_deep_work',
    name: 'Deep Work',
    brownNoiseVolume: 0.75,
    rainVolume: 0.40,
  );

  static const SoundscapeMix codingFlowPreset = SoundscapeMix(
    id: 'preset_coding',
    name: 'Coding Flow',
    cafeVolume: 0.50,
    brownNoiseVolume: 0.35,
    rainVolume: 0.15,
  );

  static const SoundscapeMix studyMemoryPreset = SoundscapeMix(
    id: 'preset_study',
    name: 'Study & Memory',
    forestVolume: 0.60,
    wavesVolume: 0.25,
    brownNoiseVolume: 0.20,
  );

  static const SoundscapeMix readingCalmPreset = SoundscapeMix(
    id: 'preset_reading',
    name: 'Reading Ambience',
    fireplaceVolume: 0.55,
    wavesVolume: 0.30,
  );

  static const SoundscapeMix rainStormPreset = SoundscapeMix(
    id: 'preset_rain',
    name: 'Rain Storm',
    rainVolume: 0.85,
    wavesVolume: 0.20,
  );

  static List<SoundscapeMix> get defaultPresets => [
        deepWorkPreset,
        codingFlowPreset,
        studyMemoryPreset,
        readingCalmPreset,
        rainStormPreset,
      ];
}

/// Single step inside a Multi-Session Focus Plan
enum FocusPlanStepType { focus, shortBreak, longBreak, review }

class FocusPlanStep {
  final String title;
  final int durationMinutes;
  final FocusPlanStepType type;

  const FocusPlanStep({
    required this.title,
    required this.durationMinutes,
    required this.type,
  });

  bool get isFocus => type == FocusPlanStepType.focus || type == FocusPlanStepType.review;
  bool get isBreak => type == FocusPlanStepType.shortBreak || type == FocusPlanStepType.longBreak;

  Map<String, dynamic> toMap() => {
        'title': title,
        'durationMinutes': durationMinutes,
        'type': type.name,
      };

  factory FocusPlanStep.fromMap(Map<String, dynamic> map) {
    return FocusPlanStep(
      title: map['title'] ?? 'Session',
      durationMinutes: map['durationMinutes'] ?? 25,
      type: FocusPlanStepType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => FocusPlanStepType.focus,
      ),
    );
  }
}

/// A structured multi-session deep work plan
class FocusPlan {
  final String id;
  final String title;
  final String categoryId;
  final List<FocusPlanStep> steps;

  const FocusPlan({
    required this.id,
    required this.title,
    this.categoryId = 'cat_study',
    required this.steps,
  });

  int get totalMinutes => steps.fold(0, (sum, step) => sum + step.durationMinutes);
  int get focusMinutes => steps
      .where((s) => s.isFocus)
      .fold(0, (sum, step) => sum + step.durationMinutes);
  int get breakMinutes => steps
      .where((s) => s.isBreak)
      .fold(0, (sum, step) => sum + step.durationMinutes);

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'categoryId': categoryId,
        'steps': steps.map((s) => s.toMap()).toList(),
      };

  factory FocusPlan.fromMap(Map<String, dynamic> map) {
    return FocusPlan(
      id: map['id'] ?? '',
      title: map['title'] ?? 'Deep Work Block',
      categoryId: map['categoryId'] ?? 'cat_study',
      steps: (map['steps'] as List? ?? [])
          .map((s) => FocusPlanStep.fromMap(s))
          .toList(),
    );
  }

  String toJson() => json.encode(toMap());
  factory FocusPlan.fromJson(String source) => FocusPlan.fromMap(json.decode(source));

  static FocusPlan createStandardDsaBlock({String title = 'DSA Deep Work'}) {
    return FocusPlan(
      id: 'plan_dsa_deep',
      title: title,
      categoryId: 'cat_study',
      steps: const [
        FocusPlanStep(title: 'Deep Problem Solving', durationMinutes: 50, type: FocusPlanStepType.focus),
        FocusPlanStep(title: 'Cognitive Recovery', durationMinutes: 10, type: FocusPlanStepType.shortBreak),
        FocusPlanStep(title: 'Implementation & Edge Cases', durationMinutes: 50, type: FocusPlanStepType.focus),
        FocusPlanStep(title: 'Recovery & Hydration', durationMinutes: 10, type: FocusPlanStepType.shortBreak),
        FocusPlanStep(title: 'Pattern Review & Notes', durationMinutes: 30, type: FocusPlanStepType.review),
      ],
    );
  }

  static FocusPlan createCodingSprint({String title = 'Feature Sprint'}) {
    return FocusPlan(
      id: 'plan_coding_sprint',
      title: title,
      categoryId: 'cat_work',
      steps: const [
        FocusPlanStep(title: 'Architecture & Scaffold', durationMinutes: 45, type: FocusPlanStepType.focus),
        FocusPlanStep(title: 'Quick Rest', durationMinutes: 5, type: FocusPlanStepType.shortBreak),
        FocusPlanStep(title: 'Core Implementation', durationMinutes: 45, type: FocusPlanStepType.focus),
        FocusPlanStep(title: 'Long Recovery', durationMinutes: 15, type: FocusPlanStepType.longBreak),
        FocusPlanStep(title: 'Testing & Refactor', durationMinutes: 30, type: FocusPlanStepType.focus),
      ],
    );
  }
}

/// Adaptive focus endurance recommendations
class AdaptiveFocusSuggestion {
  final int recommendedFocusMinutes;
  final int recommendedBreakMinutes;
  final String rationale;
  final String bestTimeWindow;
  final double consistencyScore; // 0.0 to 1.0
  final int totalSessionsAnalyzed;

  const AdaptiveFocusSuggestion({
    required this.recommendedFocusMinutes,
    required this.recommendedBreakMinutes,
    required this.rationale,
    required this.bestTimeWindow,
    required this.consistencyScore,
    required this.totalSessionsAnalyzed,
  });
}

enum TimerEngineStatus {
  idle,
  running,
  paused,
  completed,
  cancelled,
}

/// Persistent snapshot of the timer state to survive backgrounding and process restarts
class ActiveTimerSnapshot {
  final String occurrenceId;
  final String title;
  final int startTimeEpochMs;
  final int lastResumeTimeEpochMs;
  final int accumulatedElapsedSeconds;
  final int targetDurationSeconds;
  final String sessionId;
  final TimerEngineStatus status;
  final FocusSessionMode mode;
  final String? intentionText;
  final int pauseCount;
  final SoundscapeMix? soundMix;
  final FocusPlan? activePlan;
  final int activePlanStepIndex;

  const ActiveTimerSnapshot({
    required this.occurrenceId,
    required this.title,
    required this.startTimeEpochMs,
    required this.lastResumeTimeEpochMs,
    required this.accumulatedElapsedSeconds,
    required this.targetDurationSeconds,
    required this.sessionId,
    this.status = TimerEngineStatus.idle,
    this.mode = FocusSessionMode.standard,
    this.intentionText,
    this.pauseCount = 0,
    this.soundMix,
    this.activePlan,
    this.activePlanStepIndex = 0,
  });

  bool get isRunning => status == TimerEngineStatus.running;
  bool get isPaused => status == TimerEngineStatus.paused;

  int calculateCurrentElapsed(DateTime now) {
    if (status == TimerEngineStatus.running) {
      final nowMs = now.millisecondsSinceEpoch;
      final runningDeltaSec = ((nowMs - lastResumeTimeEpochMs) / 1000).floor().clamp(0, 86400 * 7);
      return accumulatedElapsedSeconds + runningDeltaSec;
    }
    return accumulatedElapsedSeconds;
  }

  Map<String, dynamic> toMap() {
    return {
      'occurrenceId': occurrenceId,
      'title': title,
      'startTimeEpochMs': startTimeEpochMs,
      'lastResumeTimeEpochMs': lastResumeTimeEpochMs,
      'accumulatedElapsedSeconds': accumulatedElapsedSeconds,
      'targetDurationSeconds': targetDurationSeconds,
      'sessionId': sessionId,
      'status': status.name,
      'mode': mode.name,
      'intentionText': intentionText,
      'pauseCount': pauseCount,
      'soundMix': soundMix?.toMap(),
      'activePlan': activePlan?.toMap(),
      'activePlanStepIndex': activePlanStepIndex,
    };
  }

  factory ActiveTimerSnapshot.fromMap(Map<String, dynamic> map) {
    return ActiveTimerSnapshot(
      occurrenceId: map['occurrenceId'] ?? '',
      title: map['title'] ?? 'Focus Session',
      startTimeEpochMs: map['startTimeEpochMs'] ?? DateTime.now().millisecondsSinceEpoch,
      lastResumeTimeEpochMs: map['lastResumeTimeEpochMs'] ?? DateTime.now().millisecondsSinceEpoch,
      accumulatedElapsedSeconds: map['accumulatedElapsedSeconds'] ?? 0,
      targetDurationSeconds: map['targetDurationSeconds'] ?? 1500,
      sessionId: map['sessionId'] ?? '',
      status: TimerEngineStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => TimerEngineStatus.idle,
      ),
      mode: FocusSessionMode.values.firstWhere(
        (e) => e.name == map['mode'],
        orElse: () => FocusSessionMode.standard,
      ),
      intentionText: map['intentionText'],
      pauseCount: map['pauseCount'] ?? 0,
      soundMix: map['soundMix'] != null ? SoundscapeMix.fromMap(Map<String, dynamic>.from(map['soundMix'])) : null,
      activePlan: map['activePlan'] != null ? FocusPlan.fromMap(Map<String, dynamic>.from(map['activePlan'])) : null,
      activePlanStepIndex: map['activePlanStepIndex'] ?? 0,
    );
  }
}

class NotificationPreferences {
  final bool focusSessionCompletion;
  final bool scheduleReminders;
  final bool dailySummary;

  const NotificationPreferences({
    this.focusSessionCompletion = true,
    this.scheduleReminders = true,
    this.dailySummary = true,
  });

  NotificationPreferences copyWith({
    bool? focusSessionCompletion,
    bool? scheduleReminders,
    bool? dailySummary,
  }) {
    return NotificationPreferences(
      focusSessionCompletion: focusSessionCompletion ?? this.focusSessionCompletion,
      scheduleReminders: scheduleReminders ?? this.scheduleReminders,
      dailySummary: dailySummary ?? this.dailySummary,
    );
  }

  Map<String, dynamic> toMap() => {
        'focusSessionCompletion': focusSessionCompletion,
        'scheduleReminders': scheduleReminders,
        'dailySummary': dailySummary,
      };

  factory NotificationPreferences.fromMap(Map<String, dynamic> map) {
    return NotificationPreferences(
      focusSessionCompletion: map['focusSessionCompletion'] ?? true,
      scheduleReminders: map['scheduleReminders'] ?? true,
      dailySummary: map['dailySummary'] ?? true,
    );
  }
}

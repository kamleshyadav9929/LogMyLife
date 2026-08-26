import 'dart:convert';

/// Canonical Domain Models for LogMyLife
/// Conforms strictly to Master Spec §30, Scheduling Spec §1, Tracker Spec §B.3, and Reconciliation Spec §3-§6.

enum ActivityType { normal, timerRequired, fixed, recurring }
enum PlannedActivityStatus { scheduled, started, completed, incomplete, cancelled }
enum OccurrenceStatus { scheduled, active, completed, incomplete, missed }
enum RescheduleReason { earlyStart, lateStart, cascade, manual, conflictResolution }
enum RescheduleStatus { active, partiallyUndone, undone }
enum RawEventType { moveToForeground, moveToBackground, screenOn, screenOff, deviceUnlocked, unknown }
enum RawEventSource { usageStats, system }
enum DeviceState { active, locked, idle, unknown }
enum SessionSourceType { auto, timer, system, manualCorrection }
enum ConfidenceLevel { high, medium, unknown }
enum RuleType { packageMatch, packageAndTimeWindow, categoryMatch }

class PlannedActivity {
  final String id;
  final String title;
  final DateTime startAt;
  final DateTime endAt;
  final int durationSeconds;
  final ActivityType type;
  final bool timerRequired;
  final bool fixed;
  final int minimumCompletionPercent;
  final String? recurrenceId;
  final String? recurrenceRule;
  final String? categoryId;
  final PlannedActivityStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  PlannedActivity({
    required this.id,
    required this.title,
    required this.startAt,
    required this.endAt,
    required this.durationSeconds,
    this.type = ActivityType.normal,
    this.timerRequired = false,
    this.fixed = false,
    this.minimumCompletionPercent = 80,
    this.recurrenceId,
    this.recurrenceRule,
    this.categoryId,
    this.status = PlannedActivityStatus.scheduled,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  PlannedActivity copyWith({
    String? id,
    String? title,
    DateTime? startAt,
    DateTime? endAt,
    int? durationSeconds,
    ActivityType? type,
    bool? timerRequired,
    bool? fixed,
    int? minimumCompletionPercent,
    String? recurrenceId,
    String? recurrenceRule,
    String? categoryId,
    PlannedActivityStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PlannedActivity(
      id: id ?? this.id,
      title: title ?? this.title,
      startAt: startAt ?? this.startAt,
      endAt: endAt ?? this.endAt,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      type: type ?? this.type,
      timerRequired: timerRequired ?? this.timerRequired,
      fixed: fixed ?? this.fixed,
      minimumCompletionPercent: minimumCompletionPercent ?? this.minimumCompletionPercent,
      recurrenceId: recurrenceId ?? this.recurrenceId,
      recurrenceRule: recurrenceRule ?? this.recurrenceRule,
      categoryId: categoryId ?? this.categoryId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'startAt': startAt.toIso8601String(),
      'endAt': endAt.toIso8601String(),
      'durationSeconds': durationSeconds,
      'type': type.name,
      'timerRequired': timerRequired,
      'fixed': fixed,
      'minimumCompletionPercent': minimumCompletionPercent,
      'recurrenceId': recurrenceId,
      'recurrenceRule': recurrenceRule,
      'categoryId': categoryId,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory PlannedActivity.fromMap(Map<String, dynamic> map) {
    return PlannedActivity(
      id: map['id'],
      title: map['title'] ?? '',
      startAt: DateTime.parse(map['startAt']),
      endAt: DateTime.parse(map['endAt']),
      durationSeconds: map['durationSeconds'] ?? 3600,
      type: ActivityType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => ActivityType.normal,
      ),
      timerRequired: map['timerRequired'] ?? false,
      fixed: map['fixed'] ?? false,
      minimumCompletionPercent: map['minimumCompletionPercent'] ?? 80,
      recurrenceId: map['recurrenceId'],
      recurrenceRule: map['recurrenceRule'],
      categoryId: map['categoryId'],
      status: PlannedActivityStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => PlannedActivityStatus.scheduled,
      ),
      createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : null,
      updatedAt: map['updatedAt'] != null ? DateTime.parse(map['updatedAt']) : null,
    );
  }

  String toJson() => json.encode(toMap());
  factory PlannedActivity.fromJson(String source) => PlannedActivity.fromMap(json.decode(source));
}

class ActivityOccurrence {
  final String id;
  final String plannedActivityId;
  final String occurrenceDate; // YYYY-MM-DD
  final DateTime plannedStart;
  final DateTime plannedEnd;
  final int durationSeconds;
  final int completedSeconds;
  final String? lastInterruptionReason;
  final bool timerRequired;
  final bool fixed;
  final OccurrenceStatus status;
  final String? categoryId;
  final String? parentActivityTitle;

  ActivityOccurrence({
    required this.id,
    required this.plannedActivityId,
    required this.occurrenceDate,
    required this.plannedStart,
    required this.plannedEnd,
    required this.durationSeconds,
    this.completedSeconds = 0,
    this.lastInterruptionReason,
    this.timerRequired = false,
    this.fixed = false,
    this.status = OccurrenceStatus.scheduled,
    this.categoryId,
    this.parentActivityTitle,
  });

  double get progressPercentage => durationSeconds > 0
      ? (completedSeconds / durationSeconds).clamp(0.0, 1.0)
      : 0.0;

  int get remainingSeconds => (durationSeconds - completedSeconds).clamp(0, durationSeconds);

  ActivityOccurrence copyWith({
    String? id,
    String? plannedActivityId,
    String? occurrenceDate,
    DateTime? plannedStart,
    DateTime? plannedEnd,
    int? durationSeconds,
    int? completedSeconds,
    String? lastInterruptionReason,
    bool? timerRequired,
    bool? fixed,
    OccurrenceStatus? status,
    String? categoryId,
    String? parentActivityTitle,
  }) {
    return ActivityOccurrence(
      id: id ?? this.id,
      plannedActivityId: plannedActivityId ?? this.plannedActivityId,
      occurrenceDate: occurrenceDate ?? this.occurrenceDate,
      plannedStart: plannedStart ?? this.plannedStart,
      plannedEnd: plannedEnd ?? this.plannedEnd,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      completedSeconds: completedSeconds ?? this.completedSeconds,
      lastInterruptionReason: lastInterruptionReason ?? this.lastInterruptionReason,
      timerRequired: timerRequired ?? this.timerRequired,
      fixed: fixed ?? this.fixed,
      status: status ?? this.status,
      categoryId: categoryId ?? this.categoryId,
      parentActivityTitle: parentActivityTitle ?? this.parentActivityTitle,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'plannedActivityId': plannedActivityId,
      'occurrenceDate': occurrenceDate,
      'plannedStart': plannedStart.toIso8601String(),
      'plannedEnd': plannedEnd.toIso8601String(),
      'durationSeconds': durationSeconds,
      'completedSeconds': completedSeconds,
      'lastInterruptionReason': lastInterruptionReason,
      'timerRequired': timerRequired,
      'fixed': fixed,
      'status': status.name,
      'categoryId': categoryId,
      'parentActivityTitle': parentActivityTitle,
    };
  }

  factory ActivityOccurrence.fromMap(Map<String, dynamic> map) {
    return ActivityOccurrence(
      id: map['id'],
      plannedActivityId: map['plannedActivityId'],
      occurrenceDate: map['occurrenceDate'] ?? '',
      plannedStart: DateTime.parse(map['plannedStart']),
      plannedEnd: DateTime.parse(map['plannedEnd']),
      durationSeconds: map['durationSeconds'] ?? 3600,
      completedSeconds: map['completedSeconds'] ?? 0,
      lastInterruptionReason: map['lastInterruptionReason'],
      timerRequired: map['timerRequired'] ?? false,
      fixed: map['fixed'] ?? false,
      status: OccurrenceStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => OccurrenceStatus.scheduled,
      ),
      categoryId: map['categoryId'],
      parentActivityTitle: map['parentActivityTitle'],
    );
  }
}

class RescheduleChange {
  final String occurrenceId;
  final DateTime oldStart;
  final DateTime oldEnd;
  final DateTime newStart;
  final DateTime newEnd;

  RescheduleChange({
    required this.occurrenceId,
    required this.oldStart,
    required this.oldEnd,
    required this.newStart,
    required this.newEnd,
  });

  Map<String, dynamic> toMap() => {
        'occurrenceId': occurrenceId,
        'oldStart': oldStart.toIso8601String(),
        'oldEnd': oldEnd.toIso8601String(),
        'newStart': newStart.toIso8601String(),
        'newEnd': newEnd.toIso8601String(),
      };

  factory RescheduleChange.fromMap(Map<String, dynamic> map) => RescheduleChange(
        occurrenceId: map['occurrenceId'],
        oldStart: DateTime.parse(map['oldStart']),
        oldEnd: DateTime.parse(map['oldEnd']),
        newStart: DateTime.parse(map['newStart']),
        newEnd: DateTime.parse(map['newEnd']),
      );
}

class RescheduleEvent {
  final String id;
  final String causeOccurrenceId;
  final DateTime oldStart;
  final DateTime oldEnd;
  final DateTime newStart;
  final DateTime newEnd;
  final RescheduleReason reason;
  final List<RescheduleChange> changes;
  final RescheduleStatus status;
  final DateTime? inverseAppliedAt;
  final DateTime createdAt;

  RescheduleEvent({
    required this.id,
    required this.causeOccurrenceId,
    required this.oldStart,
    required this.oldEnd,
    required this.newStart,
    required this.newEnd,
    required this.reason,
    required this.changes,
    this.status = RescheduleStatus.active,
    this.inverseAppliedAt,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  RescheduleEvent copyWith({
    String? id,
    String? causeOccurrenceId,
    DateTime? oldStart,
    DateTime? oldEnd,
    DateTime? newStart,
    DateTime? newEnd,
    RescheduleReason? reason,
    List<RescheduleChange>? changes,
    RescheduleStatus? status,
    DateTime? inverseAppliedAt,
    DateTime? createdAt,
  }) {
    return RescheduleEvent(
      id: id ?? this.id,
      causeOccurrenceId: causeOccurrenceId ?? this.causeOccurrenceId,
      oldStart: oldStart ?? this.oldStart,
      oldEnd: oldEnd ?? this.oldEnd,
      newStart: newStart ?? this.newStart,
      newEnd: newEnd ?? this.newEnd,
      reason: reason ?? this.reason,
      changes: changes ?? this.changes,
      status: status ?? this.status,
      inverseAppliedAt: inverseAppliedAt ?? this.inverseAppliedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'causeOccurrenceId': causeOccurrenceId,
        'oldStart': oldStart.toIso8601String(),
        'oldEnd': oldEnd.toIso8601String(),
        'newStart': newStart.toIso8601String(),
        'newEnd': newEnd.toIso8601String(),
        'reason': reason.name,
        'changes': changes.map((c) => c.toMap()).toList(),
        'status': status.name,
        'inverseAppliedAt': inverseAppliedAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };

  factory RescheduleEvent.fromMap(Map<String, dynamic> map) => RescheduleEvent(
        id: map['id'],
        causeOccurrenceId: map['causeOccurrenceId'],
        oldStart: DateTime.parse(map['oldStart']),
        oldEnd: DateTime.parse(map['oldEnd']),
        newStart: DateTime.parse(map['newStart']),
        newEnd: DateTime.parse(map['newEnd']),
        reason: RescheduleReason.values.firstWhere(
          (e) => e.name == map['reason'],
          orElse: () => RescheduleReason.manual,
        ),
        changes: (map['changes'] as List? ?? [])
            .map((c) => RescheduleChange.fromMap(c))
            .toList(),
        status: RescheduleStatus.values.firstWhere(
          (e) => e.name == map['status'],
          orElse: () => RescheduleStatus.active,
        ),
        inverseAppliedAt: map['inverseAppliedAt'] != null
            ? DateTime.parse(map['inverseAppliedAt'])
            : null,
        createdAt: map['createdAt'] != null
            ? DateTime.parse(map['createdAt'])
            : DateTime.now(),
      );
}

class RawActivityEvent {
  final String eventId;
  final String packageName;
  final RawEventType eventType;
  final int timestamp; // UTC epoch ms
  final RawEventSource source;
  final DeviceState deviceState;
  final int receivedAt;

  RawActivityEvent({
    required this.eventId,
    required this.packageName,
    required this.eventType,
    required this.timestamp,
    this.source = RawEventSource.usageStats,
    this.deviceState = DeviceState.active,
    int? receivedAt,
  }) : receivedAt = receivedAt ?? DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> toMap() => {
        'eventId': eventId,
        'packageName': packageName,
        'eventType': eventType.name,
        'timestamp': timestamp,
        'source': source.name,
        'deviceState': deviceState.name,
        'receivedAt': receivedAt,
      };

  factory RawActivityEvent.fromMap(Map<String, dynamic> map) => RawActivityEvent(
        eventId: map['eventId'],
        packageName: map['packageName'] ?? '',
        eventType: RawEventType.values.firstWhere(
          (e) => e.name == map['eventType'] || e.name.toUpperCase() == (map['eventType'] ?? '').toString().toUpperCase(),
          orElse: () => RawEventType.unknown,
        ),
        timestamp: (map['timestamp'] as num).toInt(),
        source: map['source'] == 'system' ? RawEventSource.system : RawEventSource.usageStats,
        deviceState: map['deviceState'] == 'locked' ? DeviceState.locked : DeviceState.active,
        receivedAt: (map['receivedAt'] as num?)?.toInt(),
      );
}

class ActivitySession {
  final String id;
  final SessionSourceType sourceType;
  final String? packageName;
  final String appName;
  final String? plannedOccurrenceId;
  final String? relatedOccurrenceId;
  final int startedAt; // UTC epoch ms
  final int? endedAt;
  final int? durationSeconds;
  final ConfidenceLevel confidence;
  final String? classification;
  final int? reconciledAt;
  final int createdAt;

  ActivitySession({
    required this.id,
    required this.sourceType,
    this.packageName,
    required this.appName,
    this.plannedOccurrenceId,
    this.relatedOccurrenceId,
    required this.startedAt,
    this.endedAt,
    this.durationSeconds,
    this.confidence = ConfidenceLevel.unknown,
    this.classification,
    this.reconciledAt,
    int? createdAt,
  }) : createdAt = createdAt ?? startedAt;

  ActivitySession copyWith({
    String? id,
    SessionSourceType? sourceType,
    String? packageName,
    String? appName,
    String? plannedOccurrenceId,
    String? relatedOccurrenceId,
    int? startedAt,
    int? endedAt,
    int? durationSeconds,
    ConfidenceLevel? confidence,
    String? classification,
    int? reconciledAt,
    int? createdAt,
  }) {
    return ActivitySession(
      id: id ?? this.id,
      sourceType: sourceType ?? this.sourceType,
      packageName: packageName ?? this.packageName,
      appName: appName ?? this.appName,
      plannedOccurrenceId: plannedOccurrenceId ?? this.plannedOccurrenceId,
      relatedOccurrenceId: relatedOccurrenceId ?? this.relatedOccurrenceId,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      confidence: confidence ?? this.confidence,
      classification: classification ?? this.classification,
      reconciledAt: reconciledAt ?? this.reconciledAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'sourceType': sourceType.name,
        'packageName': packageName,
        'appName': appName,
        'plannedOccurrenceId': plannedOccurrenceId,
        'relatedOccurrenceId': relatedOccurrenceId,
        'startedAt': startedAt,
        'endedAt': endedAt,
        'durationSeconds': durationSeconds,
        'confidence': confidence.name,
        'classification': classification,
        'reconciledAt': reconciledAt,
        'createdAt': createdAt,
      };

  factory ActivitySession.fromMap(Map<String, dynamic> map) => ActivitySession(
        id: map['id'],
        sourceType: SessionSourceType.values.firstWhere(
          (e) => e.name.toLowerCase() == (map['sourceType'] ?? '').toString().toLowerCase(),
          orElse: () => SessionSourceType.auto,
        ),
        packageName: map['packageName'],
        appName: map['appName'] ?? 'App',
        plannedOccurrenceId: map['plannedOccurrenceId'],
        relatedOccurrenceId: map['relatedOccurrenceId'],
        startedAt: (map['startedAt'] as num).toInt(),
        endedAt: (map['endedAt'] as num?)?.toInt(),
        durationSeconds: (map['durationSeconds'] as num?)?.toInt(),
        confidence: ConfidenceLevel.values.firstWhere(
          (e) => e.name == map['confidence'],
          orElse: () => ConfidenceLevel.unknown,
        ),
        classification: map['classification'],
        reconciledAt: (map['reconciledAt'] as num?)?.toInt(),
        createdAt: (map['createdAt'] as num?)?.toInt() ?? (map['startedAt'] as num).toInt(),
      );
}

class InterruptionRecord {
  final String id;
  final String timerSessionId;
  final String autoSessionId;
  final int startedAt;
  final int endedAt;
  final int durationSeconds;
  final String? cause;

  InterruptionRecord({
    required this.id,
    required this.timerSessionId,
    this.autoSessionId = '',
    required this.startedAt,
    required this.endedAt,
    required this.durationSeconds,
    this.cause,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'timerSessionId': timerSessionId,
        'autoSessionId': autoSessionId,
        'startedAt': startedAt,
        'endedAt': endedAt,
        'durationSeconds': durationSeconds,
        'cause': cause,
      };

  factory InterruptionRecord.fromMap(Map<String, dynamic> map) => InterruptionRecord(
        id: map['id'],
        timerSessionId: map['timerSessionId'],
        autoSessionId: map['autoSessionId'] ?? '',
        startedAt: (map['startedAt'] as num).toInt(),
        endedAt: (map['endedAt'] as num).toInt(),
        durationSeconds: (map['durationSeconds'] as num).toInt(),
        cause: map['cause'],
      );
}

class ActivityRule {
  final String id;
  final String targetId;
  final RuleType ruleType;
  final String ruleValue;
  final int? startHour;
  final int? endHour;
  final ConfidenceLevel confidence;
  final int createdAt;
  final String createdBy;

  ActivityRule({
    required this.id,
    required this.targetId,
    required this.ruleType,
    required this.ruleValue,
    this.startHour,
    this.endHour,
    this.confidence = ConfidenceLevel.high,
    int? createdAt,
    this.createdBy = 'user',
  }) : createdAt = createdAt ?? DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> toMap() => {
        'id': id,
        'targetId': targetId,
        'ruleType': ruleType.name,
        'ruleValue': ruleValue,
        'startHour': startHour,
        'endHour': endHour,
        'confidence': confidence.name,
        'createdAt': createdAt,
        'createdBy': createdBy,
      };

  factory ActivityRule.fromMap(Map<String, dynamic> map) => ActivityRule(
        id: map['id'],
        targetId: map['targetId'],
        ruleType: RuleType.values.firstWhere(
          (e) => e.name == map['ruleType'],
          orElse: () => RuleType.packageMatch,
        ),
        ruleValue: map['ruleValue'] ?? '',
        startHour: (map['startHour'] as num?)?.toInt(),
        endHour: (map['endHour'] as num?)?.toInt(),
        confidence: ConfidenceLevel.high,
        createdAt: (map['createdAt'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
        createdBy: map['createdBy'] ?? 'user',
      );
}

class UserProfile {
  final String id;
  final String name;
  final String email;
  final String avatarUrl;
  final int targetDailyHours;
  final int currentStreak;
  final int longestStreak;
  final int xpPoints;
  final int level;
  final bool hasCompletedOnboarding;

  UserProfile({
    required this.id,
    required this.name,
    this.email = '',
    this.avatarUrl = '',
    this.targetDailyHours = 6,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.xpPoints = 120,
    this.level = 1,
    this.hasCompletedOnboarding = false,
  });

  UserProfile copyWith({
    String? id,
    String? name,
    String? email,
    String? avatarUrl,
    int? targetDailyHours,
    int? currentStreak,
    int? longestStreak,
    int? xpPoints,
    int? level,
    bool? hasCompletedOnboarding,
  }) {
    return UserProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      targetDailyHours: targetDailyHours ?? this.targetDailyHours,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      xpPoints: xpPoints ?? this.xpPoints,
      level: level ?? this.level,
      hasCompletedOnboarding: hasCompletedOnboarding ?? this.hasCompletedOnboarding,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'email': email,
        'avatarUrl': avatarUrl,
        'targetDailyHours': targetDailyHours,
        'currentStreak': currentStreak,
        'longestStreak': longestStreak,
        'xpPoints': xpPoints,
        'level': level,
        'hasCompletedOnboarding': hasCompletedOnboarding,
      };

  factory UserProfile.fromMap(Map<String, dynamic> map) => UserProfile(
        id: map['id'] ?? 'user_1',
        name: map['name'] ?? 'Alex Carter',
        email: map['email'] ?? 'alex@logmylife.app',
        avatarUrl: map['avatarUrl'] ?? '',
        targetDailyHours: map['targetDailyHours'] ?? 6,
        currentStreak: map['currentStreak'] ?? 7,
        longestStreak: map['longestStreak'] ?? 14,
        xpPoints: map['xpPoints'] ?? 840,
        level: map['level'] ?? 3,
        hasCompletedOnboarding: map['hasCompletedOnboarding'] ?? true,
      );
}

class HabitItem {
  final String id;
  final String title;
  final String icon;
  final String colorHex;
  final int targetMinutes;
  final int completedDaysStreak;
  final List<String> completedDates; // List of YYYY-MM-DD strings

  HabitItem({
    required this.id,
    required this.title,
    this.icon = '🎯',
    this.colorHex = '#DFDFDF',
    this.targetMinutes = 30,
    this.completedDaysStreak = 0,
    List<String>? completedDates,
  }) : completedDates = completedDates ?? [];

  HabitItem copyWith({
    String? id,
    String? title,
    String? icon,
    String? colorHex,
    int? targetMinutes,
    int? completedDaysStreak,
    List<String>? completedDates,
  }) {
    return HabitItem(
      id: id ?? this.id,
      title: title ?? this.title,
      icon: icon ?? this.icon,
      colorHex: colorHex ?? this.colorHex,
      targetMinutes: targetMinutes ?? this.targetMinutes,
      completedDaysStreak: completedDaysStreak ?? this.completedDaysStreak,
      completedDates: completedDates ?? this.completedDates,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'icon': icon,
        'colorHex': colorHex,
        'targetMinutes': targetMinutes,
        'completedDaysStreak': completedDaysStreak,
        'completedDates': completedDates,
      };

  factory HabitItem.fromMap(Map<String, dynamic> map) => HabitItem(
        id: map['id'],
        title: map['title'] ?? '',
        icon: map['icon'] ?? '🎯',
        colorHex: map['colorHex'] ?? '#DFDFDF',
        targetMinutes: map['targetMinutes'] ?? 30,
        completedDaysStreak: map['completedDaysStreak'] ?? 0,
        completedDates: List<String>.from(map['completedDates'] ?? []),
      );
}

class UserCategory {
  final String id;
  final String name;
  final String colorHex;
  final String icon;
  final bool isDefault;

  UserCategory({
    required this.id,
    required this.name,
    required this.colorHex,
    required this.icon,
    this.isDefault = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'colorHex': colorHex,
        'icon': icon,
        'isDefault': isDefault,
      };

  factory UserCategory.fromMap(Map<String, dynamic> map) => UserCategory(
        id: map['id'],
        name: map['name'] ?? '',
        colorHex: map['colorHex'] ?? '#DFDFDF',
        icon: map['icon'] ?? '📁',
        isDefault: map['isDefault'] ?? false,
      );
}

class SubjectProgress {
  final String subjectName;
  final double completedHours;
  final double totalTargetHours;
  final String colorHex;

  SubjectProgress({
    required this.subjectName,
    required this.completedHours,
    required this.totalTargetHours,
    required this.colorHex,
  });

  Map<String, dynamic> toMap() => {
        'subjectName': subjectName,
        'completedHours': completedHours,
        'totalTargetHours': totalTargetHours,
        'colorHex': colorHex,
      };

  factory SubjectProgress.fromMap(Map<String, dynamic> map) => SubjectProgress(
        subjectName: map['subjectName'],
        completedHours: (map['completedHours'] as num).toDouble(),
        totalTargetHours: (map['totalTargetHours'] as num).toDouble(),
        colorHex: map['colorHex'] ?? '#DFDFDF',
      );
}

class AISyncResult {
  final String id;
  final String timestamp;
  final String category;
  final String summary;
  final String recommendation;
  final double productivityScore;

  AISyncResult({
    required this.id,
    required this.timestamp,
    required this.category,
    required this.summary,
    required this.recommendation,
    required this.productivityScore,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'timestamp': timestamp,
        'category': category,
        'summary': summary,
        'recommendation': recommendation,
        'productivityScore': productivityScore,
      };

  factory AISyncResult.fromMap(Map<String, dynamic> map) => AISyncResult(
        id: map['id'],
        timestamp: map['timestamp'],
        category: map['category'],
        summary: map['summary'],
        recommendation: map['recommendation'],
        productivityScore: (map['productivityScore'] as num).toDouble(),
      );
}

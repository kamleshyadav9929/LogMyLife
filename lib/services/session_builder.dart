import '../core/constants/app_constants.dart';
import '../domain/models/models.dart';

/// LogMyLife Session Builder Engine
/// Implements logmylife-tracker-session-spec.md (Part B) and Master Spec §10-§11.

class SessionBuilder {
  static String resolveAppTitle(String? packageName) {
    if (packageName == null || packageName.isEmpty) return 'System / Focus Mode';
    for (final preset in AppConstants.popularAppPresets) {
      if (preset.packageName.toLowerCase() == packageName.toLowerCase()) {
        return preset.name;
      }
    }
    final parts = packageName.split('.');
    final last = parts.isNotEmpty ? parts.last : packageName;
    return last.isNotEmpty ? '${last[0].toUpperCase()}${last.substring(1)}' : packageName;
  }

  static String generateSessionId(String? packageName, int timestamp) {
    final cleanPkg = (packageName ?? 'sys').replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');
    return 'sess_${timestamp}_$cleanPkg';
  }

  /// Pure function: Builds bounded ActivitySession[] from sorted, deduped RawActivityEvent[]
  static List<ActivitySession> buildSessionsFromRawEvents(
    List<RawActivityEvent> rawEvents, {
    List<ActivitySession> existingSessions = const [],
  }) {
    if (rawEvents.isEmpty) return existingSessions;

    // 1. Sort chronologically
    final sorted = List<RawActivityEvent>.from(rawEvents)..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    // 2. Deduplicate by eventId
    final deduped = <RawActivityEvent>[];
    final seen = <String>{};
    for (final ev in sorted) {
      if (seen.add(ev.eventId)) {
        deduped.add(ev);
      }
    }

    final sessionMap = <String, ActivitySession>{};
    for (final s in existingSessions) {
      sessionMap[s.id] = s;
    }

    _OpenSession? currentOpen;

    for (final ev in deduped) {
      final isLockOrOff = ev.eventType == RawEventType.screenOff ||
          ev.deviceState == DeviceState.locked ||
          ev.deviceState == DeviceState.idle;

      if (isLockOrOff) {
        if (currentOpen != null) {
          final endedAt = ev.timestamp;
          final durationMs = endedAt - currentOpen.startedAt;
          if (durationMs >= AppConstants.minForegroundMs) {
            final session = ActivitySession(
              id: currentOpen.id,
              sourceType: currentOpen.sourceType,
              packageName: currentOpen.packageName,
              appName: resolveAppTitle(currentOpen.packageName),
              plannedOccurrenceId: null,
              startedAt: currentOpen.startedAt,
              endedAt: endedAt,
              durationSeconds: (durationMs / 1000).round(),
              confidence: ConfidenceLevel.unknown,
              classification: null,
              createdAt: currentOpen.startedAt,
            );
            sessionMap[session.id] = session;
          }
          currentOpen = null;
        }
        continue;
      }

      if (ev.eventType == RawEventType.moveToForeground) {
        if (currentOpen != null) {
          final isSamePkg = currentOpen.packageName == ev.packageName;
          final gap = currentOpen.lastBackgroundAt != null ? ev.timestamp - currentOpen.lastBackgroundAt! : 0;

          if (isSamePkg && gap > 0 && gap <= AppConstants.maxReentryGapMs) {
            // Continuation of same session
            currentOpen.lastForegroundAt = ev.timestamp;
            currentOpen.lastBackgroundAt = null;
            continue;
          }

          // Close previous session
          final endedAt = currentOpen.lastBackgroundAt ?? ev.timestamp;
          final durationMs = endedAt - currentOpen.startedAt;
          if (durationMs >= AppConstants.minForegroundMs) {
            final session = ActivitySession(
              id: currentOpen.id,
              sourceType: currentOpen.sourceType,
              packageName: currentOpen.packageName,
              appName: resolveAppTitle(currentOpen.packageName),
              plannedOccurrenceId: null,
              startedAt: currentOpen.startedAt,
              endedAt: endedAt,
              durationSeconds: (durationMs / 1000).round(),
              confidence: ConfidenceLevel.unknown,
              classification: null,
              createdAt: currentOpen.startedAt,
            );
            sessionMap[session.id] = session;
          }
          currentOpen = null;
        }

        // Open new session
        final id = generateSessionId(ev.packageName, ev.timestamp);
        currentOpen = _OpenSession(
          id: id,
          packageName: ev.packageName,
          sourceType: ev.source == RawEventSource.system ? SessionSourceType.system : SessionSourceType.auto,
          startedAt: ev.timestamp,
          lastForegroundAt: ev.timestamp,
        );
      } else if (ev.eventType == RawEventType.moveToBackground) {
        if (currentOpen != null && currentOpen.packageName == ev.packageName) {
          currentOpen.lastBackgroundAt = ev.timestamp;
        }
      }
    }

    // Process trailing open session if any
    if (currentOpen != null) {
      final endedAt = currentOpen.lastBackgroundAt ?? deduped.last.timestamp;
      final durationMs = endedAt - currentOpen.startedAt;
      if (durationMs >= AppConstants.minForegroundMs) {
        final session = ActivitySession(
          id: currentOpen.id,
          sourceType: currentOpen.sourceType,
          packageName: currentOpen.packageName,
          appName: resolveAppTitle(currentOpen.packageName),
          plannedOccurrenceId: null,
          startedAt: currentOpen.startedAt,
          endedAt: endedAt,
          durationSeconds: (durationMs / 1000).round(),
          confidence: ConfidenceLevel.unknown,
          classification: null,
          createdAt: currentOpen.startedAt,
        );
        sessionMap[session.id] = session;
      }
    }

    final result = sessionMap.values.toList()..sort((a, b) => a.startedAt.compareTo(b.startedAt));
    return result;
  }
}

class _OpenSession {
  final String id;
  final String packageName;
  final SessionSourceType sourceType;
  final int startedAt;
  int lastForegroundAt;
  int? lastBackgroundAt;

  _OpenSession({
    required this.id,
    required this.packageName,
    required this.sourceType,
    required this.startedAt,
    required this.lastForegroundAt,
  });
}

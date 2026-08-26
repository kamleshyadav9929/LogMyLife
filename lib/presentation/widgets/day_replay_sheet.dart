import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/models/models.dart';
import 'novi_card.dart';

/// NOVI — Day Replay & Visual Reality Timeline Sheet
/// Interactive timeline scrub that visually overlays Planned Intent against Actual Device Evidence.

class DayReplaySheet extends StatefulWidget {
  final List<ActivityOccurrence> occurrences;
  final List<ActivitySession> sessions;
  final List<InterruptionRecord> interruptions;

  const DayReplaySheet({
    super.key,
    required this.occurrences,
    required this.sessions,
    required this.interruptions,
  });

  static Future<void> show(
    BuildContext context, {
    required List<ActivityOccurrence> occurrences,
    required List<ActivitySession> sessions,
    required List<InterruptionRecord> interruptions,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => DayReplaySheet(
        occurrences: occurrences,
        sessions: sessions,
        interruptions: interruptions,
      ),
    );
  }

  @override
  State<DayReplaySheet> createState() => _DayReplaySheetState();
}

class _DayReplaySheetState extends State<DayReplaySheet> {
  double _sliderMinutes = 540; // Defaults to 9:00 AM (9 * 60)

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final scrubHours = _sliderMinutes ~/ 60;
    final scrubMins = (_sliderMinutes % 60).round();
    final timeStr = DateFormat('h:mm a').format(DateTime(2026, 1, 1, scrubHours, scrubMins));

    // Find planned occurrence at this instant
    final plannedOcc = widget.occurrences.cast<ActivityOccurrence?>().firstWhere(
      (occ) {
        if (occ == null) return false;
        final startMins = occ.plannedStart.hour * 60 + occ.plannedStart.minute;
        final endMins = occ.plannedEnd.hour * 60 + occ.plannedEnd.minute;
        return _sliderMinutes >= startMins && _sliderMinutes <= endMins;
      },
      orElse: () => null,
    );

    // Find actual session at this instant
    final actualSession = widget.sessions.cast<ActivitySession?>().firstWhere(
      (s) {
        if (s == null) return false;
        final startDt = DateTime.fromMillisecondsSinceEpoch(s.startedAt);
        final startMins = startDt.hour * 60 + startDt.minute;
        final endDt = s.endedAt != null
            ? DateTime.fromMillisecondsSinceEpoch(s.endedAt!)
            : DateTime.fromMillisecondsSinceEpoch(s.startedAt + (s.durationSeconds ?? 0) * 1000);
        final endMins = endDt.hour * 60 + endDt.minute;
        return _sliderMinutes >= startMins && _sliderMinutes <= endMins;
      },
      orElse: () => null,
    );

    // Check if interruption recorded
    final activeInterruption = widget.interruptions.cast<InterruptionRecord?>().firstWhere(
      (ir) {
        if (ir == null) return false;
        final dt = DateTime.fromMillisecondsSinceEpoch(ir.startedAt);
        final irMins = dt.hour * 60 + dt.minute;
        return (_sliderMinutes - irMins).abs() < 15;
      },
      orElse: () => null,
    );

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.7,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          NoviSpacing.space16, NoviSpacing.space8,
          NoviSpacing.space16, NoviSpacing.space16,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Day Replay',
                    style: textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'Scrub through your day to compare plan vs reality',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: NoviSpacing.space12,
                  vertical: NoviSpacing.space6,
                ),
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                ),
                child: Text(
                  timeStr,
                  style: textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: NoviSpacing.space20),

          // Interactive Timeline Slider with haptic ticks
          Slider(
            value: _sliderMinutes,
            min: 0,
            max: 1440,
            divisions: 96, // 15-minute resolution increments
            onChanged: (val) {
              if ((val - _sliderMinutes).abs() >= 15) {
                NoviHaptics.selection();
              }
              setState(() => _sliderMinutes = val);
            },
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('12:00 AM', style: textTheme.labelSmall),
                Text('12:00 PM', style: textTheme.labelSmall),
                Text('11:59 PM', style: textTheme.labelSmall),
              ],
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),

          // Comparison Cards with smooth container animation
          Expanded(
            child: ListView(
              children: [
                // Planned Intent Card
                NoviCard(
                  padding: const EdgeInsets.all(NoviSpacing.space16),
                  backgroundColor: plannedOcc != null
                      ? colorScheme.primaryContainer.withValues(alpha: 0.6)
                      : colorScheme.surfaceContainerLow,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today_rounded,
                            size: 16,
                            color: colorScheme.primary,
                          ),
                          const SizedBox(width: NoviSpacing.space8),
                          Text(
                            'Planned Schedule',
                            style: textTheme.labelSmall?.copyWith(
                              color: colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          if (plannedOcc != null)
                            Text(
                              '${DateFormat('h:mm a').format(plannedOcc.plannedStart)} – ${DateFormat('h:mm a').format(plannedOcc.plannedEnd)}',
                              style: textTheme.labelSmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: NoviSpacing.space8),
                      Text(
                        plannedOcc?.parentActivityTitle ?? 'No activity planned at this instant',
                        style: textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: NoviSpacing.space12),

                // Actual Device Evidence Card
                NoviCard(
                  padding: const EdgeInsets.all(NoviSpacing.space16),
                  backgroundColor: actualSession != null
                      ? colorScheme.secondaryContainer.withValues(alpha: 0.6)
                      : colorScheme.surfaceContainerLow,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.phone_android_rounded,
                            size: 16,
                            color: colorScheme.secondary,
                          ),
                          const SizedBox(width: NoviSpacing.space8),
                          Text(
                            'Actual Device Activity',
                            style: textTheme.labelSmall?.copyWith(
                              color: colorScheme.secondary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          if (actualSession != null)
                            Text(
                              actualSession.confidence == ConfidenceLevel.high
                                  ? 'High confidence'
                                  : 'Diagnostic',
                              style: textTheme.labelSmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: NoviSpacing.space8),
                      Text(
                        actualSession != null
                            ? '${actualSession.appName} (${actualSession.packageName ?? 'Timer'})'
                            : 'Device idle or locked',
                        style: textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (activeInterruption != null) ...[
                        const SizedBox(height: NoviSpacing.space8),
                        Container(
                          padding: const EdgeInsets.all(NoviSpacing.space8),
                          decoration: BoxDecoration(
                            color: colorScheme.errorContainer,
                            borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.warning_amber_rounded,
                                size: 16,
                                color: colorScheme.onErrorContainer,
                              ),
                              const SizedBox(width: NoviSpacing.space8),
                              Expanded(
                                child: Text(
                                  'Context switch: ${activeInterruption.durationSeconds ~/ 60}m interruption noted.',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onErrorContainer,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }
}

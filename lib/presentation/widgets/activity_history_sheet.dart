import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../services/reconciliation_engine.dart';
import 'novi_card.dart';
import 'novi_pressable.dart';
import 'add_activity_modal.dart';

/// NOVI — Activity Evidence & Reconciliation Bottom Sheet
/// Shows audited high-confidence usage sessions and diagnostic evidence bound to an occurrence.
/// Enhanced with tactile press responses and smooth transitions.

class ActivityHistorySheet extends StatelessWidget {
  final ActivityOccurrence occurrence;
  final List<ActivitySession> sessions;
  final List<InterruptionRecord> interruptions;
  final VoidCallback? onOccurrenceUpdated;

  const ActivityHistorySheet({
    super.key,
    required this.occurrence,
    required this.sessions,
    required this.interruptions,
    this.onOccurrenceUpdated,
  });

  static Future<void> show(
    BuildContext context, {
    required ActivityOccurrence occurrence,
    required List<ActivitySession> sessions,
    required List<InterruptionRecord> interruptions,
    VoidCallback? onOccurrenceUpdated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => ActivityHistorySheet(
        occurrence: occurrence,
        sessions: sessions,
        interruptions: interruptions,
        onOccurrenceUpdated: onOccurrenceUpdated,
      ),
    );
  }

  Future<void> _toggleCompletion(BuildContext context) async {
    NoviHaptics.selection();
    final newStatus = occurrence.status == OccurrenceStatus.completed
        ? OccurrenceStatus.scheduled
        : OccurrenceStatus.completed;

    final updated = occurrence.copyWith(status: newStatus);
    await LocalStore.updateOccurrence(updated);
    onOccurrenceUpdated?.call();
    if (context.mounted) Navigator.pop(context);
  }

  Future<void> _deleteOccurrence(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Activity Block'),
        content: Text('Are you sure you want to remove "${occurrence.parentActivityTitle ?? 'this activity'}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      NoviHaptics.medium();
      await LocalStore.deleteOccurrence(occurrence.id);
      onOccurrenceUpdated?.call();
      if (context.mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final stats = ReconciliationEngine.calculateCompletion(
      occurrence: occurrence,
      sessions: sessions,
      interruptions: interruptions,
    );

    final boundSessions = sessions.where((s) => s.plannedOccurrenceId == occurrence.id && s.confidence == ConfidenceLevel.high).toList();
    final relatedSessions = sessions.where((s) {
      if (boundSessions.contains(s)) return false;
      final startMs = occurrence.plannedStart.millisecondsSinceEpoch;
      final endMs = occurrence.plannedEnd.millisecondsSinceEpoch;
      return s.startedAt < endMs && (s.endedAt ?? s.startedAt) > startMs;
    }).toList();

    final isCompleted = occurrence.status == OccurrenceStatus.completed;

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.65,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          NoviSpacing.space16, NoviSpacing.space8,
          NoviSpacing.space16, NoviSpacing.space16,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? colorScheme.secondaryContainer
                      : colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isCompleted
                      ? Icons.check_rounded
                      : (occurrence.timerRequired ? Icons.timer_outlined : Icons.calendar_today_rounded),
                  size: 20,
                  color: isCompleted
                      ? colorScheme.onSecondaryContainer
                      : colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(width: NoviSpacing.space14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      occurrence.parentActivityTitle ?? 'Activity Details',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space2),
                    Text(
                      '${DateFormat('h:mm a').format(occurrence.plannedStart)} – ${DateFormat('h:mm a').format(occurrence.plannedEnd)}',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit Block',
                onPressed: () {
                  Navigator.pop(context);
                  AddActivityModal.show(
                    context,
                    existingOccurrence: occurrence,
                    onActivityAdded: () => onOccurrenceUpdated?.call(),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded),
                tooltip: 'Delete Block',
                color: colorScheme.error,
                onPressed: () => _deleteOccurrence(context),
              ),
            ],
          ),
          const SizedBox(height: NoviSpacing.space16),

          // Metrics Summary Cards
          Row(
            children: [
              Expanded(
                child: NoviCard(
                  padding: const EdgeInsets.all(NoviSpacing.space12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Audited Focus Time',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: NoviSpacing.space4),
                      Text(
                        '${(stats.validDurationSeconds / 60).round()} mins',
                        style: textTheme.titleSmall?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                child: NoviCard(
                  padding: const EdgeInsets.all(NoviSpacing.space12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Target Duration',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: NoviSpacing.space4),
                      Text(
                        '${(occurrence.durationSeconds / 60).round()} mins',
                        style: textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: NoviSpacing.space12),

          // Action Status Button
          NoviPressable(
            enableHaptics: true,
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _toggleCompletion(context),
                icon: Icon(
                  isCompleted ? Icons.restart_alt_rounded : Icons.check_circle_outline_rounded,
                  size: 18,
                ),
                label: Text(isCompleted ? 'Mark as Incomplete / Scheduled' : 'Mark as Completed (+100 XP)'),
              ),
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),

          Text(
            'Audited Device Evidence',
            style: textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: NoviSpacing.space8),

          Expanded(
            child: ListView(
              children: [
                if (boundSessions.isEmpty && relatedSessions.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(NoviSpacing.space20),
                    child: Center(
                      child: Text(
                        'No device sessions recorded yet for this block.',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ...boundSessions.map((s) => NoviCard(
                      margin: const EdgeInsets.only(bottom: NoviSpacing.space8),
                      padding: const EdgeInsets.all(NoviSpacing.space12),
                      backgroundColor: colorScheme.secondaryContainer,
                      borderColor: colorScheme.secondary.withValues(alpha: 0.2),
                      child: Row(
                        children: [
                          Icon(
                            Icons.check_circle_outline_rounded,
                            size: 18,
                            color: colorScheme.onSecondaryContainer,
                          ),
                          const SizedBox(width: NoviSpacing.space10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.appName,
                                  style: textTheme.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: colorScheme.onSecondaryContainer,
                                  ),
                                ),
                                Text(
                                  '${(s.durationSeconds ?? 0) ~/ 60}m duration · High confidence',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSecondaryContainer.withValues(alpha: 0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
                ...relatedSessions.map((s) => NoviCard(
                      margin: const EdgeInsets.only(bottom: NoviSpacing.space8),
                      padding: const EdgeInsets.all(NoviSpacing.space12),
                      backgroundColor: colorScheme.surfaceContainerHigh,
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            size: 18,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: NoviSpacing.space10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.appName,
                                  style: textTheme.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  '${(s.durationSeconds ?? 0) ~/ 60}m duration · Overlapping activity',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }
}

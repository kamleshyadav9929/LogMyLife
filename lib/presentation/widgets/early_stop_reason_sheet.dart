import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'novi_pressable.dart';

class EarlyStopResult {
  final String reason;
  final bool markAsCompleted;

  const EarlyStopResult({
    required this.reason,
    this.markAsCompleted = false,
  });
}

/// Modal sheet presented when user stops/pauses a timer before 80% completion.
class EarlyStopReasonSheet extends StatefulWidget {
  final String taskTitle;
  final int completedSeconds;
  final int targetDurationSeconds;

  const EarlyStopReasonSheet({
    super.key,
    required this.taskTitle,
    required this.completedSeconds,
    required this.targetDurationSeconds,
  });

  static Future<EarlyStopResult?> show(
    BuildContext context, {
    required String taskTitle,
    required int completedSeconds,
    required int targetDurationSeconds,
  }) {
    return showModalBottomSheet<EarlyStopResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      builder: (ctx) => EarlyStopReasonSheet(
        taskTitle: taskTitle,
        completedSeconds: completedSeconds,
        targetDurationSeconds: targetDurationSeconds,
      ),
    );
  }

  @override
  State<EarlyStopReasonSheet> createState() => _EarlyStopReasonSheetState();
}

class _EarlyStopReasonSheetState extends State<EarlyStopReasonSheet> {
  String? _selectedReason = 'Distracted / Phone notification';
  final TextEditingController _customNoteController = TextEditingController();

  static const List<Map<String, dynamic>> _reasons = [
    {
      'label': 'Distracted / Phone notification',
      'icon': Icons.phonelink_ring_rounded,
      'isCompletion': false,
    },
    {
      'label': 'Interrupted by someone / Urgent request',
      'icon': Icons.people_outline_rounded,
      'isCompletion': false,
    },
    {
      'label': 'Finished task earlier than expected',
      'icon': Icons.task_alt_rounded,
      'isCompletion': true,
    },
    {
      'label': 'Mental fatigue / Need a short break',
      'icon': Icons.coffee_outlined,
      'isCompletion': false,
    },
    {
      'label': 'Switched to a higher priority task',
      'icon': Icons.swap_horiz_rounded,
      'isCompletion': false,
    },
  ];

  @override
  void dispose() {
    _customNoteController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    NoviHaptics.medium();
    final chosenOption = _reasons.firstWhere(
      (r) => r['label'] == _selectedReason,
      orElse: () => _reasons.first,
    );

    final isEarlyCompletion = chosenOption['isCompletion'] == true;
    final note = _customNoteController.text.trim();
    final fullReason = note.isNotEmpty
        ? '$_selectedReason ($note)'
        : (_selectedReason ?? 'Paused early');

    Navigator.of(context).pop(EarlyStopResult(
      reason: fullReason,
      markAsCompleted: isEarlyCompletion,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final completedMins = (widget.completedSeconds / 60).toStringAsFixed(1);
    final targetMins = (widget.targetDurationSeconds / 60).round();
    final progressPct = widget.targetDurationSeconds > 0
        ? (widget.completedSeconds / widget.targetDurationSeconds).clamp(0.0, 1.0)
        : 0.0;
    final pctString = (progressPct * 100).round();

    return Padding(
      padding: EdgeInsets.only(
        left: NoviSpacing.space20,
        right: NoviSpacing.space20,
        top: NoviSpacing.space16,
        bottom: MediaQuery.of(context).viewInsets.bottom + NoviSpacing.space24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.pause_circle_outline_rounded, color: colorScheme.primary, size: 22),
                  const SizedBox(width: NoviSpacing.space8),
                  Text(
                    'Focus Paused Early',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.of(context).pop(
                  EarlyStopResult(reason: _selectedReason ?? 'Paused early'),
                ),
              ),
            ],
          ),
          const SizedBox(height: NoviSpacing.space8),

          // Progress Banner
          Container(
            padding: const EdgeInsets.all(NoviSpacing.space12),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        widget.taskTitle,
                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '$pctString% ($completedMins / ${targetMins}m)',
                      style: textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                  child: LinearProgressIndicator(
                    value: progressPct,
                    minHeight: 5,
                    backgroundColor: colorScheme.surfaceContainerHigh,
                    color: colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),

          Text(
            'Why did you stop before your target duration?',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: NoviSpacing.space10),

          // 5 Options
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _reasons.length,
            separatorBuilder: (_, __) => const SizedBox(height: 6),
            itemBuilder: (context, index) {
              final r = _reasons[index];
              final label = r['label'] as String;
              final icon = r['icon'] as IconData;
              final isSelected = _selectedReason == label;

              return NoviPressable(
                onTap: () {
                  NoviHaptics.selection();
                  setState(() => _selectedReason = label);
                },
                child: AnimatedContainer(
                  duration: NoviMotion.duration(context, NoviMotion.fast),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? colorScheme.primaryContainer.withValues(alpha: 0.5)
                        : colorScheme.surfaceContainer,
                    borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        icon,
                        size: 18,
                        color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: NoviSpacing.space12),
                      Expanded(
                        child: Text(
                          label,
                          style: textTheme.bodySmall?.copyWith(
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? colorScheme.onSurface : colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                      if (isSelected)
                        Icon(Icons.check_circle_rounded, size: 18, color: colorScheme.primary),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: NoviSpacing.space20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pop(
                      const EarlyStopResult(reason: 'Finished early', markAsCompleted: true),
                    );
                  },
                  child: const Text('Mark Done'),
                ),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _handleSubmit,
                  child: const Text('Save & Resume Later'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

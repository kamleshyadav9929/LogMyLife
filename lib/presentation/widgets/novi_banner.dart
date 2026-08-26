import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/models/models.dart';

/// NOVI — Contextual Material 3 Schedule Notification Banner
/// Informs user of smooth auto-shift changes with a quick Undo action.

class NoviBanner extends StatelessWidget {
  final RescheduleEvent event;
  final VoidCallback onUndo;
  final VoidCallback onDismiss;

  const NoviBanner({
    super.key,
    required this.event,
    required this.onUndo,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final count = event.changes.length;

    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space16,
        vertical: NoviSpacing.space8,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space16,
        vertical: NoviSpacing.space12,
      ),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(NoviShapes.radiusCard),
        border: Border.all(
          color: colorScheme.primary.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.schedule_send_rounded,
            size: 20,
            color: colorScheme.onPrimaryContainer,
          ),
          const SizedBox(width: NoviSpacing.space12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Schedule adjusted',
                  style: textTheme.titleSmall?.copyWith(
                    color: colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$count ${count == 1 ? 'item' : 'items'} shifted smoothly',
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onUndo,
            style: TextButton.styleFrom(
              foregroundColor: colorScheme.primary,
              padding: const EdgeInsets.symmetric(
                horizontal: NoviSpacing.space12,
                vertical: NoviSpacing.space4,
              ),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Undo'),
          ),
          IconButton(
            icon: Icon(
              Icons.close_rounded,
              size: 18,
              color: colorScheme.onPrimaryContainer.withValues(alpha: 0.6),
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            onPressed: onDismiss,
          ),
        ],
      ),
    );
  }
}

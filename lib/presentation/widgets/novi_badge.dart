import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'novi_pressable.dart';

/// NOVI — Rhythm Consistency Badge
/// Calm, non-anxious indicator of daily routine continuity with tactile touch response.

class NoviBadge extends StatelessWidget {
  final int streakDays;
  final VoidCallback? onTap;
  final String? label;

  const NoviBadge({
    super.key,
    required this.streakDays,
    this.onTap,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    Widget badgeContent = AnimatedContainer(
      duration: NoviMotion.duration(context, NoviMotion.feedback),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space12,
        vertical: NoviSpacing.space8,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.repeat_rounded,
            size: 15,
            color: colorScheme.primary,
          ),
          const SizedBox(width: NoviSpacing.space6),
          Text(
            label ?? '$streakDays days rhythm',
            style: textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurface,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return NoviPressable(
        onTap: onTap,
        enableHaptics: true,
        child: badgeContent,
      );
    }

    return badgeContent;
  }
}

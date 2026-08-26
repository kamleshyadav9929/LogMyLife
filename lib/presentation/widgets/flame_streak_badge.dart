import 'package:flutter/material.dart';
import 'novi_badge.dart';

/// Legacy alias for NoviBadge
class FlameStreakBadge extends StatelessWidget {
  final int streakDays;
  final int xpPoints;
  final int level;
  final VoidCallback? onTap;

  const FlameStreakBadge({
    super.key,
    required this.streakDays,
    this.xpPoints = 0,
    this.level = 1,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return NoviBadge(
      streakDays: streakDays,
      onTap: onTap,
    );
  }
}

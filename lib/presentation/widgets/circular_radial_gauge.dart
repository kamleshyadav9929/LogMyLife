import 'package:flutter/material.dart';
import 'novi_radial_gauge.dart';

/// Legacy alias for NoviRadialGauge
class CircularRadialGauge extends StatelessWidget {
  final double progress;
  final double currentHours;
  final double targetHours;
  final double size;

  const CircularRadialGauge({
    super.key,
    required this.progress,
    required this.currentHours,
    required this.targetHours,
    this.size = 140,
  });

  @override
  Widget build(BuildContext context) {
    return NoviRadialGauge(
      progress: progress,
      currentHours: currentHours,
      targetHours: targetHours,
      size: size,
    );
  }
}

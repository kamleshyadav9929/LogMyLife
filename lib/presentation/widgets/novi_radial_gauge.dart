import 'dart:math';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// NOVI — Material 3 Dual-Tone Focus Progress Ring
/// Calm, elegant circular gauge displaying focus hours vs daily intention.
/// Uses continuous tween interpolation to synchronize progress ring and numbers.

class NoviRadialGauge extends StatelessWidget {
  final double progress; // 0.0 to 1.0+
  final double currentHours;
  final double targetHours;
  final double size;

  const NoviRadialGauge({
    super.key,
    required this.progress,
    required this.currentHours,
    required this.targetHours,
    this.size = 140,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final clampedProgress = progress.clamp(0.0, 1.0);

    return SizedBox(
      width: size,
      height: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 0.0, end: clampedProgress),
        duration: NoviMotion.duration(context, NoviMotion.medium),
        curve: NoviMotion.easeInOut,
        builder: (context, animProgress, child) {
          final animPercentage = (animProgress * 100).clamp(0, 999).round();
          final animHours = animProgress * targetHours;

          return Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(size, size),
                painter: _NoviGaugePainter(
                  progress: animProgress,
                  trackColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                  progressColor: colorScheme.primary,
                  strokeWidth: size * 0.09,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$animPercentage%',
                    style: (size >= 130
                            ? textTheme.headlineMedium
                            : textTheme.titleLarge)
                        ?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: NoviSpacing.space4),
                  Text(
                    '${animHours.toStringAsFixed(1)} / ${targetHours.toStringAsFixed(0)}h',
                    style: textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NoviGaugePainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  _NoviGaugePainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    const startAngle = -pi / 2;
    const sweepTotalAngle = 2 * pi;

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    if (progress > 0) {
      final progressPaint = Paint()
        ..color = progressColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      final sweepAngle = sweepTotalAngle * progress;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _NoviGaugePainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}

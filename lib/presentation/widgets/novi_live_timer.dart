import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/timer_engine.dart';
import 'novi_pressable.dart';

/// NOVI — Material 3 Persistent Live Focus Bar
/// Glides smoothly above bottom navigation when a focus interval is active.
/// Animates entrance / exit seamlessly and pulses a calm breathing status indicator.

class NoviLiveTimer extends StatefulWidget {
  const NoviLiveTimer({super.key});

  @override
  State<NoviLiveTimer> createState() => _NoviLiveTimerState();
}

class _NoviLiveTimerState extends State<NoviLiveTimer> with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ActiveTimerState?>(
      valueListenable: TimerEngine.activeTimerNotifier,
      builder: (context, activeTimer, child) {
        final isVisible = activeTimer != null;
        final theme = Theme.of(context);
        final colorScheme = theme.colorScheme;
        final textTheme = theme.textTheme;

        final elapsed = activeTimer?.elapsedSeconds ?? 0;
        final target = activeTimer?.targetDurationSeconds ?? 0;
        final remaining = (target - elapsed).clamp(0, target);
        final minutes = remaining ~/ 60;
        final seconds = remaining % 60;
        final formattedTime =
            '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

        return AnimatedSlide(
          offset: isVisible ? Offset.zero : const Offset(0, 1.2),
          duration: NoviMotion.duration(context, NoviMotion.standard),
          curve: isVisible ? NoviMotion.emphasizedDecelerate : NoviMotion.easeIn,
          child: AnimatedOpacity(
            opacity: isVisible ? 1.0 : 0.0,
            duration: NoviMotion.duration(context, NoviMotion.shortDuration),
            curve: NoviMotion.easeInOut,
            child: IgnorePointer(
              ignoring: !isVisible,
              child: SafeArea(
                child: Container(
                  margin: const EdgeInsets.symmetric(
                    horizontal: NoviSpacing.space16,
                    vertical: NoviSpacing.space8,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: NoviSpacing.space16,
                    vertical: NoviSpacing.space10,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                    border: Border.all(
                      color: colorScheme.outlineVariant,
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Breathing status dot
                      if (activeTimer?.isRunning ?? false)
                        FadeTransition(
                          opacity: Tween<double>(begin: 0.4, end: 1.0).animate(_pulseController),
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: colorScheme.secondary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        )
                      else
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: colorScheme.tertiary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      const SizedBox(width: NoviSpacing.space12),
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activeTimer?.title ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '$formattedTime remaining',
                              style: textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      NoviPressable(
                        enableHaptics: true,
                        onTap: () {
                          if (activeTimer?.isRunning ?? false) {
                            TimerEngine.pauseTimer();
                          } else {
                            TimerEngine.resumeTimer();
                          }
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(NoviSpacing.space6),
                          child: NoviMorphIcon(
                            icon: (activeTimer?.isRunning ?? false)
                                ? Icons.pause_rounded
                                : Icons.play_arrow_rounded,
                            size: 22,
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ),
                      const SizedBox(width: NoviSpacing.space4),
                      NoviPressable(
                        enableHaptics: true,
                        onTap: () async {
                          await TimerEngine.stopTimer();
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(NoviSpacing.space6),
                          child: Icon(
                            Icons.stop_rounded,
                            size: 22,
                            color: colorScheme.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/timer_engine.dart';

/// NOVI — Deep Focus Mode (AMOLED Zen View)
/// Fullscreen distraction-free interface with high-contrast minimalist typography,
/// gentle breathing aura, active intention reminder, and single-tap flow controls.

class DeepFocusOverlay extends StatefulWidget {
  final VoidCallback onExit;

  const DeepFocusOverlay({super.key, required this.onExit});

  @override
  State<DeepFocusOverlay> createState() => _DeepFocusOverlayState();
}

class _DeepFocusOverlayState extends State<DeepFocusOverlay> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NoviColors.charcoalDeep,
      body: SafeArea(
        child: ValueListenableBuilder<ActiveTimerState?>(
          valueListenable: TimerEngine.activeTimerNotifier,
          builder: (context, activeTimer, child) {
            final isRunning = activeTimer?.isRunning ?? false;
            final isPaused = activeTimer?.isPaused ?? false;
            final targetSec = activeTimer?.targetDurationSeconds ?? 25 * 60;
            final elapsedSec = activeTimer?.elapsedSeconds ?? 0;
            final remainingSec = (targetSec - elapsedSec).clamp(0, targetSec);
            final progress = targetSec > 0 ? (elapsedSec / targetSec).clamp(0.0, 1.0) : 0.0;

            final mins = remainingSec ~/ 60;
            final secs = remainingSec % 60;
            final timeStr = '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';

            final taskTitle = activeTimer?.title ?? 'Deep Focus Session';
            final intention = activeTimer?.intentionText;
            final soundMix = activeTimer?.soundMix;

            return Stack(
              children: [
                // Background subtle pulse aura
                Positioned.fill(
                  child: Center(
                    child: AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: isRunning ? _pulseAnimation.value : 1.0,
                          child: Container(
                            width: 280,
                            height: 280,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  (isPaused ? NoviColors.charcoalDialog : NoviColors.primaryDark)
                                      .withValues(alpha: isRunning ? 0.22 : 0.08),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                // Top Minimal Navigation Bar
                Positioned(
                  top: NoviSpacing.space16,
                  left: NoviSpacing.space20,
                  right: NoviSpacing.space20,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Mode pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: NoviColors.charcoalSurface,
                          borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                          border: Border.all(color: NoviColors.borderSubtle),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.lens_rounded, size: 8, color: NoviColors.primaryDark),
                            SizedBox(width: 6),
                            Text(
                              'Deep Focus Active',
                              style: TextStyle(color: NoviColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      // Exit button
                      IconButton(
                        onPressed: () {
                          NoviHaptics.light();
                          widget.onExit();
                        },
                        icon: const Icon(Icons.fullscreen_exit_rounded, color: NoviColors.textSecondary, size: 24),
                        tooltip: 'Exit Zen Mode',
                      ),
                    ],
                  ),
                ),

                // Center Clock & Progress
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Circular Minimal Sweeping Countdown
                        GestureDetector(
                          onTap: () {
                            NoviHaptics.medium();
                            if (isRunning) {
                              TimerEngine.pauseTimer();
                            } else {
                              TimerEngine.resumeTimer();
                            }
                          },
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                timeStr,
                                style: const TextStyle(
                                  fontSize: 68,
                                  fontWeight: FontWeight.w200,
                                  letterSpacing: -2.0,
                                  color: NoviColors.textPrimary,
                                  fontFeatures: [FontFeature.tabularFigures()],
                                ),
                              ),
                              const SizedBox(height: NoviSpacing.space4),
                              // Mini horizontal progress line
                              Container(
                                width: 140,
                                height: 3,
                                decoration: BoxDecoration(
                                  color: NoviColors.borderSubtle,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                                alignment: Alignment.centerLeft,
                                child: FractionallySizedBox(
                                  widthFactor: progress,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: isPaused ? NoviColors.textTertiary : NoviColors.primaryDark,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // State pill
                        Container(
                          margin: const EdgeInsets.only(top: NoviSpacing.space12, bottom: NoviSpacing.space20),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPaused ? NoviColors.charcoalSheet : NoviColors.primaryContainerDark,
                            borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                            border: Border.all(color: isPaused ? NoviColors.borderSubtle : NoviColors.primaryDark),
                          ),
                          child: Text(
                            isRunning ? 'Tap time to pause' : (isPaused ? 'Paused · Tap to resume' : 'Ready'),
                            style: TextStyle(
                              color: isPaused ? NoviColors.textSecondary : NoviColors.onPrimaryContainerDark,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                        // Task title
                        Text(
                          taskTitle,
                          style: const TextStyle(
                            color: NoviColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.2,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: NoviSpacing.space16),

                        // Active Intention card
                        if (intention != null && intention.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: NoviColors.charcoalSurface,
                              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                              border: Border.all(color: NoviColors.borderSubtle),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.center_focus_strong_rounded, size: 16, color: NoviColors.primaryDark),
                                const SizedBox(width: 10),
                                Flexible(
                                  child: Text(
                                    intention,
                                    style: const TextStyle(
                                      color: NoviColors.textCardTitle,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: NoviSpacing.space16),
                        ],

                        // Ambient Soundscape Indicator
                        if (soundMix != null && soundMix.isPlaying) ...[
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.headphones_rounded, size: 14, color: NoviColors.textSecondary),
                              const SizedBox(width: 6),
                              Text(
                                soundMix.name,
                                style: const TextStyle(color: NoviColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                // Bottom Minimal Action Controls
                Positioned(
                  bottom: NoviSpacing.space28,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // +5 Min button
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: NoviColors.textCardTitle,
                          side: const BorderSide(color: NoviColors.borderMuted),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(NoviShapes.radiusPill)),
                        ),
                        onPressed: () {
                          NoviHaptics.light();
                          TimerEngine.extendTimer(300);
                        },
                        child: const Text('+5 min'),
                      ),
                      const SizedBox(width: NoviSpacing.space16),
                      // Finish early button
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: NoviColors.error,
                          side: const BorderSide(color: NoviColors.borderMuted),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(NoviShapes.radiusPill)),
                        ),
                        onPressed: () async {
                          NoviHaptics.medium();
                          await TimerEngine.stopTimer();
                          widget.onExit();
                        },
                        icon: const Icon(Icons.stop_rounded, size: 18),
                        label: const Text('Complete'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

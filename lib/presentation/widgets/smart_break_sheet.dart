import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'novi_card.dart';
import 'novi_pressable.dart';

/// NOVI — Smart Break & Recovery Sheet
/// Contextual restorative breaks with animated Box Breathing (4-4-4-4),
/// eye rest prompts, postural stretch guides, and hydration logging.

class SmartBreakSheet extends StatefulWidget {
  final int breakMinutes;
  final String parentTask;
  final VoidCallback onStartNextSession;
  final VoidCallback onEndBreak;

  const SmartBreakSheet({
    super.key,
    required this.breakMinutes,
    required this.parentTask,
    required this.onStartNextSession,
    required this.onEndBreak,
  });

  static Future<void> show(
    BuildContext context, {
    required int breakMinutes,
    required String parentTask,
    required VoidCallback onStartNextSession,
    required VoidCallback onEndBreak,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SmartBreakSheet(
        breakMinutes: breakMinutes,
        parentTask: parentTask,
        onStartNextSession: onStartNextSession,
        onEndBreak: onEndBreak,
      ),
    );
  }

  @override
  State<SmartBreakSheet> createState() => _SmartBreakSheetState();
}

class _SmartBreakSheetState extends State<SmartBreakSheet> with SingleTickerProviderStateMixin {
  late int _remainingSeconds;
  Timer? _timer;
  bool _isPaused = false;
  int _selectedActivityIndex = 0; // 0: Breathing, 1: Eye Rest, 2: Stretch, 3: Water

  // Box Breathing Animation (16s cycle: 4s inhale, 4s hold, 4s exhale, 4s hold)
  late AnimationController _breathingController;
  late Animation<double> _breathingScaleAnimation;
  String _breathingPhaseText = 'Inhale deeply...';

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.breakMinutes * 60;
    _startTimer();

    _breathingController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 16),
    )..repeat();

    _breathingScaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween<double>(begin: 0.8, end: 1.25).chain(CurveTween(curve: Curves.easeInOut)), weight: 25), // Inhale 4s
      TweenSequenceItem(tween: ConstantTween<double>(1.25), weight: 25), // Hold 4s
      TweenSequenceItem(tween: Tween<double>(begin: 1.25, end: 0.8).chain(CurveTween(curve: Curves.easeInOut)), weight: 25), // Exhale 4s
      TweenSequenceItem(tween: ConstantTween<double>(0.8), weight: 25), // Hold 4s
    ]).animate(_breathingController);

    _breathingController.addListener(() {
      final val = _breathingController.value;
      String phase;
      if (val < 0.25) {
        phase = 'Inhale deeply (4s)';
      } else if (val < 0.50) {
        phase = 'Hold breath gently (4s)';
      } else if (val < 0.75) {
        phase = 'Exhale slowly (4s)';
      } else {
        phase = 'Rest & hold (4s)';
      }
      if (phase != _breathingPhaseText && mounted) {
        setState(() => _breathingPhaseText = phase);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _breathingController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!_isPaused && _remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else if (_remainingSeconds <= 0) {
        _timer?.cancel();
        NoviHaptics.success();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final mins = _remainingSeconds ~/ 60;
    final secs = _remainingSeconds % 60;
    final timeStr = '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      padding: const EdgeInsets.fromLTRB(
        NoviSpacing.space20, NoviSpacing.space12,
        NoviSpacing.space20, NoviSpacing.space24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: NoviSpacing.space12),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colorScheme.secondaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.spa_rounded, color: colorScheme.onSecondaryContainer, size: 20),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Smart Recovery Break',
                      style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      'Recharging after ${widget.parentTask}',
                      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Timer countdown badge with pause/resume toggle
              GestureDetector(
                onTap: () {
                  NoviHaptics.light();
                  setState(() => _isPaused = !_isPaused);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colorScheme.secondaryContainer.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                    border: Border.all(color: colorScheme.secondary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                        size: 14,
                        color: colorScheme.secondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        timeStr,
                        style: textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.secondary,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: NoviSpacing.space16),

          // Rest Activity Switcher Tabs
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildTabPill(index: 0, label: 'Breathing', icon: Icons.air_rounded),
              _buildTabPill(index: 1, label: 'Eye Rest', icon: Icons.visibility_outlined),
              _buildTabPill(index: 2, label: 'Stretch', icon: Icons.accessibility_new_rounded),
              _buildTabPill(index: 3, label: 'Hydration', icon: Icons.water_drop_outlined),
            ],
          ),

          const SizedBox(height: NoviSpacing.space16),

          // Micro-Action Active Card
          AnimatedSwitcher(
            duration: NoviMotion.duration(context, NoviMotion.fast),
            child: _buildActionContent(),
          ),

          const SizedBox(height: NoviSpacing.space20),

          // Bottom Controls
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    NoviHaptics.light();
                    setState(() => _remainingSeconds += 120);
                  },
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: const Text('+2 min'),
                ),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: () {
                    NoviHaptics.medium();
                    Navigator.pop(context);
                    widget.onStartNextSession();
                  },
                  icon: const Icon(Icons.play_arrow_rounded, size: 20),
                  label: const Text('Start Next Session'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabPill({required int index, required String label, required IconData icon}) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isSelected = _selectedActivityIndex == index;

    return NoviPressable(
      onTap: () {
        NoviHaptics.selection();
        setState(() => _selectedActivityIndex = index);
      },
      child: AnimatedContainer(
        duration: NoviMotion.duration(context, NoviMotion.fast),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? colorScheme.secondaryContainer : colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
          border: Border.all(
            color: isSelected ? colorScheme.secondary : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? colorScheme.onSecondaryContainer : colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? colorScheme.onSecondaryContainer : colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionContent() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    switch (_selectedActivityIndex) {
      case 0: // Box Breathing
        return NoviCard(
          key: const ValueKey('breathing'),
          padding: const EdgeInsets.all(NoviSpacing.space20),
          child: Column(
            children: [
              Text(
                'Box Breathing (4-4-4-4)',
                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: NoviSpacing.space4),
              Text(
                'Lowers cortisol and resets mental clarity in under 2 minutes.',
                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: NoviSpacing.space16),
              AnimatedBuilder(
                animation: _breathingScaleAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _breathingScaleAnimation.value,
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            colorScheme.secondary.withValues(alpha: 0.35),
                            colorScheme.secondary.withValues(alpha: 0.05),
                          ],
                        ),
                        border: Border.all(
                          color: colorScheme.secondary.withValues(alpha: 0.6),
                          width: 2,
                        ),
                      ),
                      child: Icon(Icons.air_rounded, color: colorScheme.secondary, size: 36),
                    ),
                  );
                },
              ),
              const SizedBox(height: NoviSpacing.space16),
              Text(
                _breathingPhaseText,
                style: textTheme.labelLarge?.copyWith(
                  color: colorScheme.secondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        );

      case 1: // Eye Rest (20-20-20)
        return NoviCard(
          key: const ValueKey('eyerest'),
          padding: const EdgeInsets.all(NoviSpacing.space20),
          child: Column(
            children: [
              Icon(Icons.visibility_rounded, color: colorScheme.primary, size: 36),
              const SizedBox(height: NoviSpacing.space12),
              Text(
                '20-20-20 Rule for Eye Strain',
                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: NoviSpacing.space8),
              Text(
                'Shift your gaze away from the screen. Look at an object 20 feet away for 20 seconds to relax your optic ciliary muscles.',
                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );

      case 2: // Stretch
        return NoviCard(
          key: const ValueKey('stretch'),
          padding: const EdgeInsets.all(NoviSpacing.space20),
          child: Column(
            children: [
              Icon(Icons.accessibility_new_rounded, color: colorScheme.primary, size: 36),
              const SizedBox(height: NoviSpacing.space12),
              Text(
                'Postural Unwind',
                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: NoviSpacing.space8),
              Text(
                'Roll shoulders backward 5 times, tilt neck gently side-to-side, and stretch your spine to release trapped muscle tension.',
                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );

      case 3: // Hydration
      default:
        return NoviCard(
          key: const ValueKey('water'),
          padding: const EdgeInsets.all(NoviSpacing.space20),
          child: Column(
            children: [
              Icon(Icons.water_drop_rounded, color: colorScheme.primary, size: 36),
              const SizedBox(height: NoviSpacing.space12),
              Text(
                'Hydration Check',
                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: NoviSpacing.space8),
              Text(
                'Drink a glass of cold water now. Even 1% dehydration causes noticeable drop in focus and working memory endurance.',
                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
    }
  }
}

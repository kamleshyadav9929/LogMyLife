import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../services/native_bridge_service.dart';
import '../widgets/novi_card.dart';
import '../widgets/novi_pressable.dart';

/// NOVI — Onboarding & Introduction Experience
/// Calm, welcoming 3-step setup with ultra-smooth page and indicator transitions.

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onOnboardingCompleted;

  const OnboardingScreen({super.key, required this.onOnboardingCompleted});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> with WidgetsBindingObserver {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final TextEditingController _nameController = TextEditingController(text: 'Alex Vance');
  int _targetDailyHours = 6;
  bool _hasUsagePermission = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermission();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pageController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPermission();
    }
  }

  Future<void> _checkPermission() async {
    final granted = await NativeBridgeService.hasUsageStatsPermission();
    if (mounted) {
      setState(() => _hasUsagePermission = granted);
    }
  }

  Future<void> _completeOnboarding() async {
    NoviHaptics.medium();
    final name = _nameController.text.trim();
    final profile = await LocalStore.getUserProfile();
    await LocalStore.saveUserProfile(profile.copyWith(
      name: name.isNotEmpty ? name : 'Alex Vance',
      targetDailyHours: _targetDailyHours,
      hasCompletedOnboarding: true,
    ));

    widget.onOnboardingCompleted();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: NoviSpacing.space24,
            vertical: NoviSpacing.space20,
          ),
          child: Column(
            children: [
              // Header Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (index) {
                  final isActive = _currentPage == index;
                  return AnimatedContainer(
                    duration: NoviMotion.duration(context, NoviMotion.shortDuration),
                    curve: NoviMotion.easeInOut,
                    margin: const EdgeInsets.symmetric(horizontal: NoviSpacing.space4),
                    width: isActive ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isActive
                          ? colorScheme.primary
                          : colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                    ),
                  );
                }),
              ),
              const SizedBox(height: NoviSpacing.space32),

              // Pages
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const BouncingScrollPhysics(),
                  onPageChanged: (idx) {
                    NoviHaptics.selection();
                    setState(() => _currentPage = idx);
                  },
                  children: [
                    // Step 1: Welcome to NOVI
                    _buildStep(
                      icon: Icons.spa_rounded,
                      title: 'Welcome to NOVI',
                      subtitle: 'A calm, intelligent space to organize your time and understand your daily rhythm.',
                      content: const Column(
                        children: [
                          _FeatureRow(
                            icon: Icons.auto_awesome_rounded,
                            title: 'Zero Manual Logging',
                            desc: 'Quiet background awareness filters noise and logs real focus sessions.',
                          ),
                          _FeatureRow(
                            icon: Icons.schedule_send_rounded,
                            title: 'Adaptive Auto-Shift',
                            desc: 'When life changes, dependent blocks shift gracefully to prevent conflict.',
                          ),
                          _FeatureRow(
                            icon: Icons.repeat_rounded,
                            title: 'Mindful Consistency',
                            desc: 'Build daily habits and long-term intentions without gamification pressure.',
                          ),
                        ],
                      ),
                    ),

                    // Step 2: System Awareness & Permissions
                    _buildStep(
                      icon: Icons.security_rounded,
                      title: 'On-Device Awareness',
                      subtitle: 'NOVI uses native Android integrations to observe your focus apps privately without draining battery.',
                      content: Column(
                        children: [
                          NoviCard(
                            padding: const EdgeInsets.all(NoviSpacing.space16),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.query_stats_rounded,
                                  size: 24,
                                  color: colorScheme.primary,
                                ),
                                const SizedBox(width: NoviSpacing.space14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'App Usage Access',
                                        style: textTheme.titleSmall?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: NoviSpacing.space2),
                                      Text(
                                        _hasUsagePermission
                                            ? 'Permission active and ready.'
                                            : 'Allows NOVI to match active study apps with scheduled blocks.',
                                        style: textTheme.bodySmall?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                FilledButton.tonal(
                                  onPressed: () async {
                                    NoviHaptics.medium();
                                    await NativeBridgeService.requestUsageStatsPermission();
                                    await _checkPermission();
                                  },
                                  child: Text(_hasUsagePermission ? 'Granted' : 'Grant'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Step 3: Profile Setup & Intention
                    _buildStep(
                      icon: Icons.tune_rounded,
                      title: 'Personalize Your Flow',
                      subtitle: 'Set your name and daily focus target to calibrate your daily rhythm.',
                      content: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your Name',
                            style: textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: NoviSpacing.space8),
                          TextField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              hintText: 'e.g. Alex Vance',
                            ),
                          ),
                          const SizedBox(height: NoviSpacing.space24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Target Daily Focus',
                                style: textTheme.labelLarge?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '$_targetDailyHours hours / day',
                                style: textTheme.labelMedium?.copyWith(
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          Slider(
                            value: _targetDailyHours.toDouble(),
                            min: 2,
                            max: 14,
                            divisions: 12,
                            onChanged: (val) => setState(() => _targetDailyHours = val.round()),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom Navigation Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: NoviMotion.duration(context, NoviMotion.standard),
                          curve: NoviMotion.easeOut,
                        );
                      },
                      child: const Text('Back'),
                    )
                  else
                    const SizedBox.shrink(),
                  NoviPressable(
                    enableHaptics: true,
                    child: FilledButton(
                      onPressed: () {
                        if (_currentPage < 2) {
                          _pageController.nextPage(
                            duration: NoviMotion.duration(context, NoviMotion.standard),
                            curve: NoviMotion.easeOut,
                          );
                        } else {
                          _completeOnboarding();
                        }
                      },
                      child: Text(_currentPage < 2 ? 'Continue' : 'Get Started'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep({
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget content,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(NoviSpacing.space12),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 28,
              color: colorScheme.onPrimaryContainer,
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),
          Text(
            title,
            style: textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: NoviSpacing.space6),
          Text(
            subtitle,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: NoviSpacing.space28),
          content,
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;

  const _FeatureRow({
    required this.icon,
    required this.title,
    required this.desc,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: NoviSpacing.space16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(NoviSpacing.space8),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
            ),
            child: Icon(
              icon,
              size: 18,
              color: colorScheme.primary,
            ),
          ),
          const SizedBox(width: NoviSpacing.space14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: NoviSpacing.space2),
                Text(
                  desc,
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

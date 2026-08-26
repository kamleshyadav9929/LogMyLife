import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../services/timer_engine.dart';
import '../../services/ai_insights_service.dart';
import '../widgets/novi_card.dart';
import '../widgets/novi_radial_gauge.dart';
import '../widgets/novi_empty_state.dart';
import '../widgets/novi_section_header.dart';
import '../widgets/novi_pressable.dart';
import '../widgets/add_activity_modal.dart';
import '../widgets/activity_history_sheet.dart';
import '../widgets/day_replay_sheet.dart';
import '../widgets/profile_avatar_sheet.dart';
import 'notifications_screen.dart';
import 'search_screen.dart';
import 'analytics_insights_screen.dart';

/// NOVI — Master Dashboard Screen
/// Sticky modern header with clean editorial layout, fluid typography,
/// borderless schedule rows with hairline dividers, and zero card-soup fatigue.

class MasterDashboardScreen extends StatefulWidget {
  final VoidCallback onNavigateToPlanner;
  final VoidCallback onNavigateToPomodoro;
  final VoidCallback? onOpenSettings;

  const MasterDashboardScreen({
    super.key,
    required this.onNavigateToPlanner,
    required this.onNavigateToPomodoro,
    this.onOpenSettings,
  });

  @override
  State<MasterDashboardScreen> createState() => _MasterDashboardScreenState();
}

class _MasterDashboardScreenState extends State<MasterDashboardScreen> with WidgetsBindingObserver {
  UserProfile? _profile;
  List<ActivityOccurrence> _occurrences = [];
  List<ActivitySession> _sessions = [];
  List<InterruptionRecord> _interruptions = [];
  DailyAIBriefing? _aiBriefing;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadDashboardData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadDashboardData();
    }
  }

  Future<void> _loadDashboardData() async {
    try {
      final todayStr = LocalStore.getTodayDateStr();
      final profile = await LocalStore.getUserProfile();
      final occurrences = await LocalStore.getOccurrences(todayStr);
      final sessions = await LocalStore.getActivitySessions(todayStr);
      final interruptions = await LocalStore.getInterruptions();
      final briefing = await AIInsightsService.generateDailyBriefing();

      if (mounted) {
        setState(() {
          _profile = profile;
          _occurrences = occurrences..sort((a, b) => a.plannedStart.compareTo(b.plannedStart));
          _sessions = sessions;
          _interruptions = interruptions;
          _aiBriefing = briefing;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _toggleOccurrenceStatus(ActivityOccurrence occ) async {
    NoviHaptics.selection();
    final newStatus = occ.status == OccurrenceStatus.completed
        ? OccurrenceStatus.scheduled
        : OccurrenceStatus.completed;

    final updated = occ.copyWith(
      status: newStatus,
    );

    await LocalStore.saveOccurrence(updated);
    _loadDashboardData();
  }

  void _openAnalytics() {
    NoviHaptics.selection();
    Navigator.of(context).push(
      NoviPageRoute(page: const AnalyticsInsightsScreen()),
    );
  }

  Widget _buildUserAvatarWidget(ColorScheme colorScheme) {
    final avatarUrl = _profile?.avatarUrl ?? '';
    if (avatarUrl.startsWith('http')) {
      return Image.network(
        avatarUrl,
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildAvatarFallback(colorScheme),
      );
    } else if (avatarUrl.startsWith('asset:') || avatarUrl.endsWith('.png')) {
      final path = avatarUrl.replaceFirst('asset:', '');
      return Image.asset(
        path,
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildAvatarFallback(colorScheme),
      );
    } else if (avatarUrl.startsWith('preset:')) {
      final icon = avatarUrl == 'preset:botanical'
          ? '🌿'
          : (avatarUrl == 'preset:wine'
              ? '🍷'
              : (avatarUrl == 'preset:cosmic'
                  ? '🌌'
                  : (avatarUrl == 'preset:coffee'
                      ? '☕'
                      : (avatarUrl == 'preset:spark' ? '⚡' : '🎯'))));
      return Center(child: Text(icon, style: const TextStyle(fontSize: 20)));
    }
    return _buildAvatarFallback(colorScheme);
  }

  Widget _buildAvatarFallback(ColorScheme colorScheme) {
    final initial = _profile != null && _profile!.name.isNotEmpty
        ? _profile!.name[0].toUpperCase()
        : 'N';
    return Container(
      width: 40,
      height: 40,
      color: colorScheme.primaryContainer,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: colorScheme.onPrimaryContainer,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: colorScheme.primary),
        ),
      );
    }

    final totalTargetHours = (_profile?.targetDailyHours ?? 6).toDouble();
    int trackedSeconds = 0;
    for (final s in _sessions) {
      if (s.confidence == ConfidenceLevel.high || s.sourceType == SessionSourceType.timer) {
        trackedSeconds += s.durationSeconds ?? 0;
      }
    }
    final trackedHours = trackedSeconds / 3600.0;
    final progress = totalTargetHours > 0 ? (trackedHours / totalTargetHours) : 0.0;
    final completedCount = _occurrences.where((o) => o.status == OccurrenceStatus.completed).length;

    // Determine current or up-next occurrence
    final activeOrNextOcc = _occurrences.cast<ActivityOccurrence?>().firstWhere(
          (o) => o != null && o.status != OccurrenceStatus.completed,
          orElse: () => _occurrences.isNotEmpty ? _occurrences.first : null,
        );

    final now = DateTime.now();
    final dateFormatted = DateFormat('EEEE, MMMM d').format(now);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── STICKY HEADER (NOVI BRANDING + USER AVATAR + REAL ACTION ICONS) ──
            Container(
              padding: const EdgeInsets.fromLTRB(
                NoviSpacing.space20,
                NoviSpacing.space12,
                NoviSpacing.space16,
                NoviSpacing.space12,
              ),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                border: Border(
                  bottom: BorderSide(
                    color: colorScheme.outline,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Left: User Icon (sets image) + NOVI Branding + Date
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      NoviPressable(
                        onTap: () {
                          if (_profile != null) {
                            NoviHaptics.selection();
                            ProfileAvatarSheet.show(
                              context,
                              profile: _profile!,
                              onProfileUpdated: (updated) {
                                setState(() => _profile = updated);
                              },
                            );
                          }
                        },
                        child: Stack(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: colorScheme.surfaceContainerHigh,
                              ),
                              child: ClipOval(
                                child: _buildUserAvatarWidget(colorScheme),
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                width: 13,
                                height: 13,
                                decoration: BoxDecoration(
                                  color: colorScheme.primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: theme.scaffoldBackgroundColor, width: 1.5),
                                ),
                                child: const Icon(
                                  Icons.edit_rounded,
                                  size: 7,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: NoviSpacing.space12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'NOVI',
                            style: textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.5,
                              fontSize: 18,
                              color: colorScheme.onSurface,
                            ),
                          ),
                          Text(
                            dateFormatted,
                            style: textTheme.labelSmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              letterSpacing: 0.2,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Right: Real Search + Real Notification + Real Settings
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // 1. Search Icon (Opens Dedicated Search Page)
                      IconButton.filledTonal(
                        onPressed: () {
                          NoviHaptics.selection();
                          Navigator.of(context).push(
                            NoviPageRoute(
                              page: SearchScreen(
                                onFocusStarted: _loadDashboardData,
                              ),
                            ),
                          ).then((_) => _loadDashboardData());
                        },
                        tooltip: 'Search',
                        icon: const Icon(
                          Icons.search_rounded,
                          size: 19,
                        ),
                      ),
                      const SizedBox(width: NoviSpacing.space6),

                      // 2. Real Notification Icon (Opens Dedicated Notifications Page)
                      IconButton.filledTonal(
                        onPressed: () {
                          NoviHaptics.selection();
                          Navigator.of(context).push(
                            NoviPageRoute(
                              page: NotificationsScreen(
                                briefing: _aiBriefing,
                                streakDays: _profile?.currentStreak ?? 8,
                              ),
                            ),
                          ).then((_) => _loadDashboardData());
                        },
                        tooltip: 'Notifications',
                        icon: const Icon(
                          Icons.notifications_outlined,
                          size: 19,
                        ),
                      ),
                      const SizedBox(width: NoviSpacing.space6),

                      // 3. Real Settings Icon
                      IconButton.filledTonal(
                        onPressed: widget.onOpenSettings,
                        tooltip: 'Settings',
                        icon: const Icon(
                          Icons.settings_outlined,
                          size: 19,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE BODY ──
            Expanded(
              child: RefreshIndicator(
                color: colorScheme.primary,
                onRefresh: _loadDashboardData,
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: NoviSpacing.space20,
                    vertical: NoviSpacing.space16,
                  ),
                  children: [
                    // (1) HERO: Daily Rhythm Progress (Clean spacious hero section)
                    NoviCard(
                      padding: const EdgeInsets.all(NoviSpacing.space20),
                      backgroundColor: colorScheme.surfaceContainerLow,
                      borderRadius: NoviShapes.radiusLargeCard,
                      onTap: _openAnalytics,
                      child: Row(
                        children: [
                          NoviRadialGauge(
                            progress: progress,
                            currentHours: trackedHours,
                            targetHours: totalTargetHours,
                            size: 120,
                          ),
                          const SizedBox(width: NoviSpacing.space20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Daily Rhythm',
                                        style: textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    Icon(
                                      Icons.arrow_outward_rounded,
                                      size: 16,
                                      color: colorScheme.onSurfaceVariant,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: NoviSpacing.space4),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    NoviAnimatedCounter(
                                      value: completedCount.toDouble(),
                                      style: textTheme.bodySmall?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      ' of ${_occurrences.length} completed',
                                      style: textTheme.bodySmall?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: NoviSpacing.space16),
                                if (activeOrNextOcc != null && activeOrNextOcc.status != OccurrenceStatus.completed)
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton.icon(
                                      onPressed: () async {
                                        NoviHaptics.medium();
                                        await TimerEngine.startTimer(activeOrNextOcc);
                                        _loadDashboardData();
                                      },
                                      icon: const Icon(Icons.play_arrow_rounded, size: 16),
                                      label: Text(
                                        activeOrNextOcc.parentActivityTitle ?? 'Focus',
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      style: FilledButton.styleFrom(
                                        minimumSize: const Size(double.infinity, 38),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: NoviSpacing.space12,
                                          vertical: NoviSpacing.space6,
                                        ),
                                      ),
                                    ),
                                  )
                                else
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton.tonal(
                                      onPressed: () {
                                        NoviHaptics.selection();
                                        widget.onNavigateToPomodoro();
                                      },
                                      style: FilledButton.styleFrom(
                                        minimumSize: const Size(double.infinity, 38),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: NoviSpacing.space12,
                                          vertical: NoviSpacing.space6,
                                        ),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.timer_rounded, size: 16),
                                          SizedBox(width: NoviSpacing.space4),
                                          Text('Start Focus'),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space14),

                    // (2) Quick Actions Row
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: FilledButton.icon(
                            icon: const Icon(Icons.add_rounded, size: 18),
                            label: const Text('Add block'),
                            style: FilledButton.styleFrom(
                              backgroundColor: colorScheme.primaryContainer,
                              foregroundColor: colorScheme.onPrimaryContainer,
                              minimumSize: const Size(0, 42),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            onPressed: () {
                              NoviHaptics.medium();
                              AddActivityModal.show(context, onActivityAdded: _loadDashboardData);
                            },
                          ),
                        ),
                        const SizedBox(width: NoviSpacing.space8),
                        IconButton.outlined(
                          tooltip: 'Insights',
                          icon: const Icon(Icons.insights_rounded, size: 18),
                          style: IconButton.styleFrom(
                            minimumSize: const Size(42, 42),
                            padding: EdgeInsets.zero,
                          ),
                          onPressed: _openAnalytics,
                        ),
                        const SizedBox(width: NoviSpacing.space8),
                        IconButton.outlined(
                          tooltip: 'Day Replay',
                          icon: const Icon(Icons.history_rounded, size: 18),
                          style: IconButton.styleFrom(
                            minimumSize: const Size(42, 42),
                            padding: EdgeInsets.zero,
                          ),
                          onPressed: () {
                            NoviHaptics.selection();
                            DayReplaySheet.show(
                              context,
                              occurrences: _occurrences,
                              sessions: _sessions,
                              interruptions: _interruptions,
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space24),

                    // (3) Today's Schedule Section (CLEAN GROUPED LIST — NO CARD SOUP)
                    NoviSectionHeader(
                      title: "Today's Schedule",
                      actionLabel: _occurrences.isNotEmpty ? 'See all' : null,
                      onAction: () {
                        NoviHaptics.selection();
                        widget.onNavigateToPlanner();
                      },
                    ),

                    if (_occurrences.isEmpty)
                      NoviEmptyState(
                        icon: Icons.calendar_today_rounded,
                        title: 'Nothing planned yet',
                        description: 'Your day is wide open. Add an activity block to start your daily flow.',
                        actionLabel: 'Schedule an activity',
                        onAction: () {
                          AddActivityModal.show(context, onActivityAdded: _loadDashboardData);
                        },
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainer,
                          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _occurrences.length,
                          separatorBuilder: (context, idx) => Divider(
                            height: 1,
                            thickness: 1,
                            indent: 56,
                            endIndent: 12,
                            color: colorScheme.outline,
                          ),
                          itemBuilder: (context, idx) {
                            final occ = _occurrences[idx];
                            final isCompleted = occ.status == OccurrenceStatus.completed;
                            final isActive = occ.status == OccurrenceStatus.active;
                            final startFormatted = DateFormat('h:mm a').format(occ.plannedStart);
                            final endFormatted = DateFormat('h:mm a').format(occ.plannedEnd);
                            final durationMins = occ.durationSeconds ~/ 60;

                            return InkWell(
                              borderRadius: BorderRadius.vertical(
                                top: idx == 0 ? const Radius.circular(NoviShapes.radiusMedium) : Radius.zero,
                                bottom: idx == _occurrences.length - 1
                                    ? const Radius.circular(NoviShapes.radiusMedium)
                                    : Radius.zero,
                              ),
                              onTap: () {
                                ActivityHistorySheet.show(
                                  context,
                                  occurrence: occ,
                                  sessions: _sessions,
                                  interruptions: _interruptions,
                                  onOccurrenceUpdated: _loadDashboardData,
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: NoviSpacing.space14,
                                  vertical: NoviSpacing.space12,
                                ),
                                child: Row(
                                  children: [
                                    // Morphing check/timer icon toggle
                                    NoviPressable(
                                      enableHaptics: true,
                                      onTap: () => _toggleOccurrenceStatus(occ),
                                      child: AnimatedContainer(
                                        duration: NoviMotion.duration(context, NoviMotion.fast),
                                        curve: NoviMotion.easeInOut,
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: isCompleted
                                              ? colorScheme.primaryContainer
                                              : (isActive
                                                  ? colorScheme.primaryContainer
                                                  : colorScheme.surfaceContainerHighest),
                                          shape: BoxShape.circle,
                                        ),
                                        child: NoviMorphIcon(
                                          icon: isCompleted
                                              ? Icons.check_rounded
                                              : (occ.timerRequired
                                                  ? Icons.timer_outlined
                                                  : Icons.calendar_today_rounded),
                                          color: isCompleted
                                              ? colorScheme.primary
                                              : (isActive
                                                  ? colorScheme.primary
                                                  : colorScheme.onSurfaceVariant),
                                          size: 16,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: NoviSpacing.space12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: AnimatedDefaultTextStyle(
                                                  duration: NoviMotion.duration(context, NoviMotion.fast),
                                                  curve: NoviMotion.easeInOut,
                                                  style: (textTheme.titleSmall ?? const TextStyle()).copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 14,
                                                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                                                    color: isCompleted
                                                        ? colorScheme.onSurfaceVariant.withValues(alpha: 0.6)
                                                        : colorScheme.onSurface,
                                                  ),
                                                  child: Text(occ.parentActivityTitle ?? 'Activity'),
                                                ),
                                              ),
                                              if (occ.completedSeconds > 0 && !isCompleted)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: colorScheme.primaryContainer.withValues(alpha: 0.7),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    '${(occ.progressPercentage * 100).round()}%',
                                                    style: textTheme.labelSmall?.copyWith(
                                                      color: colorScheme.primary,
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 10,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: NoviSpacing.space2),
                                          Text(
                                            occ.completedSeconds > 0 && !isCompleted
                                                ? '$startFormatted – $endFormatted · ${(occ.completedSeconds / 60).toStringAsFixed(1)}m of ${durationMins}m logged'
                                                : '$startFormatted – $endFormatted · ${durationMins}m',
                                            style: textTheme.bodySmall?.copyWith(
                                              color: colorScheme.onSurfaceVariant,
                                              fontSize: 12,
                                            ),
                                          ),
                                          if (occ.completedSeconds > 0 && !isCompleted) ...[
                                            const SizedBox(height: 5),
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(2),
                                              child: LinearProgressIndicator(
                                                value: occ.progressPercentage,
                                                minHeight: 3,
                                                backgroundColor: colorScheme.surfaceContainerHighest,
                                                color: colorScheme.primary,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (isCompleted)
                                      Icon(
                                        Icons.chevron_right_rounded,
                                        size: 18,
                                        color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                                      )
                                    else
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          IconButton(
                                            icon: Icon(
                                              occ.completedSeconds > 0 ? Icons.play_circle_outline_rounded : Icons.play_arrow_rounded,
                                            ),
                                            tooltip: occ.completedSeconds > 0 ? 'Resume Focus' : 'Start Focus',
                                            color: colorScheme.primary,
                                            iconSize: 20,
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            onPressed: () async {
                                              NoviHaptics.medium();
                                              await TimerEngine.startTimer(occ);
                                              _loadDashboardData();
                                            },
                                          ),
                                          Icon(
                                            Icons.chevron_right_rounded,
                                            size: 18,
                                            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                                          ),
                                        ],
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                    const SizedBox(height: NoviSpacing.space24),

                    // (4) Daily Insight Note
                    if (_aiBriefing != null) ...[
                      NoviSectionHeader(
                        title: 'Daily Insights',
                        subtitle: 'On-device focus observation',
                        actionLabel: 'View Hub',
                        onAction: _openAnalytics,
                      ),
                      Container(
                        padding: const EdgeInsets.all(NoviSpacing.space16),
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                        ),
                        child: InkWell(
                          onTap: _openAnalytics,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.auto_awesome_rounded,
                                    size: 16,
                                    color: colorScheme.primary,
                                  ),
                                  const SizedBox(width: NoviSpacing.space8),
                                  Expanded(
                                    child: Text(
                                      _aiBriefing!.headline,
                                      style: textTheme.titleSmall?.copyWith(
                                        color: colorScheme.onSurface,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    Icons.chevron_right_rounded,
                                    size: 16,
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ],
                              ),
                              const SizedBox(height: NoviSpacing.space8),
                              Text(
                                _aiBriefing!.deepWorkSummary,
                                style: textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: NoviSpacing.space40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

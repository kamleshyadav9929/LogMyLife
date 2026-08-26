import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../services/ai_insights_service.dart';
import '../../services/native_bridge_service.dart';
import '../widgets/novi_card.dart';
import '../widgets/novi_section_header.dart';

/// NOVI — Analytics & Cognitive Insights Hub
/// Deep focus telemetry, chronotype energy heatmaps, category distribution,
/// distraction diagnostics, long-term mastery tracks, and actionable AI recommendations.

class AnalyticsInsightsScreen extends StatefulWidget {
  const AnalyticsInsightsScreen({super.key});

  @override
  State<AnalyticsInsightsScreen> createState() => _AnalyticsInsightsScreenState();
}

class _AnalyticsInsightsScreenState extends State<AnalyticsInsightsScreen> with WidgetsBindingObserver {
  AnalyticsTimeRange _selectedRange = AnalyticsTimeRange.today;
  ComprehensiveAnalytics? _analytics;
  List<SubjectProgress> _syllabus = [];
  bool _isLoading = true;
  bool _hasUsagePermission = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadAnalytics();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadAnalytics();
    }
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    final hasUsage = await NativeBridgeService.hasUsageStatsPermission();
    final data = await AIInsightsService.getComprehensiveAnalytics(_selectedRange);
    final syllabus = await LocalStore.getSyllabus();

    if (mounted) {
      setState(() {
        _hasUsagePermission = hasUsage;
        _analytics = data;
        _syllabus = syllabus;
        _isLoading = false;
      });
    }
  }

  void _switchRange(AnalyticsTimeRange range) {
    if (_selectedRange != range) {
      NoviHaptics.selection();
      setState(() => _selectedRange = range);
      _loadAnalytics();
    }
  }

  Color _parseHex(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    try {
      final clean = hex.replaceAll('#', '');
      return Color(int.parse('FF$clean', radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  void _showReportSheet() {
    if (_analytics == null) return;
    NoviHaptics.medium();

    final a = _analytics!;
    final rangeText = _selectedRange == AnalyticsTimeRange.today
        ? 'Today'
        : (_selectedRange == AnalyticsTimeRange.week
            ? 'Past 7 Days'
            : (_selectedRange == AnalyticsTimeRange.month ? 'Past 30 Days' : 'All-Time'));

    final reportContent = '''
NOVI FOCUS & COGNITIVE TELEMETRY REPORT
Time Window: $rangeText
----------------------------------------
• Focus Logged: ${a.focusHoursFormatted}h (Target: ${a.targetHoursFormatted}h)
• Flow State Score: ${a.flowScore.round()}% (${a.flowScoreStatus})
• Schedule Adherence: ${a.scheduleAdherencePct.round()}% (${a.completedBlocksCount}/${a.totalBlocksCount} blocks completed)
• Context Switches: ${a.contextSwitchCount} (Avg ${a.avgDistractionsPerHour.toStringAsFixed(1)}/hr)
• Golden Focus Window: ${a.goldenFocusWindow}
• Active Streak: ${a.currentStreak} days

AI Cognitive Summary:
${a.aiBriefing.headline}
${a.aiBriefing.deepWorkSummary}
''';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        final colorScheme = theme.colorScheme;

        return Padding(
          padding: const EdgeInsets.fromLTRB(
            NoviSpacing.space16, NoviSpacing.space8,
            NoviSpacing.space16, NoviSpacing.space16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.assessment_outlined, color: colorScheme.primary),
                  const SizedBox(width: NoviSpacing.space8),
                  Text(
                    'Focus Intelligence Briefing',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: NoviSpacing.space12),
              Container(
                padding: const EdgeInsets.all(NoviSpacing.space12),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                  border: Border.all(color: colorScheme.outlineVariant),
                ),
                child: SelectableText(
                  reportContent,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: NoviSpacing.space16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: reportContent));
                    NoviHaptics.success();
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Report copied to clipboard'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  label: const Text('Copy Briefing'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddTrackDialog(BuildContext context, {SubjectProgress? existing}) {
    final titleController = TextEditingController(text: existing?.subjectName ?? '');
    final targetHoursController = TextEditingController(
      text: (existing?.totalTargetHours ?? 60).toStringAsFixed(0),
    );
    final completedHoursController = TextEditingController(
      text: (existing?.completedHours ?? 0).toStringAsFixed(1),
    );
    final isEdit = existing != null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? 'Edit Goal Track' : 'Add Goal Track'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              autofocus: !isEdit,
              decoration: const InputDecoration(labelText: 'Subject / Project Name'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: completedHoursController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Completed Hours'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: targetHoursController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Target Hours'),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (isEdit)
            TextButton(
              onPressed: () async {
                NoviHaptics.medium();
                await LocalStore.deleteSubjectProgress(existing.subjectName);
                _loadAnalytics();
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: Text('Delete', style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
            ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final title = titleController.text.trim();
              if (title.isNotEmpty) {
                NoviHaptics.medium();
                final targetH = double.tryParse(targetHoursController.text.trim()) ?? 60.0;
                final compH = double.tryParse(completedHoursController.text.trim()) ?? 0.0;

                final track = SubjectProgress(
                  subjectName: title,
                  completedHours: compH,
                  totalTargetHours: targetH,
                  colorHex: existing?.colorHex ?? '#DFDFDF',
                );

                if (isEdit) {
                  if (existing.subjectName.toLowerCase() != title.toLowerCase()) {
                    await LocalStore.deleteSubjectProgress(existing.subjectName);
                  }
                  await LocalStore.updateSubjectProgress(track);
                } else {
                  await LocalStore.addSubjectProgress(track);
                }

                _loadAnalytics();
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics & Insights'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Export Briefing',
            onPressed: _showReportSheet,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Telemetry',
            onPressed: _loadAnalytics,
          ),
        ],
      ),
      body: SafeArea(
        bottom: false,
        child: _isLoading || _analytics == null
            ? Center(
                child: CircularProgressIndicator(color: colorScheme.primary),
              )
            : Column(
                children: [
                  // (1) Sticky Time Range Filter Selector with Smooth Sliding Pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: NoviSpacing.space20,
                      vertical: NoviSpacing.space8,
                    ),
                    decoration: BoxDecoration(
                      color: theme.scaffoldBackgroundColor,
                      border: Border(
                        bottom: BorderSide(
                          color: colorScheme.outlineVariant.withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                    ),
                    child: NoviSlidingPillSelector<AnalyticsTimeRange>(
                      items: const [
                        AnalyticsTimeRange.today,
                        AnalyticsTimeRange.week,
                        AnalyticsTimeRange.month,
                        AnalyticsTimeRange.all,
                      ],
                      selectedItem: _selectedRange,
                      height: 40,
                      borderRadius: 20,
                      onSelected: _switchRange,
                      itemBuilder: (context, range, isSelected) {
                        final label = range == AnalyticsTimeRange.today
                            ? 'Today'
                            : (range == AnalyticsTimeRange.week
                                ? '7 Days'
                                : (range == AnalyticsTimeRange.month ? '30 Days' : 'All Time'));

                        return Text(
                          label,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                          ),
                        );
                      },
                    ),
                  ),

                  // (2) Scrollable Body
                  Expanded(
                    child: RefreshIndicator(
                      color: colorScheme.primary,
                      onRefresh: _loadAnalytics,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(
                          horizontal: NoviSpacing.space20,
                          vertical: NoviSpacing.space16,
                        ),
                        children: [
                          // 4-Card Hero Telemetry Overview Grid
                          _buildTelemetryGrid(_analytics!, colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // 7-Day Focus Trend Visual Chart
                          _buildWeeklyTrendSection(_analytics!, colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // Category Intent Distribution Breakdown
                          _buildCategoryDistributionSection(_analytics!, colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // Chronotype Energy & Golden Focus Window
                          _buildChronotypeSection(_analytics!, colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // Distraction & Context Switching Diagnostics
                          _buildDistractionDiagnosticsSection(_analytics!, colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // Long-Term Mastery & Goals Tracks
                          _buildLearningTracksSection(colorScheme, textTheme),
                          const SizedBox(height: NoviSpacing.space24),

                          // AI Behavioral & Cognitive Recommendations
                          _buildAIRecommendationsSection(_analytics!, colorScheme, textTheme),
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

  Widget _buildTelemetryGrid(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    final focusHoursNum = (a.totalFocusSeconds / 3600.0);

    return Column(
      children: [
        Row(
          children: [
            // Card 1: Focus Volume
            Expanded(
              child: NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Focus Logged',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Icon(Icons.timer_rounded, size: 16, color: colorScheme.primary),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        NoviAnimatedCounter(
                          value: focusHoursNum,
                          fractionDigits: 1,
                          suffix: 'h',
                          style: textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: colorScheme.primary,
                          ),
                        ),
                        const SizedBox(width: NoviSpacing.space4),
                        Text(
                          '/ ${a.targetHoursFormatted}h target',
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: NoviSpacing.space12),

            // Card 2: Flow Quality Score
            Expanded(
              child: NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Flow Rating',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Icon(Icons.bolt_rounded, size: 16, color: colorScheme.tertiary),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space8),
                    Row(
                      children: [
                        NoviAnimatedCounter(
                          value: a.flowScore,
                          suffix: '%',
                          style: textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: colorScheme.tertiary,
                          ),
                        ),
                        const SizedBox(width: NoviSpacing.space6),
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: colorScheme.tertiaryContainer,
                              borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                            ),
                            child: Text(
                              a.flowScoreStatus,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.labelSmall?.copyWith(
                                color: colorScheme.onTertiaryContainer,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: NoviSpacing.space12),
        Row(
          children: [
            // Card 3: Schedule Adherence
            Expanded(
              child: NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Schedule Adherence',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Icon(Icons.check_circle_outline_rounded, size: 16, color: colorScheme.secondary),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space8),
                    NoviAnimatedCounter(
                      value: a.scheduleAdherencePct,
                      suffix: '%',
                      style: textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: colorScheme.secondary,
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space2),
                    Text(
                      '${a.completedBlocksCount} of ${a.totalBlocksCount} blocks finished',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: NoviSpacing.space12),

            // Card 4: Context Switching
            Expanded(
              child: NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Context Switches',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Icon(Icons.swap_calls_rounded, size: 16, color: colorScheme.onSurfaceVariant),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space8),
                    NoviAnimatedCounter(
                      value: a.contextSwitchCount.toDouble(),
                      style: textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: a.contextSwitchCount > 3 ? colorScheme.error : colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space2),
                    Text(
                      '${a.avgDistractionsPerHour.toStringAsFixed(1)} per focus hr',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWeeklyTrendSection(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    final maxTarget = a.weeklyTrend.fold<double>(1.0, (prev, p) => p.targetHours > prev ? p.targetHours : prev);
    final maxVal = a.weeklyTrend.fold<double>(maxTarget, (prev, p) => p.hours > prev ? p.hours : prev);
    final safeMax = maxVal > 0 ? maxVal * 1.15 : 10.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const NoviSectionHeader(
          title: 'Daily Focus Rhythm',
          subtitle: '7-day execution vs daily targets',
        ),
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          child: Column(
            children: [
              // Chart area
              SizedBox(
                height: 140,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: a.weeklyTrend.map((point) {
                    final heightRatio = (point.hours / safeMax).clamp(0.05, 1.0);
                    final isMet = point.isTargetMet;

                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              point.hours > 0 ? '${point.hours.toStringAsFixed(1)}h' : '-',
                              style: textTheme.labelSmall?.copyWith(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                color: isMet ? colorScheme.secondary : colorScheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Flexible(
                              child: TweenAnimationBuilder<double>(
                                tween: Tween<double>(begin: 0.0, end: heightRatio),
                                duration: NoviMotion.duration(context, NoviMotion.medium),
                                curve: NoviMotion.emphasizedDecelerate,
                                builder: (context, animVal, child) {
                                  return Container(
                                    width: double.infinity,
                                    height: 90 * animVal,
                                    decoration: BoxDecoration(
                                      color: isMet
                                          ? colorScheme.secondary
                                          : (point.isToday ? colorScheme.primary : colorScheme.primaryContainer),
                                      borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              point.dayLabel,
                              style: textTheme.labelSmall?.copyWith(
                                fontSize: 11,
                                fontWeight: point.isToday ? FontWeight.w700 : FontWeight.w500,
                                color: point.isToday ? colorScheme.primary : colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const Divider(height: NoviSpacing.space20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: colorScheme.secondary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text('Goal Met', style: textTheme.labelSmall),
                      const SizedBox(width: 12),
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text('Partial', style: textTheme.labelSmall),
                    ],
                  ),
                  Text(
                    'Daily Goal: ${a.weeklyTrend.isNotEmpty ? a.weeklyTrend.first.targetHours.toStringAsFixed(0) : 6}h',
                    style: textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDistributionSection(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const NoviSectionHeader(
          title: 'Intent Distribution',
          subtitle: 'Proportional focus by category',
        ),
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Proportional Segmented Bar
              ClipRRect(
                borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                child: SizedBox(
                  height: 14,
                  child: Row(
                    children: a.categoryStats.where((c) => c.durationSeconds > 0).map((cat) {
                      final color = _parseHex(cat.colorHex, colorScheme.primary);
                      final flex = (cat.percentage * 1000).round().clamp(1, 1000);

                      return Expanded(
                        flex: flex,
                        child: Container(
                          color: color,
                          margin: const EdgeInsets.only(right: 1),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: NoviSpacing.space16),

              // Category items
              ...a.categoryStats.map((cat) {
                final color = _parseHex(cat.colorHex, colorScheme.primary);
                final pctFormatted = (cat.percentage * 100).round();

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(cat.icon, style: const TextStyle(fontSize: 14)),
                      ),
                      const SizedBox(width: NoviSpacing.space12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cat.categoryName,
                              style: textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${cat.occurrencesCount} blocks planned',
                              style: textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${cat.durationHours.toStringAsFixed(1)}h',
                            style: textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            '$pctFormatted%',
                            style: textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChronotypeSection(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const NoviSectionHeader(
          title: 'Chronotype & Peak Windows',
          subtitle: 'Energy pattern throughout the day',
        ),
        // Golden Window Highlight Card
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          backgroundColor: colorScheme.primaryContainer.withValues(alpha: 0.5),
          borderColor: colorScheme.primary.withValues(alpha: 0.2),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.star_rounded, color: colorScheme.onPrimary, size: 22),
              ),
              const SizedBox(width: NoviSpacing.space14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Golden Focus Window',
                      style: textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      a.goldenFocusWindow,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Highest flow retention and minimal context switching',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: NoviSpacing.space12),

        // Hourly Periods Matrix
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          child: Column(
            children: a.chronotypeStats.map((chrono) {
              final pctFormatted = (chrono.percentage * 100).round();

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(chrono.icon),
                            const SizedBox(width: NoviSpacing.space8),
                            Text(
                              chrono.periodName,
                              style: textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '(${chrono.timeRangeLabel})',
                              style: textTheme.labelSmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${chrono.durationHours.toStringAsFixed(1)}h ($pctFormatted%)',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                      child: LinearProgressIndicator(
                        value: chrono.percentage.clamp(0.0, 1.0),
                        minHeight: 6,
                        backgroundColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                        color: colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDistractionDiagnosticsSection(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const NoviSectionHeader(
          title: 'Distraction Diagnostics',
          subtitle: 'Context switching and interruption containment',
        ),
        if (!_hasUsagePermission) ...[
          NoviCard(
            padding: const EdgeInsets.all(NoviSpacing.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.lock_clock_rounded, color: colorScheme.tertiary, size: 20),
                    const SizedBox(width: NoviSpacing.space8),
                    Text(
                      'App usage access is needed',
                      style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: NoviSpacing.space8),
                Text(
                  'NOVI uses this permission to understand how you spend time across apps and provide focus insights without uploading data.',
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: NoviSpacing.space14),
                Row(
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        NoviHaptics.selection();
                        await NativeBridgeService.requestUsageStatsPermission();
                        await _loadAnalytics();
                      },
                      icon: const Icon(Icons.settings_outlined, size: 16),
                      label: const Text('Open Settings'),
                    ),
                    const SizedBox(width: NoviSpacing.space8),
                    Text(
                      'Usage access is currently off',
                      style: textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ] else ...[
          NoviCard(
            padding: const EdgeInsets.all(NoviSpacing.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'On-Device Telemetry',
                      style: textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                      ),
                      child: Text(
                        '✓ App usage access enabled',
                        style: textTheme.labelSmall?.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: NoviSpacing.space8),
                Text(
                  a.aiBriefing.distractionAnalysis,
                  style: textTheme.bodySmall?.copyWith(
                    height: 1.4,
                    color: colorScheme.onSurface,
                  ),
                ),
                if (a.topDistractions.isNotEmpty) ...[
                  const SizedBox(height: NoviSpacing.space14),
                  const Divider(height: 1),
                  const SizedBox(height: NoviSpacing.space12),
                  Text(
                    'Observed App Transitions',
                    style: textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: NoviSpacing.space8),
                  ...a.topDistractions.map((dist) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.swap_horiz_rounded, size: 16, color: colorScheme.error),
                          const SizedBox(width: NoviSpacing.space8),
                          Expanded(
                            child: Text(
                              dist['appName']?.toString() ?? 'App',
                              style: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w500),
                            ),
                          ),
                          Text(
                            '${dist['count']} events',
                            style: textTheme.labelSmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLearningTracksSection(ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        NoviSectionHeader(
          title: 'Long-Term Mastery Goals',
          subtitle: 'Cumulative hours against master milestones',
          actionLabel: '+ Add Track',
          onAction: () => _showAddTrackDialog(context),
        ),
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          child: _syllabus.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text('No learning tracks added yet.', style: textTheme.bodySmall),
                  ),
                )
              : Column(
                  children: _syllabus.map((s) {
                    final pct = s.totalTargetHours > 0 ? (s.completedHours / s.totalTargetHours).clamp(0.0, 1.0) : 0.0;
                    final pctFormatted = (pct * 100).round();

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space8),
                      child: InkWell(
                        onTap: () => _showAddTrackDialog(context, existing: s),
                        borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    s.subjectName,
                                    style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                ),
                                Text(
                                  '${s.completedHours.toStringAsFixed(1)} / ${s.totalTargetHours.toStringAsFixed(0)}h ($pctFormatted%)',
                                  style: textTheme.labelSmall?.copyWith(
                                    color: colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: NoviSpacing.space8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                              child: LinearProgressIndicator(
                                value: pct,
                                minHeight: 8,
                                backgroundColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                                color: colorScheme.primary,
                              ),
                            ),
                            const SizedBox(height: NoviSpacing.space4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () async {
                                    NoviHaptics.light();
                                    final updated = SubjectProgress(
                                      subjectName: s.subjectName,
                                      completedHours: s.completedHours + 1.0,
                                      totalTargetHours: s.totalTargetHours,
                                      colorHex: s.colorHex,
                                    );
                                    await LocalStore.updateSubjectProgress(updated);
                                    _loadAnalytics();
                                  },
                                  icon: const Icon(Icons.add_rounded, size: 14),
                                  label: const Text('+1 hr'),
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }

  Widget _buildAIRecommendationsSection(ComprehensiveAnalytics a, ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const NoviSectionHeader(
          title: 'Tactical AI Recommendations',
          subtitle: 'Behavioral optimizations for your workflow',
        ),
        NoviCard(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          backgroundColor: colorScheme.surfaceContainerLow,
          borderColor: colorScheme.outlineVariant,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: colorScheme.primary, size: 20),
                  const SizedBox(width: NoviSpacing.space8),
                  Expanded(
                    child: Text(
                      a.aiBriefing.headline,
                      style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: NoviSpacing.space12),
              ...a.actionableRecommendations.map((rec) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: NoviSpacing.space8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('• ', style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.bold)),
                      Expanded(
                        child: Text(
                          rec,
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurface,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../domain/models/focus_models.dart';
import '../../services/timer_engine.dart';
import '../widgets/novi_banner.dart';
import '../widgets/novi_pressable.dart';
import '../widgets/add_activity_modal.dart';
import '../widgets/activity_history_sheet.dart';
import '../widgets/day_replay_sheet.dart';
import '../widgets/novi_page_header.dart';
import 'timeline_view_screen.dart';

/// NOVI — Schedule Screen
/// Sticky top header with pinned month navigation and 7-day date strip.
/// Clean, borderless list rows with hairline dividers eliminating card-soup fatigue.

class DailyPlannerScreen extends StatefulWidget {
  const DailyPlannerScreen({super.key});

  @override
  State<DailyPlannerScreen> createState() => _DailyPlannerScreenState();
}

class _DailyPlannerScreenState extends State<DailyPlannerScreen> with WidgetsBindingObserver {
  DateTime _selectedDate = DateTime.now();
  DateTime _previousDate = DateTime.now();
  String _viewMode = 'list'; // 'list' | 'timetable'
  List<ActivityOccurrence> _occurrences = [];
  List<ActivitySession> _sessions = [];
  List<InterruptionRecord> _interruptions = [];
  RescheduleEvent? _activeRescheduleEvent;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadPlannerData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadPlannerData();
    }
  }

  Future<void> _loadPlannerData() async {
    setState(() => _isLoading = true);
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final occs = await LocalStore.getOccurrences(dateStr);
    final sess = await LocalStore.getActivitySessions(dateStr);
    final ints = await LocalStore.getInterruptions();
    final rescheds = await LocalStore.getRescheduleEvents();

    final activeResched = rescheds.cast<RescheduleEvent?>().firstWhere(
          (e) => e != null && e.status == RescheduleStatus.active,
          orElse: () => null,
        );

    if (mounted) {
      setState(() {
        _occurrences = occs..sort((a, b) => a.plannedStart.compareTo(b.plannedStart));
        _sessions = sess;
        _interruptions = ints;
        _activeRescheduleEvent = activeResched;
        _isLoading = false;
      });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDate) {
      NoviHaptics.selection();
      setState(() {
        _previousDate = _selectedDate;
        _selectedDate = picked;
      });
      _loadPlannerData();
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
    _loadPlannerData();
  }

  void _openAddModal({String? templateTitle, int? templateMinutes, String? categoryId, int? hour}) {
    NoviHaptics.selection();
    AddActivityModal.show(
      context,
      targetDate: hour != null
          ? DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, hour, 0)
          : _selectedDate,
      initialTitle: templateTitle,
      initialDurationMinutes: templateMinutes,
      initialCategoryId: categoryId,
      onActivityAdded: _loadPlannerData,
    );
  }

  List<DateTime> _getWeekDates() {
    final now = _selectedDate;
    final monday = now.subtract(Duration(days: now.weekday - 1));
    return List.generate(7, (i) => monday.add(Duration(days: i)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final weekDays = _getWeekDates();
    final monthYearFormatted = DateFormat('MMMM yyyy').format(_selectedDate);
    final selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final isForward = _selectedDate.isAfter(_previousDate);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── STICKY TOP HEADER & DATE CONTROLS ──
            Container(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                border: Border(
                  bottom: BorderSide(
                    color: colorScheme.outline,
                    width: 1,
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Title & Action Icons
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      NoviSpacing.space20,
                      NoviSpacing.space12,
                      NoviSpacing.space16,
                      NoviSpacing.space4,
                    ),
                    child: NoviPageHeader(
                      title: 'Schedule',
                      subtitle: 'Plan and review your daily timeline',
                      bottomPadding: NoviSpacing.space8,
                      actions: [
                        IconButton.filledTonal(
                          icon: const Icon(Icons.history_rounded, size: 18),
                          tooltip: 'Day Replay',
                          onPressed: () {
                            DayReplaySheet.show(
                              context,
                              occurrences: _occurrences,
                              sessions: _sessions,
                              interruptions: _interruptions,
                            );
                          },
                        ),
                        const SizedBox(width: NoviSpacing.space4),
                        IconButton.filledTonal(
                          icon: const Icon(Icons.query_stats_rounded, size: 18),
                          tooltip: 'Reality Timeline',
                          onPressed: () {
                            Navigator.of(context).push(
                              NoviPageRoute(page: TimelineViewScreen(initialDate: _selectedDate)),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  // Month navigation + List/Timetable switch row
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space20),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left_rounded),
                          tooltip: 'Previous week',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                          onPressed: () {
                            NoviHaptics.selection();
                            setState(() {
                              _previousDate = _selectedDate;
                              _selectedDate = _selectedDate.subtract(const Duration(days: 7));
                            });
                            _loadPlannerData();
                          },
                        ),
                        const SizedBox(width: 2),
                        NoviPressable(
                          onTap: _pickDate,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  monthYearFormatted,
                                  style: textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.calendar_month_outlined, size: 15, color: colorScheme.primary),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),
                        IconButton(
                          icon: const Icon(Icons.chevron_right_rounded),
                          tooltip: 'Next week',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                          onPressed: () {
                            NoviHaptics.selection();
                            setState(() {
                              _previousDate = _selectedDate;
                              _selectedDate = _selectedDate.add(const Duration(days: 7));
                            });
                            _loadPlannerData();
                          },
                        ),
                        const Spacer(),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(
                              value: 'list',
                              icon: Icon(Icons.view_agenda_outlined, size: 15),
                            ),
                            ButtonSegment(
                              value: 'timetable',
                              icon: Icon(Icons.calendar_view_day_outlined, size: 15),
                            ),
                          ],
                          selected: {_viewMode},
                          onSelectionChanged: (set) {
                            NoviHaptics.selection();
                            setState(() => _viewMode = set.first);
                          },
                          style: const ButtonStyle(
                            visualDensity: VisualDensity.compact,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: NoviSpacing.space6),

                  // Horizontal 7-Day Date Selector Strip
                  Container(
                    height: 68,
                    padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space16, vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: weekDays.map((day) {
                        final isSelected = day.year == _selectedDate.year &&
                            day.month == _selectedDate.month &&
                            day.day == _selectedDate.day;
                        final isToday = day.year == DateTime.now().year &&
                            day.month == DateTime.now().month &&
                            day.day == DateTime.now().day;
                        final dayInitial = DateFormat('E').format(day)[0];
                        final dayNum = DateFormat('d').format(day);

                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: NoviPressable(
                              onTap: () {
                                if (!isSelected) {
                                  NoviHaptics.selection();
                                  setState(() {
                                    _previousDate = _selectedDate;
                                    _selectedDate = day;
                                  });
                                  _loadPlannerData();
                                }
                              },
                              child: AnimatedContainer(
                                duration: NoviMotion.duration(context, NoviMotion.fast),
                                curve: NoviMotion.easeInOut,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? colorScheme.primary
                                      : (isToday
                                          ? colorScheme.surfaceContainerHigh
                                          : colorScheme.surfaceContainer),
                                  borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                                  border: isToday && !isSelected
                                      ? Border.all(color: colorScheme.primary, width: 1.5)
                                      : null,
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      dayInitial,
                                      style: textTheme.labelSmall?.copyWith(
                                        color: isSelected
                                            ? colorScheme.onPrimary
                                            : (isToday ? colorScheme.primary : colorScheme.onSurfaceVariant),
                                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      dayNum,
                                      style: textTheme.titleMedium?.copyWith(
                                        color: isSelected
                                            ? colorScheme.onPrimary
                                            : (isToday ? colorScheme.primary : colorScheme.onSurface),
                                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: NoviSpacing.space4),
                ],
              ),
            ),

            // Active Reschedule Event Banner (If active)
            if (_activeRescheduleEvent != null)
              NoviBanner(
                event: _activeRescheduleEvent!,
                onUndo: () async {
                  NoviHaptics.medium();
                  final updated = _activeRescheduleEvent!.copyWith(status: RescheduleStatus.undone);
                  await LocalStore.saveRescheduleEvent(updated);
                  _loadPlannerData();
                },
                onDismiss: () async {
                  NoviHaptics.light();
                  final updated = _activeRescheduleEvent!.copyWith(status: RescheduleStatus.partiallyUndone);
                  await LocalStore.saveRescheduleEvent(updated);
                  _loadPlannerData();
                },
              ),

            // ── SCROLLABLE BODY ──
            Expanded(
              child: _isLoading
                  ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
                  : NoviTransitions.horizontalSlide(
                      key: ValueKey<String>(selectedDateStr),
                      forward: isForward,
                      duration: NoviMotion.duration(context, NoviMotion.medium),
                      child: _occurrences.isEmpty
                          ? _buildEmptyState(colorScheme, textTheme)
                          : _viewMode == 'list'
                              ? _buildListView(theme, colorScheme, textTheme)
                              : _buildTimetableView(theme, colorScheme, textTheme),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddModal(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Schedule'),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme, TextTheme textTheme) {
    final dateFormatted = DateFormat('MMMM d').format(_selectedDate);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space24, vertical: NoviSpacing.space32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.calendar_today_rounded,
              size: 28,
              color: colorScheme.primary,
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),
          Text(
            'No activities planned',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: NoviSpacing.space6),
          Text(
            'No scheduled blocks for $dateFormatted.',
            textAlign: TextAlign.center,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),
          FilledButton(
            onPressed: () => _openAddModal(),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            child: const Text('Schedule an activity'),
          ),
          const SizedBox(height: NoviSpacing.space28),
          Text(
            'Quick Templates',
            style: textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: NoviSpacing.space10),
          Wrap(
            spacing: NoviSpacing.space8,
            runSpacing: NoviSpacing.space8,
            alignment: WrapAlignment.center,
            children: [
              ActionChip(
                label: const Text('+ Deep Work (60m)'),
                onPressed: () => _openAddModal(
                  templateTitle: 'Deep Work & Architecture',
                  templateMinutes: 60,
                  categoryId: 'cat_work',
                ),
              ),
              ActionChip(
                label: const Text('+ DSA Practice (90m)'),
                onPressed: () => _openAddModal(
                  templateTitle: 'DSA & Algorithms Practice',
                  templateMinutes: 90,
                  categoryId: 'cat_study',
                ),
              ),
              ActionChip(
                label: const Text('+ Workout (45m)'),
                onPressed: () => _openAddModal(
                  templateTitle: 'Strength & Conditioning',
                  templateMinutes: 45,
                  categoryId: 'cat_health',
                ),
              ),
              ActionChip(
                label: const Text('+ Reading (30m)'),
                onPressed: () => _openAddModal(
                  templateTitle: 'System Design Reading',
                  templateMinutes: 30,
                  categoryId: 'cat_read',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildListView(ThemeData theme, ColorScheme colorScheme, TextTheme textTheme) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space16,
        vertical: NoviSpacing.space12,
      ),
      itemCount: _occurrences.length,
      separatorBuilder: (context, index) => Divider(
        height: 1,
        thickness: 1,
        indent: 52,
        endIndent: 12,
        color: colorScheme.outline,
      ),
      itemBuilder: (context, index) {
        final occ = _occurrences[index];
        final isCompleted = occ.status == OccurrenceStatus.completed;
        final startFormatted = DateFormat('h:mm a').format(occ.plannedStart);
        final endFormatted = DateFormat('h:mm a').format(occ.plannedEnd);
        final durationMins = occ.durationSeconds ~/ 60;

        return InkWell(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          onTap: () {
            ActivityHistorySheet.show(
              context,
              occurrence: occ,
              sessions: _sessions,
              interruptions: _interruptions,
              onOccurrenceUpdated: _loadPlannerData,
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: NoviSpacing.space8,
              vertical: NoviSpacing.space12,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Leading morph checkbox toggle
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: NoviPressable(
                    enableHaptics: true,
                    onTap: () => _toggleOccurrenceStatus(occ),
                    child: AnimatedContainer(
                      duration: NoviMotion.duration(context, NoviMotion.fast),
                      curve: NoviMotion.easeInOut,
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: isCompleted ? colorScheme.primaryContainer : colorScheme.surfaceContainerHighest,
                        shape: BoxShape.circle,
                        border: isCompleted
                            ? null
                            : Border.all(
                                color: colorScheme.outlineVariant,
                                width: 1.5,
                              ),
                      ),
                      child: NoviMorphIcon(
                        icon: isCompleted
                            ? Icons.check_rounded
                            : (occ.fixed ? Icons.lock_outline_rounded : Icons.radio_button_unchecked_rounded),
                        size: 14,
                        color: isCompleted ? colorScheme.primary : colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: NoviSpacing.space12),

                // Main Details
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
                                fontSize: 14.5,
                                decoration: isCompleted ? TextDecoration.lineThrough : null,
                                color: isCompleted
                                    ? colorScheme.onSurfaceVariant.withValues(alpha: 0.6)
                                    : colorScheme.onSurface,
                              ),
                              child: Text(occ.parentActivityTitle ?? 'Activity'),
                            ),
                          ),
                          Text(
                            '$startFormatted – $endFormatted',
                            style: textTheme.labelSmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: NoviSpacing.space4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: occ.fixed
                                  ? colorScheme.tertiaryContainer.withValues(alpha: 0.6)
                                  : colorScheme.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              occ.fixed ? 'Fixed' : 'Flexible',
                              style: textTheme.labelSmall?.copyWith(
                                fontSize: 10,
                                color: occ.fixed ? colorScheme.onTertiaryContainer : colorScheme.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            occ.completedSeconds > 0 && !isCompleted
                                ? '${(occ.completedSeconds / 60).toStringAsFixed(1)}m / ${durationMins}m (${(occ.progressPercentage * 100).round()}%)'
                                : '${durationMins}m duration',
                            style: textTheme.bodySmall?.copyWith(
                              fontSize: 11,
                              color: occ.completedSeconds > 0 && !isCompleted
                                  ? colorScheme.primary
                                  : colorScheme.onSurfaceVariant,
                              fontWeight: occ.completedSeconds > 0 && !isCompleted
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
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

                // Trailing Action: Start Focus or More Menu
                const SizedBox(width: NoviSpacing.space8),
                if (!isCompleted)
                  IconButton(
                    icon: Icon(
                      occ.completedSeconds > 0 ? Icons.play_circle_outline_rounded : Icons.play_arrow_rounded,
                    ),
                    tooltip: occ.completedSeconds > 0 ? 'Resume Focus' : 'Start Focus',
                    color: colorScheme.primary,
                    iconSize: 22,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    onPressed: () async {
                      NoviHaptics.medium();
                      await TimerEngine.startTimer(occ);
                      _loadPlannerData();
                    },
                  )
                else
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert_rounded, size: 18, color: colorScheme.onSurfaceVariant),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    onSelected: (action) async {
                      if (action == 'start_multi') {
                        NoviHaptics.medium();
                        final plan = FocusPlan(
                          id: 'plan_sched_${occ.id}',
                          title: occ.parentActivityTitle ?? 'Scheduled Work Block',
                          categoryId: occ.categoryId ?? 'cat_work',
                          steps: [
                            FocusPlanStep(
                              title: 'Deep Focus Block 1',
                              durationMinutes: durationMins >= 90 ? 50 : (durationMins ~/ 2).clamp(15, 45),
                              type: FocusPlanStepType.focus,
                            ),
                            const FocusPlanStep(
                              title: 'Smart Break',
                              durationMinutes: 10,
                              type: FocusPlanStepType.shortBreak,
                            ),
                            FocusPlanStep(
                              title: 'Deep Focus Block 2',
                              durationMinutes: durationMins >= 90
                                  ? (durationMins - 60).clamp(20, 50)
                                  : (durationMins ~/ 2).clamp(15, 45),
                              type: FocusPlanStepType.focus,
                            ),
                          ],
                        );
                        await TimerEngine.startMultiSessionPlan(plan);
                        _loadPlannerData();
                      } else if (action == 'edit') {
                        AddActivityModal.show(
                          context,
                          targetDate: _selectedDate,
                          existingOccurrence: occ,
                          onActivityAdded: _loadPlannerData,
                        );
                      } else if (action == 'delete') {
                        await LocalStore.deleteOccurrence(occ.id);
                        _loadPlannerData();
                      } else if (action == 'details') {
                        ActivityHistorySheet.show(
                          context,
                          occurrence: occ,
                          sessions: _sessions,
                          interruptions: _interruptions,
                          onOccurrenceUpdated: _loadPlannerData,
                        );
                      }
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(
                        value: 'start_multi',
                        child: Row(
                          children: [
                            Icon(Icons.layers_rounded, size: 16),
                            SizedBox(width: 8),
                            Text('Start as Multi-Session Plan'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(value: 'details', child: Text('View Evidence')),
                      const PopupMenuItem(value: 'edit', child: Text('Edit Block')),
                      const PopupMenuItem(value: 'delete', child: Text('Delete Block')),
                    ],
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTimetableView(ThemeData theme, ColorScheme colorScheme, TextTheme textTheme) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space16,
        vertical: NoviSpacing.space8,
      ),
      itemCount: 24,
      itemBuilder: (context, hour) {
        final hourStart = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, hour, 0);
        final hourEnd = hourStart.add(const Duration(hours: 1));

        final matchingOccs = _occurrences.where((o) {
          return o.plannedStart.isBefore(hourEnd) && o.plannedEnd.isAfter(hourStart);
        }).toList();

        final timeFormatted = DateFormat('h a').format(hourStart).toLowerCase();

        return InkWell(
          onTap: matchingOccs.isEmpty ? () => _openAddModal(hour: hour) : null,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 48,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    timeFormatted,
                    style: textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: colorScheme.outlineVariant.withValues(alpha: 0.5),
                        width: 1,
                      ),
                    ),
                  ),
                  child: matchingOccs.isEmpty
                      ? const SizedBox(height: 40)
                      : Column(
                          children: matchingOccs.map((occ) {
                            return Container(
                              margin: const EdgeInsets.symmetric(vertical: 3),
                              padding: const EdgeInsets.symmetric(
                                horizontal: NoviSpacing.space12,
                                vertical: NoviSpacing.space8,
                              ),
                              decoration: BoxDecoration(
                                color: colorScheme.primaryContainer.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                                border: Border.all(
                                  color: colorScheme.primary.withValues(alpha: 0.2),
                                ),
                              ),
                              child: InkWell(
                                onTap: () {
                                  ActivityHistorySheet.show(
                                    context,
                                    occurrence: occ,
                                    sessions: _sessions,
                                    interruptions: _interruptions,
                                    onOccurrenceUpdated: _loadPlannerData,
                                  );
                                },
                                child: Row(
                                  children: [
                                    Icon(
                                      occ.timerRequired ? Icons.timer_outlined : Icons.calendar_today_rounded,
                                      size: 14,
                                      color: colorScheme.primary,
                                    ),
                                    const SizedBox(width: NoviSpacing.space8),
                                    Expanded(
                                      child: Text(
                                        occ.parentActivityTitle ?? 'Activity',
                                        style: textTheme.labelMedium?.copyWith(
                                          color: colorScheme.onSurface,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      DateFormat('h:mm a').format(occ.plannedStart),
                                      style: textTheme.labelSmall?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

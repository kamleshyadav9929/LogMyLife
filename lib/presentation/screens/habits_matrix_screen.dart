import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../services/habit_engine.dart';
import '../widgets/novi_section_header.dart';
import '../widgets/novi_empty_state.dart';
import '../widgets/novi_pressable.dart';
import '../widgets/novi_page_header.dart';
import 'analytics_insights_screen.dart';

/// NOVI — Rhythms & Insights (Habit Consistency & Long-Term Mastery)
/// Sticky top header with clean grouped routines, hairline dividers, and minimal styling.

class HabitsMatrixScreen extends StatefulWidget {
  const HabitsMatrixScreen({super.key});

  @override
  State<HabitsMatrixScreen> createState() => _HabitsMatrixScreenState();
}

class _HabitsMatrixScreenState extends State<HabitsMatrixScreen> with WidgetsBindingObserver {
  List<HabitItem> _habits = [];
  List<SubjectProgress> _syllabus = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final habits = await LocalStore.getHabits();
    final syllabus = await LocalStore.getSyllabus();

    if (mounted) {
      setState(() {
        _habits = habits;
        _syllabus = syllabus;
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleHabit(String habitId) async {
    NoviHaptics.selection();
    await HabitEngine.toggleHabitCompletion(habitId);
    _loadData();
  }

  void _openAnalyticsScreen() {
    Navigator.of(context).push(
      NoviPageRoute(page: const AnalyticsInsightsScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final todayStr = LocalStore.getTodayDateStr();

    // Generate last 7 days list
    final now = DateTime.now();
    final past7Days = List.generate(7, (i) {
      final d = now.subtract(Duration(days: 6 - i));
      return {
        'dateStr': DateFormat('yyyy-MM-dd').format(d),
        'dayLabel': DateFormat('E').format(d)[0],
      };
    });

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: _isLoading
            ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
            : Column(
                children: [
                  // ── STICKY TOP HEADER ──
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
                    child: NoviPageHeader(
                      title: 'Rhythms',
                      subtitle: 'Daily routines & ongoing mastery',
                      bottomPadding: 0,
                      actions: [
                        IconButton.filledTonal(
                          icon: const Icon(Icons.insights_rounded, size: 18),
                          tooltip: 'Deep Analytics',
                          onPressed: _openAnalyticsScreen,
                        ),
                        const SizedBox(width: NoviSpacing.space4),
                        IconButton.filledTonal(
                          onPressed: () => _showHabitEditorModal(context),
                          icon: const Icon(Icons.add_rounded, size: 18),
                          tooltip: 'Add Routine',
                        ),
                      ],
                    ),
                  ),

                  // ── SCROLLABLE BODY ──
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: NoviSpacing.space20,
                        vertical: NoviSpacing.space16,
                      ),
                      children: [
                        // Section 1: Daily Routines
                        NoviSectionHeader(
                          title: 'Daily Routines',
                          subtitle: 'Tracked micro-habits and continuity',
                          actionLabel: '+ Add Routine',
                          onAction: () => _showHabitEditorModal(context),
                        ),

                        if (_habits.isEmpty)
                          NoviEmptyState(
                            icon: Icons.repeat_rounded,
                            title: 'No routines added yet',
                            description: 'Build quiet consistency by adding your first daily routine.',
                            actionLabel: 'Add routine',
                            onAction: () => _showHabitEditorModal(context),
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
                              itemCount: _habits.length,
                              separatorBuilder: (context, index) => Divider(
                                height: 1,
                                thickness: 1,
                                indent: 16,
                                endIndent: 16,
                                color: colorScheme.outline,
                              ),
                              itemBuilder: (context, index) {
                                final habit = _habits[index];
                                final isDoneToday = habit.completedDates.contains(todayStr);

                                return Padding(
                                  padding: const EdgeInsets.all(NoviSpacing.space14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 34,
                                            height: 34,
                                            decoration: BoxDecoration(
                                              color: colorScheme.surfaceContainerHighest,
                                              borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              habit.icon.isNotEmpty ? habit.icon : '🎯',
                                              style: const TextStyle(fontSize: 17),
                                            ),
                                          ),
                                          const SizedBox(width: NoviSpacing.space12),
                                          Expanded(
                                            child: InkWell(
                                              onTap: () => _showHabitEditorModal(context, existingHabit: habit),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    habit.title,
                                                    style: textTheme.titleSmall?.copyWith(
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 14.5,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Row(
                                                    children: [
                                                      Text(
                                                        '${habit.targetMinutes}m · ',
                                                        style: textTheme.bodySmall?.copyWith(
                                                          color: colorScheme.onSurfaceVariant,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                      NoviAnimatedCounter(
                                                        value: habit.completedDaysStreak.toDouble(),
                                                        style: textTheme.bodySmall?.copyWith(
                                                          color: colorScheme.onSurfaceVariant,
                                                          fontWeight: FontWeight.w600,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                      Text(
                                                        ' days streak',
                                                        style: textTheme.bodySmall?.copyWith(
                                                          color: colorScheme.onSurfaceVariant,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          NoviPressable(
                                            enableHaptics: true,
                                            onTap: () => _toggleHabit(habit.id),
                                            child: Padding(
                                              padding: const EdgeInsets.all(4),
                                              child: NoviMorphIcon(
                                                icon: isDoneToday
                                                    ? Icons.check_circle_rounded
                                                    : Icons.radio_button_unchecked_rounded,
                                                color: isDoneToday
                                                    ? colorScheme.primary
                                                    : colorScheme.outline,
                                                size: 26,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: NoviSpacing.space12),

                                      // 7-day mini consistency check-in row
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: past7Days.map((day) {
                                          final date = day['dateStr']!;
                                          final label = day['dayLabel']!;
                                          final isDone = habit.completedDates.contains(date);
                                          final isCurrentDay = date == todayStr;

                                          return Column(
                                            children: [
                                              Text(
                                                label,
                                                style: textTheme.labelSmall?.copyWith(
                                                  fontSize: 10,
                                                  fontWeight: isCurrentDay ? FontWeight.w700 : FontWeight.w500,
                                                  color: isCurrentDay
                                                      ? colorScheme.primary
                                                      : colorScheme.onSurfaceVariant,
                                                ),
                                              ),
                                              const SizedBox(height: NoviSpacing.space4),
                                              NoviPressable(
                                                onTap: () async {
                                                  NoviHaptics.selection();
                                                  await HabitEngine.toggleHabitCompletion(habit.id, date);
                                                  _loadData();
                                                },
                                                child: AnimatedContainer(
                                                  duration: NoviMotion.duration(context, NoviMotion.feedback),
                                                  curve: NoviMotion.easeInOut,
                                                  width: 30,
                                                  height: 30,
                                                  decoration: BoxDecoration(
                                                    color: isDone
                                                        ? colorScheme.primaryContainer
                                                        : colorScheme.surfaceContainerHighest,
                                                    shape: BoxShape.circle,
                                                    border: isCurrentDay
                                                        ? Border.all(color: colorScheme.primary, width: 1.5)
                                                        : null,
                                                  ),
                                                  alignment: Alignment.center,
                                                  child: isDone
                                                      ? Icon(
                                                          Icons.check_rounded,
                                                          size: 14,
                                                          color: colorScheme.onPrimaryContainer,
                                                        )
                                                      : null,
                                                ),
                                              ),
                                            ],
                                          );
                                        }).toList(),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),

                        const SizedBox(height: NoviSpacing.space24),

                        // Section 2: Goals & Long-Term Intentions
                        NoviSectionHeader(
                          title: 'Goals & Milestones',
                          subtitle: 'Long-term learning & project progression',
                          actionLabel: '+ Add Track',
                          onAction: () => _showSubjectEditorModal(context),
                        ),

                        if (_syllabus.isEmpty)
                          NoviEmptyState(
                            icon: Icons.flag_rounded,
                            title: 'No learning tracks yet',
                            description: 'Track long-term mastery by creating your first subject or project target.',
                            actionLabel: 'Add learning track',
                            onAction: () => _showSubjectEditorModal(context),
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
                              itemCount: _syllabus.length,
                              separatorBuilder: (context, index) => Divider(
                                height: 1,
                                thickness: 1,
                                indent: 16,
                                endIndent: 16,
                                color: colorScheme.outline,
                              ),
                              itemBuilder: (context, index) {
                                final s = _syllabus[index];
                                final pct = s.totalTargetHours > 0
                                    ? (s.completedHours / s.totalTargetHours).clamp(0.0, 1.0)
                                    : 0.0;
                                final pctFormatted = (pct * 100).round();

                                return InkWell(
                                  onTap: () => _showSubjectEditorModal(context, existingSubject: s),
                                  child: Padding(
                                    padding: const EdgeInsets.all(NoviSpacing.space14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                s.subjectName,
                                                style: textTheme.labelLarge?.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                            Text(
                                              '${s.completedHours.toStringAsFixed(1)} / ${s.totalTargetHours.toStringAsFixed(0)}h ($pctFormatted%)',
                                              style: textTheme.labelSmall?.copyWith(
                                                color: colorScheme.primary,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: NoviSpacing.space8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                                          child: TweenAnimationBuilder<double>(
                                            tween: Tween<double>(begin: 0.0, end: pct),
                                            duration: NoviMotion.duration(context, NoviMotion.medium),
                                            curve: NoviMotion.easeOut,
                                            builder: (context, animPct, child) {
                                              return LinearProgressIndicator(
                                                value: animPct,
                                                minHeight: 6,
                                                backgroundColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                                                color: colorScheme.primary,
                                              );
                                            },
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
                                                _loadData();
                                              },
                                              icon: const Icon(Icons.add_rounded, size: 14),
                                              label: const Text('+1 hour'),
                                              style: TextButton.styleFrom(
                                                visualDensity: VisualDensity.compact,
                                                padding: const EdgeInsets.symmetric(horizontal: 6),
                                              ),
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

                        const SizedBox(height: NoviSpacing.space40),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  void _showHabitEditorModal(BuildContext context, {HabitItem? existingHabit}) {
    final titleController = TextEditingController(text: existingHabit?.title ?? '');
    int duration = existingHabit?.targetMinutes ?? 30;
    String selectedIcon = existingHabit?.icon ?? '🎯';
    final isEdit = existingHabit != null;

    final iconsList = ['🎯', '🧠', '⚡', '📖', '🌙', '🧘', '💻', '🏃', '💧', '✍️'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final bottomInset = MediaQuery.of(context).viewInsets.bottom;
          final colorScheme = Theme.of(context).colorScheme;

          return Padding(
            padding: EdgeInsets.only(
              top: NoviSpacing.space8,
              left: NoviSpacing.space16,
              right: NoviSpacing.space16,
              bottom: bottomInset + NoviSpacing.space16,
            ),
            child: SingleChildScrollView(
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusSheet),
                ),
                padding: const EdgeInsets.all(NoviSpacing.space20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isEdit ? 'Edit Routine' : 'New Daily Routine',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        if (isEdit)
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded),
                            tooltip: 'Delete Routine',
                            color: colorScheme.error,
                            onPressed: () async {
                              NoviHaptics.medium();
                              await LocalStore.deleteHabit(existingHabit.id);
                              _loadData();
                              if (ctx.mounted) Navigator.pop(ctx);
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Routine Name',
                        hintText: 'e.g. Morning Mindfulness',
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    Text(
                      'Select Icon',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: NoviSpacing.space8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: iconsList.map((icon) {
                        final isSelected = icon == selectedIcon;
                        return InkWell(
                          onTap: () => setModalState(() => selectedIcon = icon),
                          borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: isSelected ? colorScheme.primaryContainer : colorScheme.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                              border: isSelected ? Border.all(color: colorScheme.primary, width: 2) : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(icon, style: const TextStyle(fontSize: 20)),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Target Duration: ${duration}m', style: Theme.of(context).textTheme.bodyMedium),
                        Slider(
                          value: duration.toDouble(),
                          min: 5,
                          max: 120,
                          divisions: 23,
                          onChanged: (val) => setModalState(() => duration = val.round()),
                        ),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () async {
                          final title = titleController.text.trim();
                          if (title.isEmpty) return;

                          NoviHaptics.medium();
                          if (isEdit) {
                            final updated = HabitItem(
                              id: existingHabit.id,
                              title: title,
                              targetMinutes: duration,
                              colorHex: existingHabit.colorHex,
                              icon: selectedIcon,
                              completedDaysStreak: existingHabit.completedDaysStreak,
                              completedDates: existingHabit.completedDates,
                            );
                            await LocalStore.saveHabit(updated);
                          } else {
                            final newHabit = HabitItem(
                              id: 'habit_${DateTime.now().millisecondsSinceEpoch}',
                              title: title,
                              targetMinutes: duration,
                              colorHex: '#DFDFDF',
                              icon: selectedIcon,
                              completedDates: [],
                              completedDaysStreak: 0,
                            );
                            await LocalStore.saveHabit(newHabit);
                          }
                          _loadData();
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                        child: Text(isEdit ? 'Save Changes' : 'Create Routine'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showSubjectEditorModal(BuildContext context, {SubjectProgress? existingSubject}) {
    final titleController = TextEditingController(text: existingSubject?.subjectName ?? '');
    final hoursController = TextEditingController(text: existingSubject?.totalTargetHours.toStringAsFixed(0) ?? '50');
    final isEdit = existingSubject != null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final bottomInset = MediaQuery.of(context).viewInsets.bottom;
          final colorScheme = Theme.of(context).colorScheme;

          return Padding(
            padding: EdgeInsets.only(
              top: NoviSpacing.space8,
              left: NoviSpacing.space16,
              right: NoviSpacing.space16,
              bottom: bottomInset + NoviSpacing.space16,
            ),
            child: SingleChildScrollView(
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusSheet),
                ),
                padding: const EdgeInsets.all(NoviSpacing.space20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isEdit ? 'Edit Learning Track' : 'New Learning Track',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        if (isEdit)
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded),
                            tooltip: 'Delete Track',
                            color: colorScheme.error,
                            onPressed: () async {
                              NoviHaptics.medium();
                              await LocalStore.deleteSubject(existingSubject.subjectName);
                              _loadData();
                              if (ctx.mounted) Navigator.pop(ctx);
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    TextField(
                      controller: titleController,
                      enabled: !isEdit,
                      decoration: const InputDecoration(
                        labelText: 'Subject / Project Name',
                        hintText: 'e.g. Distributed Systems & Golang',
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space16),
                    TextField(
                      controller: hoursController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Total Target Hours',
                        hintText: '50',
                      ),
                    ),
                    const SizedBox(height: NoviSpacing.space20),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () async {
                          final title = titleController.text.trim();
                          final hours = double.tryParse(hoursController.text.trim()) ?? 50.0;
                          if (title.isEmpty) return;

                          NoviHaptics.medium();
                          final updated = SubjectProgress(
                            subjectName: title,
                            completedHours: existingSubject?.completedHours ?? 0.0,
                            totalTargetHours: hours,
                            colorHex: existingSubject?.colorHex ?? '#DFDFDF',
                          );
                          await LocalStore.updateSubjectProgress(updated);
                          _loadData();
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                        child: Text(isEdit ? 'Save Changes' : 'Create Track'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

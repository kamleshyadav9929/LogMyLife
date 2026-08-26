import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import 'novi_card.dart';
import 'novi_pressable.dart';
import 'activity_history_sheet.dart';

/// NOVI — Universal Search & Discovery Modal
/// Instant keyword search across activities, habits, syllabus goals, and logged sessions.
/// Enhanced with smooth keyboard focus transitions and tactile chip suggestions.

class NoviSearchModal extends StatefulWidget {
  final VoidCallback onDataChanged;

  const NoviSearchModal({super.key, required this.onDataChanged});

  static Future<void> show(BuildContext context, {required VoidCallback onDataChanged}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => NoviSearchModal(onDataChanged: onDataChanged),
    );
  }

  @override
  State<NoviSearchModal> createState() => _NoviSearchModalState();
}

class _NoviSearchModalState extends State<NoviSearchModal> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  List<ActivityOccurrence> _allOccurrences = [];
  List<HabitItem> _allHabits = [];
  List<SubjectProgress> _allSyllabus = [];
  List<ActivitySession> _allSessions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadIndexData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadIndexData() async {
    final occs = await LocalStore.getOccurrences();
    final habits = await LocalStore.getHabits();
    final syllabus = await LocalStore.getSyllabus();
    final sessions = await LocalStore.getActivitySessions();

    if (mounted) {
      setState(() {
        _allOccurrences = occs;
        _allHabits = habits;
        _allSyllabus = syllabus;
        _allSessions = sessions;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    final queryClean = _query.trim().toLowerCase();

    final matchedOccurrences = queryClean.isEmpty
        ? <ActivityOccurrence>[]
        : _allOccurrences.where((o) => (o.parentActivityTitle ?? '').toLowerCase().contains(queryClean)).toList();

    final matchedHabits = queryClean.isEmpty
        ? <HabitItem>[]
        : _allHabits.where((h) => h.title.toLowerCase().contains(queryClean)).toList();

    final matchedSyllabus = queryClean.isEmpty
        ? <SubjectProgress>[]
        : _allSyllabus.where((s) => s.subjectName.toLowerCase().contains(queryClean)).toList();

    final matchedSessions = queryClean.isEmpty
        ? <ActivitySession>[]
        : _allSessions.where((s) => s.appName.toLowerCase().contains(queryClean) || (s.packageName ?? '').toLowerCase().contains(queryClean)).toList();

    final totalMatches = matchedOccurrences.length + matchedHabits.length + matchedSyllabus.length + matchedSessions.length;

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.75,
      child: Padding(
        padding: EdgeInsets.only(
          top: NoviSpacing.space8,
          left: NoviSpacing.space16,
          right: NoviSpacing.space16,
          bottom: bottomInset + NoviSpacing.space16,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Field
            TextField(
              controller: _searchController,
              autofocus: true,
            onChanged: (val) => setState(() => _query = val),
            style: textTheme.bodyLarge,
            decoration: InputDecoration(
              hintText: 'Search activities, routines, goals...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded),
                      onPressed: () {
                        NoviHaptics.light();
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    )
                  : null,
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),

          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_query.isEmpty) ...[
            Text(
              'Quick Suggestions',
              style: textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: NoviSpacing.space8),
            Wrap(
              spacing: NoviSpacing.space8,
              runSpacing: NoviSpacing.space8,
              children: ['DSA', 'Workout', 'Code', 'Deep Work', 'System Design'].map((tag) {
                return NoviPressable(
                  onTap: () {
                    NoviHaptics.selection();
                    _searchController.text = tag;
                    setState(() => _query = tag);
                  },
                  child: ActionChip(
                    label: Text(tag),
                    onPressed: () {
                      NoviHaptics.selection();
                      _searchController.text = tag;
                      setState(() => _query = tag);
                    },
                  ),
                );
              }).toList(),
            ),
            const Spacer(),
          ] else if (totalMatches == 0) ...[
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.search_off_rounded, size: 48, color: colorScheme.outline),
                    const SizedBox(height: NoviSpacing.space12),
                    Text(
                      'No results found for "$_query"',
                      style: textTheme.titleSmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Expanded(
              child: ListView(
                children: [
                  // Occurrences section
                  if (matchedOccurrences.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                      child: Text(
                        'Scheduled Activities (${matchedOccurrences.length})',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    ...matchedOccurrences.map((occ) => NoviCard(
                          margin: const EdgeInsets.only(bottom: NoviSpacing.space6),
                          padding: const EdgeInsets.all(NoviSpacing.space12),
                          onTap: () {
                            Navigator.pop(context);
                            ActivityHistorySheet.show(
                              context,
                              occurrence: occ,
                              sessions: _allSessions,
                              interruptions: const [],
                              onOccurrenceUpdated: widget.onDataChanged,
                            );
                          },
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today_rounded, size: 16, color: colorScheme.primary),
                              const SizedBox(width: NoviSpacing.space10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      occ.parentActivityTitle ?? 'Activity',
                                      style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '${occ.occurrenceDate} · ${occ.durationSeconds ~/ 60} mins',
                                      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right_rounded, size: 18, color: colorScheme.onSurfaceVariant),
                            ],
                          ),
                        )),
                    const SizedBox(height: NoviSpacing.space12),
                  ],

                  // Habits section
                  if (matchedHabits.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                      child: Text(
                        'Daily Routines (${matchedHabits.length})',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.secondary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    ...matchedHabits.map((habit) => NoviCard(
                          margin: const EdgeInsets.only(bottom: NoviSpacing.space6),
                          padding: const EdgeInsets.all(NoviSpacing.space12),
                          child: Row(
                            children: [
                              Text(habit.icon.isNotEmpty ? habit.icon : '🎯', style: const TextStyle(fontSize: 16)),
                              const SizedBox(width: NoviSpacing.space10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      habit.title,
                                      style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '${habit.targetMinutes}m target · ${habit.completedDaysStreak} day streak',
                                      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                    const SizedBox(height: NoviSpacing.space12),
                  ],

                  // Syllabus goals section
                  if (matchedSyllabus.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                      child: Text(
                        'Learning Goals (${matchedSyllabus.length})',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.tertiary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    ...matchedSyllabus.map((s) => NoviCard(
                          margin: const EdgeInsets.only(bottom: NoviSpacing.space6),
                          padding: const EdgeInsets.all(NoviSpacing.space12),
                          child: Row(
                            children: [
                              Icon(Icons.flag_rounded, size: 16, color: colorScheme.tertiary),
                              const SizedBox(width: NoviSpacing.space10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.subjectName,
                                      style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '${s.completedHours.toStringAsFixed(1)} / ${s.totalTargetHours.toStringAsFixed(0)} hours logged',
                                      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                    const SizedBox(height: NoviSpacing.space12),
                  ],

                  // Past sessions section
                  if (matchedSessions.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space6),
                      child: Text(
                        'Logged App Activity (${matchedSessions.length})',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorScheme.outline,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    ...matchedSessions.take(5).map((sess) => NoviCard(
                          margin: const EdgeInsets.only(bottom: NoviSpacing.space6),
                          padding: const EdgeInsets.all(NoviSpacing.space12),
                          child: Row(
                            children: [
                              Icon(Icons.phone_android_rounded, size: 16, color: colorScheme.onSurfaceVariant),
                              const SizedBox(width: NoviSpacing.space10),
                              Expanded(
                                child: Text(
                                  sess.appName,
                                  style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                                ),
                              ),
                              Text(
                                '${(sess.durationSeconds ?? 0) ~/ 60}m',
                                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                        )),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
      ),
    );
  }
}

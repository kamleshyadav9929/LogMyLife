import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../services/timer_engine.dart';
import '../widgets/novi_pressable.dart';

/// NOVI — Full-Screen Search & Discovery
/// Dedicated full page with filter categories, live fuzzy search across
/// planned activities, daily routines, syllabus goals, and focus session records.

class SearchScreen extends StatefulWidget {
  final VoidCallback? onFocusStarted;

  const SearchScreen({super.key, this.onFocusStarted});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  List<ActivityOccurrence> _allOccurrences = [];
  List<HabitItem> _allHabits = [];
  List<SubjectProgress> _allSubjects = [];
  List<ActivitySession> _allSessions = [];
  bool _isLoading = true;

  String _selectedCategory = 'all'; // all, activities, routines, goals, sessions

  static const List<String> _quickSuggestions = [
    'Deep Work',
    'Morning Routine',
    'Syllabus Track',
    'Physics',
    'Coding',
    'Workout',
  ];

  @override
  void initState() {
    super.initState();
    _loadSearchIndex();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadSearchIndex() async {
    try {
      final occs = await LocalStore.getOccurrences();
      final habits = await LocalStore.getHabits();
      final subjects = await LocalStore.getSyllabus();
      final sessions = await LocalStore.getActivitySessions();

      if (mounted) {
        setState(() {
          _allOccurrences = occs;
          _allHabits = habits;
          _allSubjects = subjects;
          _allSessions = sessions;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final query = _searchController.text.trim().toLowerCase();

    final filteredOccs = _allOccurrences.where((o) {
      final title = (o.parentActivityTitle ?? '').toLowerCase();
      return query.isEmpty || title.contains(query);
    }).toList();

    final filteredHabits = _allHabits.where((h) {
      return query.isEmpty || h.title.toLowerCase().contains(query);
    }).toList();

    final filteredSubjects = _allSubjects.where((s) {
      return query.isEmpty || s.subjectName.toLowerCase().contains(query);
    }).toList();

    final filteredSessions = _allSessions.where((s) {
      final title = s.appName.toLowerCase();
      final classification = (s.classification ?? '').toLowerCase();
      return query.isEmpty || title.contains(query) || classification.contains(query);
    }).toList();

    final totalResults = (_selectedCategory == 'all' || _selectedCategory == 'activities' ? filteredOccs.length : 0) +
        (_selectedCategory == 'all' || _selectedCategory == 'routines' ? filteredHabits.length : 0) +
        (_selectedCategory == 'all' || _selectedCategory == 'goals' ? filteredSubjects.length : 0) +
        (_selectedCategory == 'all' || _selectedCategory == 'sessions' ? filteredSessions.length : 0);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── STICKY TOP SEARCH APP BAR ──
            Container(
              padding: const EdgeInsets.fromLTRB(
                NoviSpacing.space8,
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
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, size: 22),
                    tooltip: 'Back',
                    onPressed: () {
                      NoviHaptics.light();
                      Navigator.of(context).pop();
                    },
                  ),
                  const SizedBox(width: NoviSpacing.space4),
                  Expanded(
                    child: Container(
                      height: 46,
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainer,
                        borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space12),
                      child: Row(
                        children: [
                          Icon(
                            Icons.search_rounded,
                            size: 20,
                            color: colorScheme.primary,
                          ),
                          const SizedBox(width: NoviSpacing.space8),
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              focusNode: _searchFocusNode,
                              autofocus: true,
                              onChanged: (_) => setState(() {}),
                              style: textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Search activities, routines, goals...',
                                hintStyle: textTheme.bodyMedium?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                filled: false,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                          if (_searchController.text.isNotEmpty)
                            IconButton(
                              icon: const Icon(Icons.close_rounded, size: 18),
                              splashRadius: 16,
                              onPressed: () {
                                _searchController.clear();
                                setState(() {});
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── CATEGORY FILTER PILLS ──
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space16, vertical: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildFilterChip('all', 'All', totalResults),
                  const SizedBox(width: 8),
                  _buildFilterChip('activities', 'Activities', filteredOccs.length),
                  const SizedBox(width: 8),
                  _buildFilterChip('routines', 'Routines', filteredHabits.length),
                  const SizedBox(width: 8),
                  _buildFilterChip('goals', 'Goals & Tracks', filteredSubjects.length),
                  const SizedBox(width: 8),
                  _buildFilterChip('sessions', 'Past Sessions', filteredSessions.length),
                ],
              ),
            ),

            // ── SEARCH RESULTS / SUGGESTIONS BODY ──
            Expanded(
              child: _isLoading
                  ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
                  : query.isEmpty
                      ? _buildEmptyQuerySuggestions(colorScheme, textTheme)
                      : totalResults == 0
                          ? _buildNoResultsState(query, colorScheme, textTheme)
                          : _buildSearchResultsList(
                              query: query,
                              occs: filteredOccs,
                              habits: filteredHabits,
                              subjects: filteredSubjects,
                              sessions: filteredSessions,
                              colorScheme: colorScheme,
                              textTheme: textTheme,
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String categoryKey, String label, int count) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isSelected = _selectedCategory == categoryKey;

    return NoviPressable(
      onTap: () {
        NoviHaptics.selection();
        setState(() => _selectedCategory = categoryKey);
      },
      child: AnimatedContainer(
        duration: NoviMotion.duration(context, NoviMotion.fast),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? colorScheme.primary : colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : colorScheme.onSurfaceVariant,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.25)
                      : colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyQuerySuggestions(ColorScheme colorScheme, TextTheme textTheme) {
    return ListView(
      padding: const EdgeInsets.all(NoviSpacing.space20),
      children: [
        Text(
          'QUICK SUGGESTIONS',
          style: textTheme.labelSmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: NoviSpacing.space12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _quickSuggestions.map((s) {
            return NoviPressable(
              onTap: () {
                NoviHaptics.selection();
                _searchController.text = s;
                _searchController.selection = TextSelection.fromPosition(
                  TextPosition(offset: s.length),
                );
                setState(() {});
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.north_west_rounded, size: 12, color: colorScheme.primary),
                    const SizedBox(width: 6),
                    Text(
                      s,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: NoviSpacing.space28),

        // Index stats overview card
        Text(
          'LOCAL SEARCH INDEX',
          style: textTheme.labelSmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: NoviSpacing.space12),
        Container(
          padding: const EdgeInsets.all(NoviSpacing.space16),
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainer,
            borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          ),
          child: Column(
            children: [
              _buildIndexStatRow(
                icon: Icons.calendar_today_rounded,
                title: 'Scheduled Blocks',
                count: _allOccurrences.length,
                colorScheme: colorScheme,
                textTheme: textTheme,
              ),
              const Divider(height: 20),
              _buildIndexStatRow(
                icon: Icons.repeat_rounded,
                title: 'Daily Routines',
                count: _allHabits.length,
                colorScheme: colorScheme,
                textTheme: textTheme,
              ),
              const Divider(height: 20),
              _buildIndexStatRow(
                icon: Icons.flag_rounded,
                title: 'Mastery Goals & Topics',
                count: _allSubjects.length,
                colorScheme: colorScheme,
                textTheme: textTheme,
              ),
              const Divider(height: 20),
              _buildIndexStatRow(
                icon: Icons.timer_outlined,
                title: 'Focus Sessions Recorded',
                count: _allSessions.length,
                colorScheme: colorScheme,
                textTheme: textTheme,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIndexStatRow({
    required IconData icon,
    required String title,
    required int count,
    required ColorScheme colorScheme,
    required TextTheme textTheme,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: colorScheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          '$count items',
          style: textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildNoResultsState(String query, ColorScheme colorScheme, TextTheme textTheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NoviSpacing.space32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.search_off_rounded, size: 30, color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: NoviSpacing.space16),
            Text(
              'No results for "$query"',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: NoviSpacing.space6),
            Text(
              'Try searching with a different term or check your filter category.',
              textAlign: TextAlign.center,
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResultsList({
    required String query,
    required List<ActivityOccurrence> occs,
    required List<HabitItem> habits,
    required List<SubjectProgress> subjects,
    required List<ActivitySession> sessions,
    required ColorScheme colorScheme,
    required TextTheme textTheme,
  }) {
    final showOccs = (_selectedCategory == 'all' || _selectedCategory == 'activities') && occs.isNotEmpty;
    final showHabits = (_selectedCategory == 'all' || _selectedCategory == 'routines') && habits.isNotEmpty;
    final showSubjects = (_selectedCategory == 'all' || _selectedCategory == 'goals') && subjects.isNotEmpty;
    final showSessions = (_selectedCategory == 'all' || _selectedCategory == 'sessions') && sessions.isNotEmpty;

    return ListView(
      padding: const EdgeInsets.symmetric(
        horizontal: NoviSpacing.space20,
        vertical: NoviSpacing.space12,
      ),
      children: [
        // ── 1. ACTIVITIES SECTION ──
        if (showOccs) ...[
          _buildSectionHeader('SCHEDULED ACTIVITIES (${occs.length})', colorScheme, textTheme),
          const SizedBox(height: NoviSpacing.space8),
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: occs.length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                indent: 52,
                endIndent: 12,
                color: colorScheme.outline.withValues(alpha: 0.3),
              ),
              itemBuilder: (context, index) {
                final occ = occs[index];
                final startFormatted = DateFormat('h:mm a').format(occ.plannedStart);
                final durationMins = occ.durationSeconds ~/ 60;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: colorScheme.surfaceContainerHigh,
                    child: Icon(Icons.schedule_rounded, size: 16, color: colorScheme.primary),
                  ),
                  title: Text(
                    occ.parentActivityTitle ?? 'Activity Block',
                    style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    occ.completedSeconds > 0 && occ.status != OccurrenceStatus.completed
                        ? '$startFormatted · ${(occ.completedSeconds / 60).toStringAsFixed(1)}m / $durationMins min (${(occ.progressPercentage * 100).round()}%)'
                        : '$startFormatted · $durationMins min · ${occ.status.name}',
                    style: textTheme.bodySmall?.copyWith(
                      color: occ.completedSeconds > 0 && occ.status != OccurrenceStatus.completed
                          ? colorScheme.primary
                          : colorScheme.onSurfaceVariant,
                      fontWeight: occ.completedSeconds > 0 && occ.status != OccurrenceStatus.completed
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                  trailing: FilledButton.tonal(
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      minimumSize: const Size(0, 32),
                    ),
                    onPressed: () async {
                      NoviHaptics.medium();
                      await TimerEngine.startTimer(occ);
                      widget.onFocusStarted?.call();
                      if (context.mounted) Navigator.pop(context);
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          occ.completedSeconds > 0 ? Icons.play_circle_outline_rounded : Icons.play_arrow_rounded,
                          size: 16,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          occ.completedSeconds > 0 && occ.status != OccurrenceStatus.completed ? 'Resume' : 'Focus',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),
        ],

        // ── 2. ROUTINES & HABITS SECTION ──
        if (showHabits) ...[
          _buildSectionHeader('DAILY ROUTINES (${habits.length})', colorScheme, textTheme),
          const SizedBox(height: NoviSpacing.space8),
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: habits.length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                indent: 52,
                endIndent: 12,
                color: colorScheme.outline.withValues(alpha: 0.3),
              ),
              itemBuilder: (context, index) {
                final habit = habits[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: colorScheme.surfaceContainerHigh,
                    child: Text(
                      habit.icon.isNotEmpty ? habit.icon : '🎯',
                      style: const TextStyle(fontSize: 15),
                    ),
                  ),
                  title: Text(
                    habit.title,
                    style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    '${habit.targetMinutes}m target · ${habit.completedDaysStreak} day streak',
                    style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  trailing: Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  onTap: () {
                    NoviHaptics.light();
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),
        ],

        // ── 3. GOALS & SYLLABUS SECTION ──
        if (showSubjects) ...[
          _buildSectionHeader('GOALS & MASTERY TRACKS (${subjects.length})', colorScheme, textTheme),
          const SizedBox(height: NoviSpacing.space8),
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: subjects.length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                indent: 52,
                endIndent: 12,
                color: colorScheme.outline.withValues(alpha: 0.3),
              ),
              itemBuilder: (context, index) {
                final s = subjects[index];
                final pct = s.totalTargetHours > 0
                    ? ((s.completedHours / s.totalTargetHours) * 100).clamp(0, 100).round()
                    : 0;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: colorScheme.surfaceContainerHigh,
                    child: Icon(Icons.flag_rounded, size: 16, color: colorScheme.primary),
                  ),
                  title: Text(
                    s.subjectName,
                    style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 3),
                      Text(
                        '${s.completedHours.toStringAsFixed(1)}h / ${s.totalTargetHours.toStringAsFixed(0)}h ($pct%)',
                        style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 5),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(2),
                        child: LinearProgressIndicator(
                          value: s.totalTargetHours > 0 ? (s.completedHours / s.totalTargetHours).clamp(0.0, 1.0) : 0,
                          minHeight: 3,
                          backgroundColor: colorScheme.surfaceContainerHigh,
                          color: colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  onTap: () {
                    NoviHaptics.light();
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),
        ],

        // ── 4. SESSIONS HISTORY SECTION ──
        if (showSessions) ...[
          _buildSectionHeader('FOCUS SESSIONS (${sessions.length})', colorScheme, textTheme),
          const SizedBox(height: NoviSpacing.space8),
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: sessions.take(10).length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                indent: 52,
                endIndent: 12,
                color: colorScheme.outline.withValues(alpha: 0.3),
              ),
              itemBuilder: (context, index) {
                final session = sessions[index];
                final date = DateTime.fromMillisecondsSinceEpoch(session.startedAt);
                final dateStr = DateFormat('MMM d, h:mm a').format(date);
                final durationMins = (session.durationSeconds ?? 0) ~/ 60;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: colorScheme.surfaceContainerHigh,
                    child: Icon(Icons.check_circle_outline_rounded, size: 16, color: colorScheme.primary),
                  ),
                  title: Text(
                    session.appName.isNotEmpty ? session.appName : (session.classification ?? 'Focus Session'),
                    style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    '$dateStr · $durationMins min · ${session.sourceType.name}',
                    style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(String title, ColorScheme colorScheme, TextTheme textTheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Text(
        title,
        style: textTheme.labelSmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
          letterSpacing: 1.2,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

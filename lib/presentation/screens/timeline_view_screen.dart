import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../widgets/novi_card.dart';
import '../widgets/novi_empty_state.dart';
import '../widgets/novi_pressable.dart';
import '../widgets/day_replay_sheet.dart';

/// NOVI — Timeline Flow (Audited Reality vs Intent)
/// Chronological timeline of audited application sessions with confidence filtering and smooth date switching.

class TimelineViewScreen extends StatefulWidget {
  final DateTime? initialDate;

  const TimelineViewScreen({super.key, this.initialDate});

  @override
  State<TimelineViewScreen> createState() => _TimelineViewScreenState();
}

class _TimelineViewScreenState extends State<TimelineViewScreen> {
  late DateTime _selectedDate;
  List<ActivityOccurrence> _occurrences = [];
  List<ActivitySession> _sessions = [];
  List<InterruptionRecord> _interruptions = [];
  String _selectedFilter = 'all'; // 'all' | 'high' | 'medium'
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.initialDate ?? DateTime.now();
    _loadTimelineData();
  }

  Future<void> _loadTimelineData() async {
    setState(() => _isLoading = true);
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final occs = await LocalStore.getOccurrences(dateStr);
    final sess = await LocalStore.getActivitySessions(dateStr);
    final ints = await LocalStore.getInterruptions();

    if (mounted) {
      setState(() {
        _occurrences = occs;
        _sessions = sess..sort((a, b) => a.startedAt.compareTo(b.startedAt));
        _interruptions = ints;
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
      setState(() => _selectedDate = picked);
      _loadTimelineData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final filteredSessions = _sessions.where((s) {
      if (_selectedFilter == 'high') return s.confidence == ConfidenceLevel.high;
      if (_selectedFilter == 'medium') return s.confidence == ConfidenceLevel.medium;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reality Timeline'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined),
            tooltip: 'Pick date',
            onPressed: _pickDate,
          ),
          IconButton(
            icon: const Icon(Icons.history_rounded),
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
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sub-header Date Chip
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NoviSpacing.space20,
                vertical: NoviSpacing.space8,
              ),
              child: Row(
                children: [
                  NoviPressable(
                    onTap: _pickDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: NoviSpacing.space12,
                        vertical: NoviSpacing.space6,
                      ),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.calendar_today_rounded, size: 14, color: colorScheme.primary),
                          const SizedBox(width: NoviSpacing.space6),
                          Text(
                            DateFormat('EEEE, MMMM d').format(_selectedDate),
                            style: textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Confidence Filter Chips with Haptic selection
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NoviSpacing.space20,
                vertical: NoviSpacing.space4,
              ),
              child: Row(
                children: [
                  FilterChip(
                    label: const Text('All Sessions'),
                    selected: _selectedFilter == 'all',
                    onSelected: (_) {
                      NoviHaptics.selection();
                      setState(() => _selectedFilter = 'all');
                    },
                  ),
                  const SizedBox(width: NoviSpacing.space8),
                  FilterChip(
                    label: const Text('High Confidence'),
                    selected: _selectedFilter == 'high',
                    onSelected: (_) {
                      NoviHaptics.selection();
                      setState(() => _selectedFilter = 'high');
                    },
                  ),
                  const SizedBox(width: NoviSpacing.space8),
                  FilterChip(
                    label: const Text('Diagnostic'),
                    selected: _selectedFilter == 'medium',
                    onSelected: (_) {
                      NoviHaptics.selection();
                      setState(() => _selectedFilter = 'medium');
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space8),

            // Session List with animated transitions
            Expanded(
              child: _isLoading
                  ? Center(
                      child: CircularProgressIndicator(color: colorScheme.primary),
                    )
                  : filteredSessions.isEmpty
                      ? const NoviEmptyState(
                          icon: Icons.query_stats_rounded,
                          title: 'No device sessions recorded',
                          description: 'Active app usage will appear here as your day unfolds.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                            horizontal: NoviSpacing.space20,
                            vertical: NoviSpacing.space8,
                          ),
                          itemCount: filteredSessions.length,
                          itemBuilder: (context, index) {
                            final s = filteredSessions[index];
                            final startFormatted = DateFormat('h:mm a')
                                .format(DateTime.fromMillisecondsSinceEpoch(s.startedAt));
                            final endFormatted = s.endedAt != null
                                ? DateFormat('h:mm a')
                                    .format(DateTime.fromMillisecondsSinceEpoch(s.endedAt!))
                                : 'Active';
                            final isHigh = s.confidence == ConfidenceLevel.high;

                            return NoviCard(
                              margin: const EdgeInsets.only(bottom: NoviSpacing.space8),
                              padding: const EdgeInsets.all(NoviSpacing.space16),
                              backgroundColor: isHigh
                                  ? colorScheme.surfaceContainerLow
                                  : colorScheme.surfaceContainerHigh,
                              child: Row(
                                children: [
                                  Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: isHigh
                                          ? colorScheme.secondaryContainer
                                          : colorScheme.surfaceContainerHighest,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isHigh
                                          ? Icons.verified_rounded
                                          : Icons.info_outline_rounded,
                                      size: 18,
                                      color: isHigh
                                          ? colorScheme.onSecondaryContainer
                                          : colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(width: NoviSpacing.space14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          s.appName,
                                          style: textTheme.titleSmall?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: NoviSpacing.space2),
                                        Text(
                                          '$startFormatted – $endFormatted · ${(s.durationSeconds ?? 0) ~/ 60}m',
                                          style: textTheme.bodySmall?.copyWith(
                                            color: colorScheme.onSurfaceVariant,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: NoviSpacing.space8,
                                      vertical: NoviSpacing.space4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isHigh
                                          ? colorScheme.secondaryContainer
                                          : colorScheme.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                                    ),
                                    child: Text(
                                      isHigh ? 'High' : 'Diagnostic',
                                      style: textTheme.labelSmall?.copyWith(
                                        color: isHigh
                                            ? colorScheme.onSecondaryContainer
                                            : colorScheme.onSurfaceVariant,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

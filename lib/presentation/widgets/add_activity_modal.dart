import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import 'novi_card.dart';

/// NOVI — Add / Edit Activity Modal Bottom Sheet
/// Supports full Create, Read, Update, and Delete lifecycles with exact date targeting.
/// Features smooth sliding chips, tactile haptics, and save button state morphing.

class AddActivityModal extends StatefulWidget {
  final DateTime? targetDate;
  final ActivityOccurrence? existingOccurrence;
  final String? initialTitle;
  final int? initialDurationMinutes;
  final String? initialCategoryId;
  final VoidCallback onActivityAdded;

  const AddActivityModal({
    super.key,
    this.targetDate,
    this.existingOccurrence,
    this.initialTitle,
    this.initialDurationMinutes,
    this.initialCategoryId,
    required this.onActivityAdded,
  });

  static Future<void> show(
    BuildContext context, {
    DateTime? targetDate,
    ActivityOccurrence? existingOccurrence,
    String? initialTitle,
    int? initialDurationMinutes,
    String? initialCategoryId,
    required VoidCallback onActivityAdded,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AddActivityModal(
        targetDate: targetDate,
        existingOccurrence: existingOccurrence,
        initialTitle: initialTitle,
        initialDurationMinutes: initialDurationMinutes,
        initialCategoryId: initialCategoryId,
        onActivityAdded: onActivityAdded,
      ),
    );
  }

  @override
  State<AddActivityModal> createState() => _AddActivityModalState();
}

class _AddActivityModalState extends State<AddActivityModal> {
  late final TextEditingController _titleController;
  String _selectedCategory = 'cat_work';
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  int _durationMinutes = 60;
  bool _timerRequired = false;
  bool _isFixed = false;
  List<UserCategory> _categories = [];
  bool _isEditMode = false;
  bool _isSaved = false;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.existingOccurrence != null;
    final occ = widget.existingOccurrence;

    if (occ != null) {
      _titleController = TextEditingController(text: occ.parentActivityTitle ?? '');
      _selectedCategory = occ.categoryId ?? 'cat_work';
      _startTime = TimeOfDay(hour: occ.plannedStart.hour, minute: occ.plannedStart.minute);
      _durationMinutes = (occ.durationSeconds / 60).round();
      _timerRequired = occ.timerRequired;
      _isFixed = occ.fixed;
    } else {
      _titleController = TextEditingController(text: widget.initialTitle ?? '');
      if (widget.initialCategoryId != null) {
        _selectedCategory = widget.initialCategoryId!;
      }
      if (widget.initialDurationMinutes != null) {
        _durationMinutes = widget.initialDurationMinutes!;
      }
      final target = widget.targetDate ?? DateTime.now();
      _startTime = TimeOfDay(hour: target.hour, minute: target.minute);
    }
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final cats = await LocalStore.getCategories();
    if (mounted) {
      setState(() {
        _categories = cats;
        if (cats.isNotEmpty && !_isEditMode) {
          _selectedCategory = cats.first.id;
        }
      });
    }
  }

  Future<void> _handleSave() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;
    NoviHaptics.success();

    setState(() => _isSaved = true);

    final targetD = widget.targetDate ?? widget.existingOccurrence?.plannedStart ?? DateTime.now();
    final dateStr = DateFormat('yyyy-MM-dd').format(targetD);

    final startAt = DateTime(targetD.year, targetD.month, targetD.day, _startTime.hour, _startTime.minute);
    final endAt = startAt.add(Duration(minutes: _durationMinutes));
    final durationSeconds = _durationMinutes * 60;

    if (_isEditMode && widget.existingOccurrence != null) {
      final oldOcc = widget.existingOccurrence!;
      final updatedOcc = oldOcc.copyWith(
        occurrenceDate: dateStr,
        plannedStart: startAt,
        plannedEnd: endAt,
        durationSeconds: durationSeconds,
        timerRequired: _timerRequired,
        fixed: _isFixed,
        categoryId: _selectedCategory,
        parentActivityTitle: title,
      );

      await LocalStore.updateOccurrence(updatedOcc);

      // Update parent planned activity if exists
      final allPlans = await LocalStore.getPlannedActivities();
      final planIdx = allPlans.indexWhere((p) => p.id == oldOcc.plannedActivityId);
      if (planIdx >= 0) {
        final updatedPlan = allPlans[planIdx].copyWith(
          title: title,
          startAt: startAt,
          endAt: endAt,
          durationSeconds: durationSeconds,
          timerRequired: _timerRequired,
          fixed: _isFixed,
          categoryId: _selectedCategory,
        );
        await LocalStore.updatePlannedActivity(updatedPlan);
      }
    } else {
      final activityId = 'act_${const Uuid().v4().substring(0, 8)}';
      final plannedActivity = PlannedActivity(
        id: activityId,
        title: title,
        startAt: startAt,
        endAt: endAt,
        durationSeconds: durationSeconds,
        type: _timerRequired ? ActivityType.timerRequired : (_isFixed ? ActivityType.fixed : ActivityType.normal),
        timerRequired: _timerRequired,
        fixed: _isFixed,
        categoryId: _selectedCategory,
        status: PlannedActivityStatus.scheduled,
      );

      final occurrence = ActivityOccurrence(
        id: 'occ_${dateStr}_$activityId',
        plannedActivityId: activityId,
        occurrenceDate: dateStr,
        plannedStart: startAt,
        plannedEnd: endAt,
        durationSeconds: durationSeconds,
        timerRequired: _timerRequired,
        fixed: _isFixed,
        status: OccurrenceStatus.scheduled,
        categoryId: _selectedCategory,
        parentActivityTitle: title,
      );

      final allPlanned = await LocalStore.getPlannedActivities();
      allPlanned.add(plannedActivity);
      await LocalStore.savePlannedActivities(allPlanned);
      await LocalStore.upsertOccurrence(occurrence);
    }

    widget.onActivityAdded();
    await Future.delayed(const Duration(milliseconds: 260));
    if (mounted) Navigator.pop(context);
  }

  Future<void> _handleDelete() async {
    if (!_isEditMode || widget.existingOccurrence == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Activity Block'),
        content: Text('Are you sure you want to remove "${widget.existingOccurrence!.parentActivityTitle ?? 'this activity'}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      NoviHaptics.medium();
      await LocalStore.deleteOccurrence(widget.existingOccurrence!.id);
      widget.onActivityAdded();
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    final targetD = widget.targetDate ?? widget.existingOccurrence?.plannedStart ?? DateTime.now();
    final dateFormatted = DateFormat('EEEE, MMMM d').format(targetD);

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      padding: EdgeInsets.only(
        top: NoviSpacing.space16,
        left: NoviSpacing.space20,
        right: NoviSpacing.space20,
        bottom: bottomInset + NoviSpacing.space20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Center drag handle
            Center(
              child: Container(
                width: 32,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: NoviSpacing.space16),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isEditMode ? 'Edit Block' : 'Schedule Block',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      dateFormatted,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (_isEditMode)
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded),
                    tooltip: 'Delete Block',
                    color: colorScheme.error,
                    onPressed: _handleDelete,
                  ),
              ],
            ),
            const SizedBox(height: NoviSpacing.space16),

            TextField(
              controller: _titleController,
              autofocus: !_isEditMode,
              style: textTheme.bodyLarge,
              decoration: const InputDecoration(
                hintText: 'Activity title',
              ),
            ),
            const SizedBox(height: NoviSpacing.space16),

            // Category Chips
            Text(
              'Category',
              style: textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: NoviSpacing.space8),
            Wrap(
              spacing: NoviSpacing.space8,
              runSpacing: NoviSpacing.space8,
              children: _categories.map((c) {
                final isSelected = _selectedCategory == c.id;
                return ChoiceChip(
                  label: Text(c.name),
                  selected: isSelected,
                  selectedColor: colorScheme.primaryContainer,
                  labelStyle: TextStyle(
                    color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      NoviHaptics.selection();
                      setState(() => _selectedCategory = c.id);
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: NoviSpacing.space16),

            // Start Time & Duration Presets
            Row(
              children: [
                Expanded(
                  child: NoviCard(
                    padding: const EdgeInsets.all(NoviSpacing.space12),
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: _startTime,
                      );
                      if (picked != null) {
                        NoviHaptics.selection();
                        setState(() => _startTime = picked);
                      }
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Start Time',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: NoviSpacing.space4),
                        Text(
                          _startTime.format(context),
                          style: textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: NoviSpacing.space12),
                Expanded(
                  child: NoviCard(
                    padding: const EdgeInsets.all(NoviSpacing.space12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Duration',
                          style: textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: NoviSpacing.space4),
                        DropdownButtonHideUnderline(
                          child: DropdownButton<int>(
                            value: [15, 30, 45, 60, 90, 120, 180].contains(_durationMinutes) ? _durationMinutes : 60,
                            isDense: true,
                            items: const [
                              DropdownMenuItem(value: 15, child: Text('15 min')),
                              DropdownMenuItem(value: 30, child: Text('30 min')),
                              DropdownMenuItem(value: 45, child: Text('45 min')),
                              DropdownMenuItem(value: 60, child: Text('1 hour')),
                              DropdownMenuItem(value: 90, child: Text('1.5 hours')),
                              DropdownMenuItem(value: 120, child: Text('2 hours')),
                              DropdownMenuItem(value: 180, child: Text('3 hours')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                NoviHaptics.selection();
                                setState(() => _durationMinutes = val);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: NoviSpacing.space12),

            // Mode Toggles
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Require Focus Timer'),
              subtitle: const Text('Tracks active session directly with timer countdown'),
              value: _timerRequired,
              onChanged: (val) {
                NoviHaptics.selection();
                setState(() => _timerRequired = val);
              },
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Fixed Slot'),
              subtitle: const Text('Locked time block (will not auto-shift)'),
              value: _isFixed,
              onChanged: (val) {
                NoviHaptics.selection();
                setState(() => _isFixed = val);
              },
            ),
            const SizedBox(height: NoviSpacing.space16),

            // Save / Saved Morph Button
            NoviMorphButton(
              state: _isSaved ? NoviMorphButtonState.success : NoviMorphButtonState.idle,
              height: 48,
              width: double.infinity,
              backgroundColor: colorScheme.primary,
              successColor: colorScheme.secondary,
              onPressed: _handleSave,
              idleChild: Text(
                _isEditMode ? 'Save Changes' : 'Schedule Block',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
              activeChild: const SizedBox.shrink(),
              successChild: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_rounded, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    _isEditMode ? 'Changes Saved' : 'Block Scheduled',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

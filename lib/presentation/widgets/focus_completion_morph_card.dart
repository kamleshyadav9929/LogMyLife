import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/focus_models.dart';
import 'novi_card.dart';
import 'novi_pressable.dart';

/// NOVI — Focus Completion Morph Card
/// Seamless in-place post-session reflection card with Intention status evaluation,
/// Accomplishment & Next-step notes, Focus Quality metric, and 1-tap Smart Break trigger.

class FocusCompletionMorphCard extends StatefulWidget {
  final String taskTitle;
  final String? initialIntention;
  final String occurrenceId;
  final String sessionId;
  final int verifiedDurationSeconds;
  final int pauseCount;
  final ValueChanged<int> onStartSmartBreak;
  final VoidCallback onDismiss;

  const FocusCompletionMorphCard({
    super.key,
    required this.taskTitle,
    this.initialIntention,
    required this.occurrenceId,
    required this.sessionId,
    required this.verifiedDurationSeconds,
    this.pauseCount = 0,
    required this.onStartSmartBreak,
    required this.onDismiss,
  });

  @override
  State<FocusCompletionMorphCard> createState() => _FocusCompletionMorphCardState();
}

class _FocusCompletionMorphCardState extends State<FocusCompletionMorphCard> {
  IntentionStatus _status = IntentionStatus.completed;
  final TextEditingController _accomplishmentController = TextEditingController();
  final TextEditingController _nextStepController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _accomplishmentController.dispose();
    _nextStepController.dispose();
    super.dispose();
  }

  int _calculateQualityScore() {
    // 0 to 100 based on completion, duration and pause count
    int score = 70;

    // Intention bonus
    if (_status == IntentionStatus.completed) {
      score += 20;
    } else if (_status == IntentionStatus.partiallyCompleted) {
      score += 10;
    } else {
      score -= 10;
    }

    // Interruption penalty
    if (widget.pauseCount == 0) {
      score += 10;
    } else if (widget.pauseCount > 3) {
      score -= 15;
    }

    return score.clamp(30, 99);
  }

  int _calculateSuggestedBreakMinutes() {
    final focusMins = widget.verifiedDurationSeconds ~/ 60;
    return (focusMins * 0.2).round().clamp(5, 20);
  }

  Future<void> _saveNotesAndContinue({bool startBreak = false}) async {
    setState(() => _isSaving = true);
    final score = _calculateQualityScore();
    final now = DateTime.now().millisecondsSinceEpoch;

    final record = FocusIntentionRecord(
      id: 'intent_${widget.sessionId}',
      sessionId: widget.sessionId,
      occurrenceId: widget.occurrenceId,
      taskTitle: widget.taskTitle,
      intentionText: widget.initialIntention ?? 'Deep Focus Block',
      status: _status,
      accomplishmentNote: _accomplishmentController.text.trim().isNotEmpty
          ? _accomplishmentController.text.trim()
          : null,
      nextStepNote: _nextStepController.text.trim().isNotEmpty
          ? _nextStepController.text.trim()
          : null,
      focusQualityScore: score,
      createdAt: now - (widget.verifiedDurationSeconds * 1000),
      completedAt: now,
    );

    await LocalStore.saveFocusIntention(record);
    NoviHaptics.success();

    if (mounted) {
      setState(() => _isSaving = false);
      if (startBreak) {
        widget.onStartSmartBreak(_calculateSuggestedBreakMinutes());
      } else {
        widget.onDismiss();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final durationMins = (widget.verifiedDurationSeconds / 60).round();
    final qualityScore = _calculateQualityScore();
    final suggestedBreak = _calculateSuggestedBreakMinutes();

    return NoviCard(
      padding: const EdgeInsets.all(NoviSpacing.space20),
      borderColor: colorScheme.secondary.withValues(alpha: 0.4),
      backgroundColor: colorScheme.secondaryContainer.withValues(alpha: 0.08),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row (Check icon + Duration + Quality score badge)
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colorScheme.secondaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.check_circle_rounded, color: colorScheme.onSecondaryContainer, size: 24),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Focus Complete',
                      style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      '$durationMins min verified · ${widget.taskTitle}',
                      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Focus Quality Score Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bolt_rounded, size: 14, color: colorScheme.primary),
                    const SizedBox(width: 3),
                    Text(
                      '$qualityScore/100',
                      style: textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: NoviSpacing.space16),

          // Intention Evaluation Section
          if (widget.initialIntention != null && widget.initialIntention!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(NoviSpacing.space12),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Intention: "${widget.initialIntention}"',
                    style: textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: NoviSpacing.space8),
                  Row(
                    children: [
                      _buildStatusChip(
                        label: 'Completed',
                        status: IntentionStatus.completed,
                        icon: Icons.check_circle_outline_rounded,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(width: NoviSpacing.space8),
                      _buildStatusChip(
                        label: 'Partially',
                        status: IntentionStatus.partiallyCompleted,
                        icon: Icons.timelapse_rounded,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: NoviSpacing.space8),
                      _buildStatusChip(
                        label: 'Rolled over',
                        status: IntentionStatus.rolledOver,
                        icon: Icons.update_rounded,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space12),
          ],

          // Accomplishment input
          TextField(
            controller: _accomplishmentController,
            decoration: InputDecoration(
              hintText: 'What did you accomplish? (e.g. Finished graph traversal)',
              hintStyle: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
              prefixIcon: const Icon(Icons.edit_note_rounded, size: 20),
              isDense: true,
              filled: true,
              fillColor: colorScheme.surfaceContainerLow,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                borderSide: BorderSide.none,
              ),
            ),
            style: textTheme.bodySmall,
          ),
          const SizedBox(height: NoviSpacing.space8),

          // Next action input
          TextField(
            controller: _nextStepController,
            decoration: InputDecoration(
              hintText: 'What should you continue next time? (e.g. Implement Dijkstra)',
              hintStyle: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
              prefixIcon: const Icon(Icons.next_plan_outlined, size: 20),
              isDense: true,
              filled: true,
              fillColor: colorScheme.surfaceContainerLow,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                borderSide: BorderSide.none,
              ),
            ),
            style: textTheme.bodySmall,
          ),

          const SizedBox(height: NoviSpacing.space16),

          // Action Buttons: Start Smart Break / Done
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isSaving ? null : () => _saveNotesAndContinue(startBreak: false),
                  child: const Text('Done for now'),
                ),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: _isSaving ? null : () => _saveNotesAndContinue(startBreak: true),
                  icon: const Icon(Icons.spa_rounded, size: 18),
                  label: Text('Smart Break ($suggestedBreak min)'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip({
    required String label,
    required IntentionStatus status,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _status == status;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Expanded(
      child: NoviPressable(
        onTap: () {
          NoviHaptics.selection();
          setState(() => _status = status);
        },
        child: AnimatedContainer(
          duration: NoviMotion.duration(context, NoviMotion.fast),
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.15) : colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
            border: Border.all(
              color: isSelected ? color : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 13, color: isSelected ? color : colorScheme.onSurfaceVariant),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? color : colorScheme.onSurfaceVariant,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

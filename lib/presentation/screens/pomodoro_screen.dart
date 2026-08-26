import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../domain/models/focus_models.dart';
import '../../services/timer_engine.dart';
import '../widgets/novi_section_header.dart';
import '../widgets/novi_page_header.dart';
import '../widgets/novi_pressable.dart';
import '../widgets/ambient_sound_mixer_modal.dart';
import '../widgets/smart_break_sheet.dart';
import '../widgets/deep_focus_overlay.dart';
import '../widgets/focus_completion_morph_card.dart';
import '../widgets/early_stop_reason_sheet.dart';

/// NOVI — Minimalist Focus Canvas
/// Sticky top header with smooth continuous timer sweep, quick duration switching,
/// ambient audio access, and de-carded clean session log.

class PomodoroScreen extends StatefulWidget {
  const PomodoroScreen({super.key});

  @override
  State<PomodoroScreen> createState() => _PomodoroScreenState();
}

class _PomodoroScreenState extends State<PomodoroScreen> with WidgetsBindingObserver {
  int _selectedMinutes = 25;
  final String _customTitle = 'Deep Focus Session';

  SoundscapeMix _activeSoundMix = SoundscapeMix.deepWorkPreset;
  bool _isPlayingAudio = false;

  List<ActivityOccurrence> _todayOccurrences = [];
  List<ActivitySession> _recentSessions = [];
  int _completedSessionsToday = 0;
  String? _selectedOccurrenceId;
  bool _isLoading = true;
  bool _showDeepFocusOverlay = false;

  // In-place Morphing Completion State
  FocusCompletionEvent? _activeCompletionEvent;

  StreamSubscription<FocusCompletionEvent>? _focusCompletionSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    TimerEngine.activeTimerNotifier.addListener(_onTimerStateChanged);
    _loadFocusData();

    _focusCompletionSub = TimerEngine.onFocusProCompleted.listen((event) {
      if (mounted) {
        setState(() {
          _activeCompletionEvent = event;
          _showDeepFocusOverlay = false;
        });
        _loadFocusData();
        NoviHaptics.success();
      }
    });
  }

  void _onTimerStateChanged() {
    if (mounted) {
      _loadFocusData();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    TimerEngine.activeTimerNotifier.removeListener(_onTimerStateChanged);
    _focusCompletionSub?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadFocusData();
    }
  }

  Future<void> _loadFocusData() async {
    final todayStr = LocalStore.getTodayDateStr();
    final occs = await LocalStore.getOccurrences(todayStr);
    final sessions = await LocalStore.getActivitySessions();
    final soundMix = await LocalStore.getActiveSoundMix();

    final todayTimerSessions = sessions
        .where((s) => s.sourceType == SessionSourceType.timer && (s.durationSeconds ?? 0) > 0)
        .toList();

    if (mounted) {
      setState(() {
        _todayOccurrences = occs.where((o) => o.status != OccurrenceStatus.completed).toList();
        _recentSessions = todayTimerSessions..sort((a, b) => b.startedAt.compareTo(a.startedAt));
        _completedSessionsToday = _recentSessions.length;
        _activeSoundMix = soundMix;
        _isPlayingAudio = soundMix.isPlaying;

        if (_selectedOccurrenceId == null && _todayOccurrences.isNotEmpty) {
          _selectedOccurrenceId = _todayOccurrences.first.id;
          _selectedMinutes = (_todayOccurrences.first.durationSeconds / 60).round();
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _startFocus(ActiveTimerState? currentTimer) async {
    NoviHaptics.medium();
    if (currentTimer != null) {
      if (currentTimer.isPaused) {
        TimerEngine.resumeTimer();
      }
      return;
    }

    setState(() => _activeCompletionEvent = null);

    if (_selectedOccurrenceId != null) {
      final occ = _todayOccurrences.firstWhere(
        (o) => o.id == _selectedOccurrenceId,
        orElse: () => _todayOccurrences.first,
      );
      await TimerEngine.startTimer(
        occ,
        soundMix: _isPlayingAudio ? _activeSoundMix : null,
      );
    } else {
      await TimerEngine.startCustomFocusTimer(
        title: _customTitle.trim().isNotEmpty ? _customTitle.trim() : 'Deep Focus Session',
        durationSeconds: _selectedMinutes * 60,
        soundMix: _isPlayingAudio ? _activeSoundMix : null,
      );
    }
    _loadFocusData();
  }

  Future<void> _stopFocus() async {
    final timer = TimerEngine.activeTimer;
    if (timer == null) return;

    NoviHaptics.medium();
    final now = DateTime.now();
    final currentElapsed = timer.calculateElapsed(now);
    final targetSec = timer.targetDurationSeconds;
    final completionPct = targetSec > 0 ? (currentElapsed / targetSec) * 100.0 : 0.0;

    if (completionPct < 80.0) {
      final result = await EarlyStopReasonSheet.show(
        context,
        taskTitle: timer.title,
        completedSeconds: currentElapsed,
        targetDurationSeconds: targetSec,
      );

      if (result != null) {
        await TimerEngine.stopTimer(
          stopReason: result.reason,
          forceCompleted: result.markAsCompleted,
        );
      } else {
        await TimerEngine.stopTimer(stopReason: 'Paused early');
      }
    } else {
      await TimerEngine.stopTimer();
    }

    _loadFocusData();
  }

  void _openSoundMixer() async {
    NoviHaptics.selection();
    final newMix = await AmbientSoundMixerModal.show(
      context,
      initialMix: _activeSoundMix,
      onMixChanged: (mix) {
        setState(() {
          _activeSoundMix = mix;
          _isPlayingAudio = mix.isPlaying;
        });
      },
    );
    if (newMix != null && mounted) {
      setState(() {
        _activeSoundMix = newMix;
        _isPlayingAudio = newMix.isPlaying;
      });
    }
  }

  void _openSmartBreak(int breakMinutes, String taskTitle) {
    SmartBreakSheet.show(
      context,
      breakMinutes: breakMinutes,
      parentTask: taskTitle,
      onStartNextSession: () => _startFocus(null),
      onEndBreak: () => setState(() => _activeCompletionEvent = null),
    );
  }

  void _showTaskPickerModal() {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      builder: (ctx) {
        final colorScheme = Theme.of(ctx).colorScheme;
        return Padding(
          padding: const EdgeInsets.fromLTRB(
            NoviSpacing.space16,
            NoviSpacing.space8,
            NoviSpacing.space16,
            NoviSpacing.space20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: NoviSpacing.space12),
                  decoration: BoxDecoration(
                    color: colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: NoviSpacing.space4, bottom: NoviSpacing.space8),
                child: Text(
                  'Select Focus Activity',
                  style: Theme.of(ctx).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.flash_on_rounded, size: 18, color: colorScheme.primary),
                ),
                title: const Text('Standalone Deep Focus', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Untied custom focus block'),
                selected: _selectedOccurrenceId == null,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                ),
                onTap: () {
                  NoviHaptics.selection();
                  setState(() => _selectedOccurrenceId = null);
                  Navigator.pop(ctx);
                },
              ),
              if (_todayOccurrences.isNotEmpty) ...[
                const Divider(height: 16),
                ..._todayOccurrences.map((occ) {
                  final isSelected = _selectedOccurrenceId == occ.id;
                  return ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isSelected ? colorScheme.primaryContainer : colorScheme.surfaceContainerHigh,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        occ.timerRequired ? Icons.timer_outlined : Icons.calendar_today_rounded,
                        size: 18,
                        color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                      ),
                    ),
                    title: Text(occ.parentActivityTitle ?? 'Activity', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${occ.durationSeconds ~/ 60}m · ${DateFormat('h:mm a').format(occ.plannedStart)}'),
                    selected: isSelected,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                    ),
                    onTap: () {
                      NoviHaptics.selection();
                      setState(() {
                        _selectedOccurrenceId = occ.id;
                        _selectedMinutes = occ.durationSeconds ~/ 60;
                      });
                      Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: _isLoading
            ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
            : ValueListenableBuilder<ActiveTimerState?>(
                valueListenable: TimerEngine.activeTimerNotifier,
                builder: (context, activeTimer, child) {
                  final isRunning = activeTimer?.isRunning ?? false;
                  final isPaused = activeTimer?.isPaused ?? false;
                  final isTimerActive = activeTimer != null;

                  final targetSec = isTimerActive ? activeTimer.targetDurationSeconds : _selectedMinutes * 60;
                  final elapsedSec = isTimerActive ? activeTimer.elapsedSeconds : 0;
                  final remainingSec = (targetSec - elapsedSec).clamp(0, targetSec);

                  final mins = remainingSec ~/ 60;
                  final secs = remainingSec % 60;
                  final timeStr = '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
                  final rawProgress = targetSec > 0 ? (elapsedSec / targetSec).clamp(0.0, 1.0) : 0.0;

                  String currentTaskName = 'Standalone Deep Focus';
                  if (activeTimer != null) {
                    currentTaskName = activeTimer.title;
                  } else if (_selectedOccurrenceId != null) {
                    final match = _todayOccurrences.where((o) => o.id == _selectedOccurrenceId);
                    if (match.isNotEmpty) {
                      currentTaskName = match.first.parentActivityTitle ?? 'Focus Activity';
                    }
                  }

                  // Morph Button State
                  NoviMorphButtonState morphState = NoviMorphButtonState.idle;
                  if (isTimerActive) {
                    morphState = NoviMorphButtonState.active;
                  }

                  return Stack(
                    children: [
                      Column(
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
                              title: 'Focus',
                              subtitle: isTimerActive ? 'Flow state active' : 'Mindful Deep Work',
                              bottomPadding: 0,
                              actions: [
                                // Ambient Sound Toggle
                                IconButton.filledTonal(
                                  onPressed: _openSoundMixer,
                                  tooltip: 'Ambient Sounds',
                                  icon: Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      Icon(
                                        _isPlayingAudio ? Icons.headphones_rounded : Icons.headphones_outlined,
                                        color: _isPlayingAudio ? colorScheme.primary : colorScheme.onSurfaceVariant,
                                        size: 20,
                                      ),
                                      if (_isPlayingAudio)
                                        Positioned(
                                          top: -2,
                                          right: -2,
                                          child: Container(
                                            width: 7,
                                            height: 7,
                                            decoration: BoxDecoration(
                                              color: colorScheme.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
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
                                // 2. In-place Completion Card (appears seamlessly after finishing)
                                if (_activeCompletionEvent != null) ...[
                                  FocusCompletionMorphCard(
                                    taskTitle: _activeCompletionEvent!.taskTitle,
                                    initialIntention: _activeCompletionEvent!.intentionText,
                                    occurrenceId: _activeCompletionEvent!.occurrenceId,
                                    sessionId: _activeCompletionEvent!.sessionId,
                                    verifiedDurationSeconds: _activeCompletionEvent!.durationSeconds,
                                    pauseCount: _activeCompletionEvent!.pauseCount,
                                    onStartSmartBreak: (breakMins) {
                                      _openSmartBreak(breakMins, _activeCompletionEvent!.taskTitle);
                                    },
                                    onDismiss: () {
                                      setState(() => _activeCompletionEvent = null);
                                    },
                                  ),
                                  const SizedBox(height: NoviSpacing.space16),
                                ],

                                // 3. Compact Activity Selector Pill
                                Center(
                                  child: NoviPressable(
                                    onTap: isTimerActive ? null : _showTaskPickerModal,
                                    child: Container(
                                      constraints: const BoxConstraints(maxWidth: 320),
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: colorScheme.surfaceContainerLow,
                                        borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                                        border: Border.all(
                                          color: colorScheme.outlineVariant.withValues(alpha: 0.7),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.center_focus_strong_rounded,
                                            size: 16,
                                            color: colorScheme.primary,
                                          ),
                                          const SizedBox(width: 8),
                                          Flexible(
                                            child: Text(
                                              currentTaskName,
                                              style: textTheme.labelLarge?.copyWith(
                                                fontWeight: FontWeight.w600,
                                                color: colorScheme.onSurface,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                              maxLines: 1,
                                            ),
                                          ),
                                          if (!isTimerActive) ...[
                                            const SizedBox(width: 4),
                                            Icon(
                                              Icons.keyboard_arrow_down_rounded,
                                              size: 18,
                                              color: colorScheme.onSurfaceVariant,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),
                                ),

                                // Task Progress Badge (when resuming prior session)
                                Builder(
                                  builder: (ctx) {
                                    final occList = _todayOccurrences.where((o) => o.id == _selectedOccurrenceId).toList();
                                    final selectedOcc = occList.isNotEmpty ? occList.first : null;
                                    if (selectedOcc != null && selectedOcc.completedSeconds > 0 && selectedOcc.status != OccurrenceStatus.completed) {
                                      return Padding(
                                        padding: const EdgeInsets.only(top: NoviSpacing.space8),
                                        child: Center(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: colorScheme.surfaceContainer,
                                              borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.history_rounded, size: 13, color: colorScheme.primary),
                                                const SizedBox(width: 5),
                                                Text(
                                                  'Task Progress: ${(selectedOcc.completedSeconds / 60).toStringAsFixed(1)}m / ${(selectedOcc.durationSeconds / 60).round()}m (${(selectedOcc.progressPercentage * 100).round()}%)',
                                                  style: textTheme.labelSmall?.copyWith(
                                                    color: colorScheme.primary,
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    }
                                    return const SizedBox.shrink();
                                  },
                                ),
                                const SizedBox(height: NoviSpacing.space24),

                                // 4. Hero 60fps Sweep Ring Timer
                                Center(
                                  child: SizedBox(
                                    width: 240,
                                    height: 240,
                                    child: TweenAnimationBuilder<double>(
                                      tween: Tween<double>(begin: 0.0, end: rawProgress),
                                      duration: NoviMotion.duration(context, const Duration(milliseconds: 950)),
                                      curve: Curves.linear,
                                      builder: (context, smoothProgress, child) {
                                        return Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            CustomPaint(
                                              size: const Size(240, 240),
                                              painter: _FocusRingPainter(
                                                progress: smoothProgress,
                                                trackColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                                                progressColor: isPaused ? colorScheme.onSurfaceVariant : colorScheme.primary,
                                                strokeWidth: 10,
                                              ),
                                            ),
                                            Column(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  timeStr,
                                                  style: textTheme.displayMedium?.copyWith(
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 52,
                                                    letterSpacing: -1.5,
                                                    fontFeatures: const [FontFeature.tabularFigures()],
                                                  ),
                                                ),
                                                const SizedBox(height: NoviSpacing.space2),
                                                AnimatedSwitcher(
                                                  duration: NoviMotion.duration(context, NoviMotion.fast),
                                                  child: Text(
                                                    isRunning
                                                        ? 'Deep Focus Flow'
                                                        : (isPaused ? 'Paused' : 'Ready to begin'),
                                                    key: ValueKey<String>(
                                                      isRunning ? 'running' : (isPaused ? 'paused' : 'ready'),
                                                    ),
                                                    style: textTheme.bodySmall?.copyWith(
                                                      color: isRunning
                                                          ? colorScheme.primary
                                                          : colorScheme.onSurfaceVariant,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        );
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(height: NoviSpacing.space24),

                                // 5. Clean Duration Selector (When Idle)
                                if (!isTimerActive) ...[
                                  Center(
                                    child: SizedBox(
                                      width: 280,
                                      child: NoviSlidingPillSelector<int>(
                                        items: const [15, 25, 45, 60],
                                        selectedItem: _selectedMinutes,
                                        height: 38,
                                        borderRadius: 19,
                                        onSelected: (val) {
                                          NoviHaptics.selection();
                                          setState(() => _selectedMinutes = val);
                                        },
                                        itemBuilder: (context, item, isSelected) {
                                          return Center(
                                            child: Text(
                                              '${item}m',
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                                color: isSelected ? colorScheme.onPrimaryContainer : colorScheme.onSurfaceVariant,
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: NoviSpacing.space20),
                                ],

                                // 6. Main Action CTA
                                Center(
                                  child: NoviMorphButton(
                                    state: morphState,
                                    height: 52,
                                    width: isTimerActive ? 250 : 230,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    backgroundColor: colorScheme.primary,
                                    activeColor: isPaused ? colorScheme.onSurfaceVariant : colorScheme.primary,
                                    onPressed: () {
                                      if (isRunning) {
                                        NoviHaptics.medium();
                                        TimerEngine.pauseTimer();
                                      } else {
                                        _startFocus(activeTimer);
                                      }
                                    },
                                    idleChild: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.play_arrow_rounded, size: 20),
                                        SizedBox(width: 6),
                                        Text('Start Focus', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                      ],
                                    ),
                                    activeChild: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        NoviMorphIcon(
                                          icon: isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                          size: 18,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          isRunning ? 'Pause' : 'Resume',
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                                        ),
                                      ],
                                    ),
                                    successChild: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.check_circle_rounded, size: 18),
                                        SizedBox(width: 6),
                                        Text('Focus Complete', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: NoviSpacing.space14),

                                // 7. Secondary Controls (When Active)
                                if (isTimerActive) ...[
                                  Wrap(
                                    spacing: NoviSpacing.space8,
                                    runSpacing: NoviSpacing.space8,
                                    alignment: WrapAlignment.center,
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    children: [
                                      IconButton.outlined(
                                        onPressed: () {
                                          NoviHaptics.light();
                                          TimerEngine.resetTimer();
                                        },
                                        icon: const Icon(Icons.replay_rounded, size: 18),
                                        tooltip: 'Reset timer',
                                      ),
                                      OutlinedButton(
                                        onPressed: () {
                                          NoviHaptics.light();
                                          TimerEngine.extendTimer(300);
                                        },
                                        child: const Text('+5 min'),
                                      ),
                                      FilledButton.tonalIcon(
                                        onPressed: () {
                                          NoviHaptics.medium();
                                          setState(() => _showDeepFocusOverlay = true);
                                        },
                                        icon: const Icon(Icons.fullscreen_rounded, size: 18),
                                        label: const Text('Zen Mode'),
                                      ),
                                      IconButton.outlined(
                                        onPressed: _stopFocus,
                                        icon: const Icon(Icons.stop_rounded, size: 18),
                                        tooltip: 'Finish & Reflect',
                                        color: colorScheme.error,
                                      ),
                                    ],
                                  ),
                                ] else ...[
                                ],

                                const SizedBox(height: NoviSpacing.space24),

                                // 8. Subtle Today's Completed Sessions Log (Grouped List — No Card Soup)
                                if (_recentSessions.isNotEmpty) ...[
                                  const Divider(height: 32),
                                  NoviSectionHeader(
                                    title: 'Today\'s Focus',
                                    subtitle: '$_completedSessionsToday completed blocks',
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: colorScheme.surfaceContainer,
                                      borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                                    ),
                                    child: ListView.separated(
                                      shrinkWrap: true,
                                      physics: const NeverScrollableScrollPhysics(),
                                      itemCount: _recentSessions.length,
                                      separatorBuilder: (context, index) => Divider(
                                        height: 1,
                                        thickness: 1,
                                        indent: 48,
                                        endIndent: 12,
                                        color: colorScheme.outline,
                                      ),
                                      itemBuilder: (context, index) {
                                        final s = _recentSessions[index];
                                        final durationMins = (s.durationSeconds ?? 0) ~/ 60;
                                        final timeFormatted = DateFormat('h:mm a')
                                            .format(DateTime.fromMillisecondsSinceEpoch(s.startedAt));

                                        return Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: NoviSpacing.space14,
                                            vertical: NoviSpacing.space10,
                                          ),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 28,
                                                height: 28,
                                                decoration: BoxDecoration(
                                                  color: colorScheme.primaryContainer,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: Icon(
                                                  Icons.check_rounded,
                                                  size: 15,
                                                  color: colorScheme.primary,
                                                ),
                                              ),
                                              const SizedBox(width: NoviSpacing.space10),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      s.appName.isNotEmpty ? s.appName : 'Deep Focus Block',
                                                      style: textTheme.bodyMedium?.copyWith(
                                                        fontWeight: FontWeight.w600,
                                                        fontSize: 13.5,
                                                      ),
                                                    ),
                                                    Text(
                                                      timeFormatted,
                                                      style: textTheme.bodySmall?.copyWith(
                                                        color: colorScheme.onSurfaceVariant,
                                                        fontSize: 11,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Text(
                                                '${durationMins}m',
                                                style: textTheme.labelMedium?.copyWith(
                                                  color: colorScheme.primary,
                                                  fontWeight: FontWeight.w700,
                                                  fontFeatures: const [FontFeature.tabularFigures()],
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],

                                const SizedBox(height: NoviSpacing.space32),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Fullscreen AMOLED Zen Mode Overlay
                      if (_showDeepFocusOverlay)
                        Positioned.fill(
                          child: DeepFocusOverlay(
                            onExit: () => setState(() => _showDeepFocusOverlay = false),
                          ),
                        ),
                    ],
                  );
                },
              ),
      ),
    );
  }
}

/// Custom Continuous 60fps Sweep Focus Ring
class _FocusRingPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  _FocusRingPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    // Active Arc
    if (progress > 0) {
      final sweepAngle = 2 * pi * progress;
      final progressPaint = Paint()
        ..color = progressColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2,
        sweepAngle,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _FocusRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.trackColor != trackColor;
  }
}

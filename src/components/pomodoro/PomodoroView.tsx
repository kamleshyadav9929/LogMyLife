import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Task, PomodoroSession } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Trash2,
  X,
  Target,
  Check,
} from 'lucide-react-native';

interface Props {
  theme: ThemeConfig;
  targetTask?: Task;
  onBackToDashboard?: () => void;
  onSessionComplete?: (mins: number) => void;
}

const EARLY_STOP_TEMPLATES = [
  { id: 'work_done', label: 'Work Completed Early', isComplete: true },
  { id: 'important_work', label: 'Urgent Interruption', isComplete: false },
  { id: 'another_task', label: 'Switched to another task', isComplete: false },
  { id: 'need_break', label: 'Taking a rest break', isComplete: false },
];

const GOAL_SUGGESTIONS = [
  'Complete deep work session sprint',
  'Review and finalize project tasks',
  'Read 20 pages of skill documentation',
  'Organize daily schedule & priorities',
];

export const PomodoroView: React.FC<Props> = ({
  theme,
  targetTask,
  onBackToDashboard,
  onSessionComplete,
}) => {
  const [mode, setMode] = useState<'work' | 'short_break' | 'long_break'>('work');

  // Initial duration & timer state
  const initialSeconds = targetTask?.leftoverSeconds
    ? targetTask.leftoverSeconds
    : (targetTask?.timerDurationMins || 25) * 60;

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(
    (targetTask?.timerDurationMins || 25) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [recentSessions, setRecentSessions] = useState<PomodoroSession[]>([]);

  // Timer wall-clock & double logging guard refs
  const expectedEndTimeRef = useRef<number | null>(null);
  const isLoggingRef = useRef(false);

  // Session intent goal state & modals
  const [sessionGoal, setSessionGoal] = useState<string>(targetTask?.title || '');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEarlyStopModal, setShowEarlyStopModal] = useState(false);

  // Action sheet for session log inspection
  const [selectedLog, setSelectedLog] = useState<PomodoroSession | null>(null);
  const [showLogActionSheet, setShowLogActionSheet] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.12)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

  // Load past sessions
  useEffect(() => {
    async function fetchSessions() {
      const sessions = await Database.getPomodoroSessions();
      setRecentSessions(sessions.slice(-8));
    }
    fetchSessions();
  }, []);

  // Timer Countdown Loop using Wall-Clock comparison
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      if (!expectedEndTimeRef.current) {
        expectedEndTimeRef.current = Date.now() + secondsLeft * 1000;
      }
      isLoggingRef.current = false;

      interval = setInterval(() => {
        if (!expectedEndTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((expectedEndTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          setIsRunning(false);
          expectedEndTimeRef.current = null;

          if (!isLoggingRef.current) {
            isLoggingRef.current = true;
            triggerHaptic.notificationSuccess();

            if (mode === 'work') {
              const elapsedMins = Math.max(1, Math.round(totalDuration / 60));
              Database.logPomodoroSession(
                elapsedMins,
                targetTask?.category || 'Focus & Deep Work',
                sessionGoal.trim() || 'Focus Session',
                undefined,
                true,
                0,
                targetTask?.id
              ).then(({ sessions }) => {
                setRecentSessions(sessions.slice(-8));
                if (onSessionComplete) onSessionComplete(elapsedMins);
              });
            }
          }
        }
      }, 1000);
    } else {
      expectedEndTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, totalDuration, targetTask, sessionGoal, onSessionComplete]);


  // Soft Aura Pulsing Animation during active focus
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isRunning) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.25,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.1);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isRunning]);

  const switchMode = (newMode: 'work' | 'short_break' | 'long_break') => {
    triggerHaptic.lightImpact();
    setIsRunning(false);
    setMode(newMode);
    let dur = 25 * 60;
    if (newMode === 'short_break') dur = 5 * 60;
    if (newMode === 'long_break') dur = 15 * 60;

    setTotalDuration(dur);
    setSecondsLeft(dur);
  };

  const handlePressPlay = () => {
    triggerHaptic.mediumImpact();
    if (isRunning) {
      // User is pausing / stopping early: open early stop modal
      setIsRunning(false);
      setShowEarlyStopModal(true);
    } else {
      // Starting focus: open intent goal modal if goal not set
      if (!sessionGoal.trim() && mode === 'work') {
        setShowGoalModal(true);
      } else {
        startTimerNow();
      }
    }
  };

  const startTimerNow = () => {
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(playButtonScale, {
        toValue: 1.0,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    setIsRunning(true);
  };

  const handleConfirmGoal = (goalToUse?: string) => {
    const finalGoal = (goalToUse || sessionGoal).trim() || 'Focus Session';
    setSessionGoal(finalGoal);
    setShowGoalModal(false);
    triggerHaptic.notificationSuccess();
    startTimerNow();
  };

  const handleSelectEarlyStopReason = (template: typeof EARLY_STOP_TEMPLATES[0]) => {
    triggerHaptic.lightImpact();
    setShowEarlyStopModal(false);

    const elapsedMins = Math.max(1, Math.round((totalDuration - secondsLeft) / 60));
    const isFinished = template.isComplete;

    Database.logPomodoroSession(
      elapsedMins,
      targetTask?.category || 'Focus & Deep Work',
      sessionGoal.trim() || 'Focus Session',
      template.label,
      isFinished,
      isFinished ? 0 : secondsLeft,
      targetTask?.id
    ).then(({ sessions }) => {
      setRecentSessions(sessions.slice(-8));
      if (isFinished) {
        setSecondsLeft(0);
        triggerHaptic.notificationSuccess();
      }
    });
  };

  const handleReset = () => {
    triggerHaptic.lightImpact();
    setIsRunning(false);
    setSecondsLeft(totalDuration);
  };

  const handleSkip = () => {
    triggerHaptic.lightImpact();
    setIsRunning(false);
    if (mode === 'work') switchMode('short_break');
    else switchMode('work');
  };

  // Log Card Click Actions
  const handleOpenLogSheet = (logItem: PomodoroSession) => {
    triggerHaptic.lightImpact();
    setSelectedLog(logItem);
    setShowLogActionSheet(true);
  };

  const handleResumeLogSession = () => {
    if (!selectedLog) return;
    triggerHaptic.notificationSuccess();
    setShowLogActionSheet(false);

    setMode('work');
    const durSecs = selectedLog.durationMins * 60;
    const leftover = selectedLog.leftoverSeconds && selectedLog.leftoverSeconds > 0
      ? selectedLog.leftoverSeconds
      : durSecs;

    setTotalDuration(durSecs);
    setSecondsLeft(leftover);
    setSessionGoal(selectedLog.sessionGoal || '');
    setIsRunning(true);
  };

  const handleCaptureAnotherSession = () => {
    if (!selectedLog) return;
    triggerHaptic.lightImpact();
    setShowLogActionSheet(false);

    setMode('work');
    const durSecs = selectedLog.durationMins * 60;
    setTotalDuration(durSecs);
    setSecondsLeft(durSecs);
    setSessionGoal(selectedLog.sessionGoal || '');
    setIsRunning(true);
  };

  const handleDeleteLogSession = async () => {
    if (!selectedLog) return;
    triggerHaptic.notificationSuccess();
    setShowLogActionSheet(false);
    const updated = await Database.deletePomodoroSession(selectedLog.id);
    setRecentSessions(updated.slice(-8));
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Ring Dimensions (Contained, NO layout overlap!)
  const circleSize = 180;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const getModeColor = () => {
    if (mode === 'work') return { primary: '#EF4444', lightBg: '#FEF2F2', stroke: '#EF4444' };
    if (mode === 'short_break') return { primary: '#10B981', lightBg: '#ECFDF5', stroke: '#10B981' };
    return { primary: '#7C3AED', lightBg: '#FAF5FF', stroke: '#7C3AED' };
  };

  const modeColor = getModeColor();

  return (
    <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
      {/* Top Navigation Header */}
      <View style={styles.headerRow}>
        {onBackToDashboard ? (
          <TouchableOpacity
            style={styles.backBtnCircle}
            onPress={() => {
              triggerHaptic.lightImpact();
              onBackToDashboard();
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}

        <View style={styles.headerTitleContainer}>
          <Zap size={18} color={modeColor.primary} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitleText}>Focus Timer</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Mode Switcher: Compact Chip Pills (design.md compliant) */}
      <View style={styles.modeChipsRow}>
        <TouchableOpacity
          style={[styles.chipPill, mode === 'work' && styles.chipPillActiveWork]}
          onPress={() => switchMode('work')}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipPillText, mode === 'work' && styles.chipPillTextActive]}>
            Focus (25m)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chipPill, mode === 'short_break' && styles.chipPillActiveBreak]}
          onPress={() => switchMode('short_break')}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipPillText, mode === 'short_break' && styles.chipPillTextActive]}>
            Short Break (5m)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chipPill, mode === 'long_break' && styles.chipPillActiveLong]}
          onPress={() => switchMode('long_break')}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipPillText, mode === 'long_break' && styles.chipPillTextActive]}>
            Long Break (15m)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Minimalist Animated Timer Display Card (Dribbble Spatial Material 3, Soft-Fill) */}
      <View style={styles.timerCardContainer}>
        {/* Soft Animated Aura */}
        <Animated.View
          style={[
            styles.timerAuraCircle,
            {
              backgroundColor: modeColor.primary,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />

        {/* Crisp Contained Progress Ring */}
        <Svg width={circleSize} height={circleSize} style={styles.svgRing}>
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={modeColor.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
          />
        </Svg>

        <View style={styles.timerCenterContent}>
          <Text style={styles.clockDigitsText}>{formatTime(secondsLeft)}</Text>
          <View style={[styles.statusBadgePill, { backgroundColor: modeColor.lightBg }]}>
            <View style={[styles.statusDot, { backgroundColor: modeColor.primary }]} />
            <Text style={[styles.statusBadgeText, { color: modeColor.primary }]}>
              {isRunning ? (mode === 'work' ? 'IN FOCUS' : 'RECHARGING') : 'PAUSED'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Controls Bar */}
      <View style={styles.controlsBarRow}>
        <TouchableOpacity style={styles.circleActionIconBtn} onPress={handleReset} activeOpacity={0.7}>
          <RotateCcw size={18} color="#64748B" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: playButtonScale }], flex: 1 }}>
          <TouchableOpacity
            style={[styles.mainPlayPillBtn, { backgroundColor: modeColor.primary }]}
            onPress={handlePressPlay}
            activeOpacity={0.85}
          >
            {isRunning ? (
              <Pause size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            ) : (
              <Play size={18} color="#FFFFFF" style={{ marginRight: 6, marginLeft: 2 }} />
            )}
            <Text style={styles.mainPlayPillText}>{isRunning ? 'Pause' : 'Start Focus'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.circleActionIconBtn} onPress={handleSkip} activeOpacity={0.7}>
          <SkipForward size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Recent Focus Logs Section (Soft Background Fill, NO Outer Border!) */}
      <View style={styles.logsSectionContainer}>
        <Text style={styles.sectionHeaderTitle}>RECENT FOCUS LOGS</Text>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyLogsBox}>
            <Text style={styles.emptyLogsText}>No focus sessions logged yet today.</Text>
          </View>
        ) : (
          recentSessions.map((session, idx) => (
            <TouchableOpacity
              key={session.id || idx}
              style={styles.logCardItemSoft}
              onPress={() => handleOpenLogSheet(session)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.logStatusIconCircle,
                  session.isCompleted === false && { backgroundColor: '#FEF3C7' },
                ]}
              >
                {session.isCompleted === false ? (
                  <AlertCircle size={16} color="#D97706" />
                ) : (
                  <CheckCircle2 size={16} color="#10B981" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.logCategoryText}>
                  {session.sessionGoal || `${session.category} Focus Session`}
                </Text>
                <Text style={styles.logTimeSub}>
                  {new Date(session.completedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {session.stopReason ? ` • ${session.stopReason}` : ''}
                </Text>
              </View>

              <View style={styles.logDurationPill}>
                <Text style={styles.logDurationText}>+{session.durationMins}m</Text>
              </View>

              <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* MODAL 1: Pre-Session Intent Goal Prompt Modal */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Target size={22} color="#2563EB" />
              <Text style={styles.modalTitle}>What will you do in this time?</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Specify your target task or focus goal before starting the timer.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Solve 2 LeetCode DP problems..."
              placeholderTextColor="#94A3B8"
              value={sessionGoal}
              onChangeText={setSessionGoal}
              autoFocus
            />

            <Text style={styles.suggestionsLabel}>QUICK SUGGESTIONS:</Text>
            <View style={styles.suggestionsList}>
              {GOAL_SUGGESTIONS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sugChip}
                  onPress={() => handleConfirmGoal(sug)}
                >
                  <Text style={styles.sugChipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => handleConfirmGoal()}
              >
                <Text style={styles.modalConfirmText}>Start Focus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Early Stop Reason Selector Modal */}
      <Modal visible={showEarlyStopModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <AlertCircle size={22} color="#D97706" />
              <Text style={styles.modalTitle}>Why are you stopping early?</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Leftover time will be saved so you can resume this session later!
            </Text>

            <View style={{ gap: 8, marginVertical: 14 }}>
              {EARLY_STOP_TEMPLATES.map((tmpl) => (
                <TouchableOpacity
                  key={tmpl.id}
                  style={styles.stopTemplateBtn}
                  onPress={() => handleSelectEarlyStopReason(tmpl)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stopTemplateText}>{tmpl.label}</Text>
                  <Check size={16} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtnFull}
              onPress={() => setShowEarlyStopModal(false)}
            >
              <Text style={styles.modalCancelText}>Keep Timer Running</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Action Sheet Modal for Selected Log */}
      <Modal visible={showLogActionSheet} transparent animationType="fade">
        <View style={styles.sheetModalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.modalTitleText}>Session Options</Text>
              <TouchableOpacity onPress={() => setShowLogActionSheet(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <Text style={styles.modalMetaText}>
                {selectedLog.sessionGoal || `${selectedLog.category} Session`} ({selectedLog.durationMins} mins)
              </Text>
            )}

            <View style={styles.modalActionButtonsGroup}>
              {/* Option 1: Resume Session (ONLY shown if session was stopped early) */}
              {selectedLog && selectedLog.isCompleted === false && (
                <TouchableOpacity
                  style={styles.sheetOptionBtn}
                  onPress={handleResumeLogSession}
                  activeOpacity={0.8}
                >
                  <View style={[styles.sheetOptionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <RefreshCw size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetOptionTitle}>Resume Session</Text>
                    <Text style={styles.sheetOptionSub}>
                      Continue session from leftover time
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Option 2: Capture Another Session */}
              <TouchableOpacity
                style={styles.sheetOptionBtn}
                onPress={handleCaptureAnotherSession}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetOptionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <PlusCircle size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionTitle}>Capture Another Session</Text>
                  <Text style={styles.sheetOptionSub}>
                    Start a fresh focus session with same duration
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Delete Log */}
              <TouchableOpacity
                style={styles.sheetOptionBtnDanger}
                onPress={handleDeleteLogSession}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetOptionIconCircle, { backgroundColor: '#FEF2F2' }]}>
                  <Trash2 size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionTitleDanger}>Delete Session Log</Text>
                  <Text style={styles.sheetOptionSub}>Remove session from history</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  // Top Header Bar (Pattern 4.A)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  xpPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  xpPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#92400E',
  },

  // Mode Switcher Chips (Compact, No Overflow)
  modeChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
  },
  chipPillActiveWork: {
    backgroundColor: '#FEF2F2',
  },
  chipPillActiveBreak: {
    backgroundColor: '#ECFDF5',
  },
  chipPillActiveLong: {
    backgroundColor: '#FAF5FF',
  },
  chipPillText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  chipPillTextActive: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
  },

  // Contained Timer Display Card (NO layout overlap!)
  timerCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
  },
  timerAuraCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  svgRing: {
    position: 'absolute',
  },
  timerCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockDigitsText: {
    fontFamily: FONTS.displayBold,
    fontSize: 44,
    color: '#0F172A',
    letterSpacing: -1,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Controls Bar
  controlsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  circleActionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayPillBtn: {
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  mainPlayPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Recent Logs Section (Soft Background Fill, NO OUTER BORDER!)
  logsSectionContainer: {
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  emptyLogsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
  logCardItemSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  logStatusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logCategoryText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
  },
  logTimeSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  logDurationPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  logDurationText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#2563EB',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInput: {
    fontFamily: FONTS.groteskMedium,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  suggestionsLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 6,
    marginBottom: 18,
  },
  sugChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sugChipText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#334155',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnFull: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginTop: 6,
  },
  modalCancelText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  modalConfirmText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  stopTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopTemplateText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
  },

  // Action Sheet Modal
  sheetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
  },
  modalMetaText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  modalActionButtonsGroup: {
    gap: 10,
  },
  sheetOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
  },
  sheetOptionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
  },
  sheetOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetOptionTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
  },
  sheetOptionTitleDanger: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#DC2626',
  },
  sheetOptionSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});

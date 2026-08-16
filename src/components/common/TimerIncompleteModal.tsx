import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Task } from '../../types';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import {
  Timer,
  AlertTriangle,
  Play,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TimerIncompleteModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onResumeTimer?: (task: Task) => void;
  onForceComplete?: (task: Task) => void;
}

export const TimerIncompleteModal: React.FC<TimerIncompleteModalProps> = ({
  visible,
  task,
  onClose,
  onResumeTimer,
  onForceComplete,
}) => {
  if (!task) return null;

  const targetMins = Math.max(1, task.timerDurationMins || task.durationMins || 30);
  const targetSecs = targetMins * 60;
  const elapsedSecs = Math.max(0, task.elapsedSeconds || 0);

  const currentMins = Math.floor(elapsedSecs / 60);
  const currentSecs = elapsedSecs % 60;

  const requiredMins = Math.round(targetMins * 0.8);
  const remainingMinsNeeded = Math.max(0, requiredMins - currentMins);

  const rawPct = targetSecs > 0 ? (elapsedSecs / targetSecs) * 100 : 0;
  const currentPct = Math.min(100, Math.max(0, Math.round(rawPct)));

  const handleResume = () => {
    triggerHaptic.mediumImpact();
    onClose();
    if (onResumeTimer) {
      onResumeTimer(task);
    }
  };

  const handleForceComplete = () => {
    triggerHaptic.notificationSuccess();
    onClose();
    if (onForceComplete) {
      onForceComplete(task);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlayBackdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Top Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Warning Header Icon Badge */}
              <View style={styles.headerIconContainer}>
                <View style={styles.headerIconOuterRing}>
                  <View style={styles.headerIconInnerCircle}>
                    <Timer size={28} color="#D97706" />
                  </View>
                </View>
              </View>

              {/* Modal Title & Subtitle */}
              <Text style={styles.modalTitle}>Timer Incomplete</Text>
              <Text style={styles.modalSubtitle}>
                This task requires focus tracking before it can be completed.
              </Text>

              {/* Task Detail Pill */}
              <View style={styles.taskDetailCard}>
                <Text style={styles.taskTitleText} numberOfLines={1}>
                  {task.title}
                </Text>
                <View style={styles.taskCategoryPill}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.taskCategoryText}>
                    {task.startTime || 'Scheduled'} • {targetMins}m Goal
                  </Text>
                </View>
              </View>

              {/* Dynamic Progress Section */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Tracked Progress</Text>
                  <Text style={styles.progressPctText}>{currentPct}%</Text>
                </View>

                {/* Progress Bar with 80% Marker */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, currentPct)}%` },
                    ]}
                  />
                  {/* 80% Target Line */}
                  <View style={styles.targetMarkerLine} />
                </View>

                <View style={styles.progressSubInfoRow}>
                  <Text style={styles.progressSubText}>
                    Tracked: {currentMins}m {currentSecs}s
                  </Text>
                  <Text style={styles.targetReqText}>
                    Required (80%): {requiredMins}m
                  </Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGridRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Goal</Text>
                  <Text style={styles.statBoxVal}>{targetMins}m</Text>
                </View>
                <View style={styles.statBoxDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Completed</Text>
                  <Text style={[styles.statBoxVal, { color: '#D97706' }]}>
                    {currentMins}m
                  </Text>
                </View>
                <View style={styles.statBoxDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Needed</Text>
                  <Text style={[styles.statBoxVal, { color: '#EF4444' }]}>
                    {remainingMinsNeeded}m
                  </Text>
                </View>
              </View>

              {/* Encouragement Callout */}
              <View style={styles.calloutBox}>
                <Sparkles size={16} color="#D97706" style={{ marginTop: 2 }} />
                <Text style={styles.calloutText}>
                  Focus for at least{' '}
                  <Text style={{ fontFamily: FONTS.groteskBold, color: '#92400E' }}>
                    {requiredMins} mins (80%)
                  </Text>{' '}
                  to mark this task complete and gain full productivity XP!
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {/* Primary Button: Resume Focus Timer */}
                <TouchableOpacity
                  style={styles.primaryResumeBtn}
                  onPress={handleResume}
                  activeOpacity={0.85}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryResumeBtnText}>Resume Focus Timer</Text>
                </TouchableOpacity>

                {/* Secondary Button Row */}
                <View style={styles.secondaryBtnRow}>
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dismissBtnText}>Keep Working</Text>
                  </TouchableOpacity>

                  {onForceComplete && (
                    <TouchableOpacity
                      style={styles.forceCompleteBtn}
                      onPress={handleForceComplete}
                      activeOpacity={0.7}
                    >
                      <CheckCircle2 size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.forceCompleteBtnText}>Complete Anyway</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 36, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconContainer: {
    marginBottom: 12,
  },
  headerIconOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  headerIconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginHorizontal: 10,
  },

  // Task Detail Card
  taskDetailCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  taskTitleText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 15,
    color: '#0F172A',
  },
  taskCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskCategoryText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },

  // Progress Section
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPctText: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: '#D97706',
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  targetMarkerLine: {
    position: 'absolute',
    left: '80%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#0F172A',
    zIndex: 2,
  },
  progressSubInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressSubText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11.5,
    color: '#64748B',
  },
  targetReqText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11.5,
    color: '#0F172A',
  },

  // Stats Grid
  statsGridRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  statBoxVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
    marginTop: 2,
  },
  statBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },

  // Callout Box
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    width: '100%',
  },
  calloutText: {
    flex: 1,
    fontFamily: FONTS.groteskMedium,
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
  },

  // Buttons
  actionButtonsContainer: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  primaryResumeBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryResumeBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#475569',
  },
  forceCompleteBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forceCompleteBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
});

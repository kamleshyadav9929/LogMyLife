import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  PanResponder
} from 'react-native';
import { TimetableSlot, Task } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import { BottomSheet } from '../common/BottomSheet';
import { AcademicEmptyIllustration } from '../common/EmptyStateIllustrations';
import {
  Clock,
  Calendar,
  Plus,
  X,
  Trash2,
  Pencil
} from 'lucide-react-native';

interface Props {
  timetable: TimetableSlot[];
  theme: ThemeConfig;
  onTimetableChange: (updatedTt: TimetableSlot[], updatedTasks?: Task[]) => void;
}

const DAYS = [
  { label: 'Mon', val: 1 },
  { label: 'Tue', val: 2 },
  { label: 'Wed', val: 3 },
  { label: 'Thu', val: 4 },
  { label: 'Fri', val: 5 },
  { label: 'Sat', val: 6 },
  { label: 'Sun', val: 7 },
];

function parseTimeToDecimalHour(timeStr: string): number {
  if (!timeStr) return 10;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const match = cleaned.match(/(\d+):?(\d+)?/);
  if (!match) return 10;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours + minutes / 60;
}

function formatDecimalToTimeString(dec: number): string {
  const norm = (dec + 24) % 24;
  let hours = Math.floor(norm);
  const minutes = Math.round((norm - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const hrsStr = hours < 10 ? `0${hours}` : `${hours}`;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hrsStr}:${minsStr} ${period}`;
}

interface SwipeableCardProps {
  slot: TimetableSlot;
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slotId: string) => void;
}

const SwipeableClassCard: React.FC<SwipeableCardProps> = ({ slot, onEdit, onDelete }) => {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue(Math.max(gestureState.dx, -140));
        } else if (gestureState.dx > 0) {
          pan.setValue(Math.min(gestureState.dx, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -45) {
          Animated.spring(pan, {
            toValue: -140,
            tension: 28,
            friction: 9,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            tension: 28,
            friction: 9,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const closeSwipe = (callback?: () => void) => {
    Animated.spring(pan, {
      toValue: 0,
      tension: 28,
      friction: 9,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  };

  return (
    <View style={styles.swipeWrapper}>
      {/* Full-Height Lighter Background Action Panels */}
      <View style={styles.appleActionsBackground}>
        <TouchableOpacity
          style={styles.appleEditPanel}
          onPress={() => {
            triggerHaptic.lightImpact();
            closeSwipe(() => onEdit(slot));
          }}
          activeOpacity={0.85}
        >
          <Pencil size={17} color="#1E40AF" />
          <Text style={styles.appleEditLabel}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleDeletePanel}
          onPress={() => {
            triggerHaptic.mediumImpact();
            closeSwipe(() => onDelete(slot.id));
          }}
          activeOpacity={0.85}
        >
          <Trash2 size={17} color="#DC2626" />
          <Text style={styles.appleDeleteLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Complete Swipable Card Box */}
      <Animated.View
        style={[styles.simpleClassCard, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardMainInfo}>
          <Text style={styles.classSubjectTitle}>{slot.subject}</Text>

          <View style={styles.cardSubMetaRow}>
            <View style={styles.timeMetaBox}>
              <Clock size={13} color="#334155" />
              <Text style={styles.timeMetaText}>{slot.timeStr}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export const AcademicHub: React.FC<Props> = ({ timetable, theme, onTimetableChange }) => {
  const [selectedDay, setSelectedDay] = useState(1); // 1 = Monday
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form State for Adding/Editing a Class
  const [subject, setSubject] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('10:00 AM');
  const [endTimeStr, setEndTimeStr] = useState('11:00 AM');
  const [formDay, setFormDay] = useState(1);

  const filteredTimetable = timetable.filter(t => t.dayOfWeek === selectedDay);

  const handleOpenAddModal = () => {
    triggerHaptic.lightImpact();
    setEditingSlotId(null);
    setSubject('');
    setStartTimeStr('10:00 AM');
    setEndTimeStr('11:00 AM');
    setFormDay(selectedDay);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (slot: TimetableSlot) => {
    triggerHaptic.lightImpact();
    setEditingSlotId(slot.id);
    setSubject(slot.subject);

    if (slot.timeStr.includes('-')) {
      const parts = slot.timeStr.split('-');
      setStartTimeStr(parts[0].trim());
      setEndTimeStr(parts[1].trim());
    } else {
      setStartTimeStr(slot.timeStr);
      setEndTimeStr('11:00 AM');
    }

    setFormDay(slot.dayOfWeek);
    setShowAddModal(true);
  };

  const handleDurationPreset = (hours: number) => {
    triggerHaptic.lightImpact();
    const startDec = parseTimeToDecimalHour(startTimeStr);
    const endDec = startDec + hours;
    setEndTimeStr(formatDecimalToTimeString(endDec));
  };

  const handleSaveClass = async () => {
    if (!subject.trim()) return;

    triggerHaptic.notificationSuccess();
    const formattedTime = `${startTimeStr} - ${endTimeStr}`;

    if (editingSlotId) {
      // Update existing class
      const updatedTt = await Database.updateClassSlot(editingSlotId, {
        subject: subject.trim(),
        timeStr: formattedTime,
        dayOfWeek: formDay,
      });
      onTimetableChange(updatedTt);
    } else {
      // Create new class
      const newClassData: Omit<TimetableSlot, 'id'> = {
        dayOfWeek: formDay,
        timeStr: formattedTime,
        subject: subject.trim(),
        code: 'CLASS',
        room: 'Room',
        instructor: '',
        category: 'College',
        notifyEnabled: true,
      };

      const { timetable: updatedTt, tasks: updatedTasks } = await Database.addClassSlot(newClassData);
      onTimetableChange(updatedTt, updatedTasks);
    }

    // Reset Form
    setSubject('');
    setEditingSlotId(null);
    setShowAddModal(false);
  };

  const handleDeleteClass = async (slotId: string) => {
    triggerHaptic.mediumImpact();
    const updatedTt = await Database.removeClassSlot(slotId);
    onTimetableChange(updatedTt);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={styles.headerTitle}>Academic Hub</Text>
          <Text style={styles.headerSubtitle}>Weekly schedule & timetable</Text>
        </View>

        <TouchableOpacity
          style={styles.addClassPillBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Plus size={15} color="#0F172A" />
          <Text style={styles.addClassPillText}>Add Class</Text>
        </TouchableOpacity>
      </View>

      {/* Single-Row Non-Scrollable 7-Day Selector */}
      <View style={styles.daysRowContainer}>
        {DAYS.map((day) => {
          const isSelected = selectedDay === day.val;
          return (
            <TouchableOpacity
              key={day.val}
              onPress={() => {
                triggerHaptic.lightImpact();
                setSelectedDay(day.val);
              }}
              activeOpacity={0.8}
              style={[styles.dayChip, isSelected ? styles.dayChipSelected : styles.dayChipUnselected]}
            >
              <Text style={isSelected ? styles.dayTextSelected : styles.dayTextUnselected}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Class Timetable List (Apple Swipe-to-Reveal Edit & Delete) */}
        {filteredTimetable.length === 0 ? (
          <View style={styles.framelessEmptyCard}>
            <AcademicEmptyIllustration size={130} />
            <Text style={styles.emptyTitleText}>No classes scheduled for {DAYS.find(d => d.val === selectedDay)?.label}</Text>
            <Text style={styles.emptySubText}>Enjoy your open time slot or add a new lecture above!</Text>

            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
              <Plus size={14} color="#0F172A" />
              <Text style={styles.emptyAddBtnText}>Add Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTimetable.map(slot => (
            <SwipeableClassCard
              key={slot.id}
              slot={slot}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteClass}
            />
          ))
        )}
      </ScrollView>

      {/* Add / Edit Class Bottom Sheet Modal */}
      <BottomSheet
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        snapPoints={['88%', '95%']}
        theme={theme}
      >
        {({ scrollEnabled, onScroll, closeSheet }) => (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingSlotId ? 'Edit Class' : 'Add New Class'}</Text>
                <Text style={styles.modalSubtitle}>Will also sync with your Daily Planner</Text>
              </View>

              <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              scrollEnabled={scrollEnabled}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              <Text style={styles.inputLabel}>Class / Subject Title *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Operating Systems"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
              />

              {/* Starting Time & Ending Time Choosers */}
              <View style={styles.timePickersRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Starting Time</Text>
                  <View style={styles.timeCardBox}>
                    <Clock size={15} color="#334155" />
                    <TextInput
                      style={styles.timeInputField}
                      value={startTimeStr}
                      onChangeText={setStartTimeStr}
                      placeholder="10:00 AM"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Ending Time</Text>
                  <View style={styles.timeCardBox}>
                    <Clock size={15} color="#334155" />
                    <TextInput
                      style={styles.timeInputField}
                      value={endTimeStr}
                      onChangeText={setEndTimeStr}
                      placeholder="11:00 AM"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>

              {/* Quick Duration Presets */}
              <Text style={styles.inputLabel}>Quick Duration Presets</Text>
              <View style={styles.durationPillsRow}>
                <TouchableOpacity style={styles.durPill} onPress={() => handleDurationPreset(0.5)}>
                  <Text style={styles.durPillText}>30 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.durPill} onPress={() => handleDurationPreset(1)}>
                  <Text style={styles.durPillText}>1 hour</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.durPill} onPress={() => handleDurationPreset(1.5)}>
                  <Text style={styles.durPillText}>1.5 hours</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.durPill} onPress={() => handleDurationPreset(2)}>
                  <Text style={styles.durPillText}>2 hours</Text>
                </TouchableOpacity>
              </View>

              {/* Day Selector */}
              <Text style={styles.inputLabel}>Select Day of Week</Text>
              <View style={styles.formDayRow}>
                {DAYS.map((d) => {
                  const isSel = formDay === d.val;
                  return (
                    <TouchableOpacity
                      key={d.val}
                      style={[styles.formDayChip, isSel && styles.formDayChipActive]}
                      onPress={() => setFormDay(d.val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.formDayText, isSel && styles.formDayTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.addClassSubmitBtn}
                onPress={() => {
                  handleSaveClass();
                  closeSheet();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addClassSubmitBtnText}>
                  {editingSlotId ? 'Save Changes' : 'Add Class'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Top Header Bar
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addClassPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addClassPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 4,
  },

  // Single-Row 7-Day Selector
  daysRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dayChipSelected: {
    backgroundColor: '#F1F5F9',
  },
  dayChipUnselected: {
    backgroundColor: '#F8FAFC',
  },
  dayTextSelected: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    fontSize: 12,
  },
  dayTextUnselected: {
    fontFamily: FONTS.groteskMedium,
    color: '#64748B',
    fontSize: 12,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Lighter Soft Apple Action Panels (Flat Left Border, Soft Colors)
  swipeWrapper: {
    marginBottom: 12,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  appleActionsBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 140,
    flexDirection: 'row',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  appleEditPanel: {
    flex: 1,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#BFDBFE',
  },
  appleDeletePanel: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleEditLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#1E40AF',
    marginTop: 3,
  },
  appleDeleteLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#DC2626',
    marginTop: 3,
  },

  // Complete Swipable Card
  simpleClassCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    minHeight: 68,
    justifyContent: 'center',
  },
  cardMainInfo: {
    flex: 1,
  },
  classSubjectTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeMetaText: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 12,
    color: '#334155',
    marginLeft: 4,
  },

  // Frameless Empty State
  framelessEmptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 16,
  },
  emptyAddBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 4,
  },

  // Modal Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  inputLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    fontFamily: FONTS.groteskRegular,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },

  // Time Pickers & Duration Presets
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeInputField: {
    flex: 1,
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
    marginLeft: 6,
    padding: 0,
  },
  durationPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  durPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  durPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#0F172A',
  },

  formDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  formDayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 2,
  },
  formDayChipActive: {
    backgroundColor: '#F1F5F9',
  },
  formDayText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
  },
  formDayTextActive: {
    color: '#0F172A',
  },
  addClassSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 22,
  },
  addClassSubmitBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
  },
});

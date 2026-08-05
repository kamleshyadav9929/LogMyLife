import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Task, TaskCategory, UserCategory } from '../../types';
import { ThemeConfig, getCategoryColor, getCategoryLightBg, getCategoryTextColor, getCategoryName } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import { BottomSheet } from '../common/BottomSheet';
import { TimePickerModal } from '../common/TimePickerModal';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Check,
  Trash2,
  AlertCircle,
  Play,
  ArrowLeft,
  Timer,
  Bell,
  BellOff,
  CheckCircle2,
} from 'lucide-react-native';

interface Props {
  tasks: Task[];
  theme: ThemeConfig;
  categories: UserCategory[];
  onToggleComplete: (id: string) => void;
  onSnoozeTask: (id: string) => void;
  onAddTask: () => void;
  onTasksUpdated?: (updated: Task[]) => void;
  onStartTaskTimer?: (task: Task) => void;
}

function parseTimeToDecimalHour(timeStr: string): number {
  if (!timeStr) return 9;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const match = cleaned.match(/(\d+):?(\d+)?/);
  if (!match) return 9;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours + minutes / 60;
}

function formatHourLabel(h: number): string {
  const normalized = (h + 24) % 24;
  if (normalized === 0) return '12 am';
  if (normalized === 12) return '12 pm';
  if (normalized > 12) return `${normalized - 12} pm`;
  return `${normalized} am`;
}

function formatDecimalHourLabel(dec: number): string {
  const h = Math.floor(dec) % 24;
  const mins = Math.round((dec - Math.floor(dec)) * 60);
  const period = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  if (mins === 0) {
    return `${displayH} ${period}`;
  }
  return `${displayH}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getCatStyle(categories: UserCategory[], categoryId: string): { bg: string; bar: string; text: string } {
  const color = getCategoryColor(categories, categoryId);
  return {
    bg: getCategoryLightBg(color),
    bar: color,
    text: getCategoryTextColor(color),
  };
}

function getLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const date = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function calculateDayProductivityScore(dayTasks: Task[]): { score: number; colorState: 'good' | 'avg' | 'worse' | 'empty' } {
  if (!dayTasks || dayTasks.length === 0) {
    return { score: 0, colorState: 'empty' };
  }
  const completedCount = dayTasks.filter(t => t.completed).length;
  const ratio = completedCount / dayTasks.length;
  const score = Math.round(ratio * 100);

  if (score >= 70) {
    return { score, colorState: 'good' };
  } else if (score >= 40) {
    return { score, colorState: 'avg' };
  } else {
    return { score, colorState: 'worse' };
  }
}

interface TimelineSegment {
  startDec: number;
  endDec: number;
  task?: Task;
}

function buildTimelineSegments(dayTasks: Task[]): TimelineSegment[] {
  const sortedTasks = [...dayTasks]
    .map(t => {
      const sDec = parseTimeToDecimalHour(t.startTime);
      let eDec = t.endTime ? parseTimeToDecimalHour(t.endTime) : sDec + (t.durationMins ? t.durationMins / 60 : 1);
      if (eDec <= sDec) eDec = sDec + 1;
      return { task: t, startDec: sDec, endDec: eDec };
    })
    .filter(t => t.startDec >= 0 && t.startDec < 24)
    .sort((a, b) => a.startDec - b.startDec);

  const segments: TimelineSegment[] = [];
  let currentHour = 0;

  for (const item of sortedTasks) {
    if (item.startDec > currentHour) {
      let gapStart = currentHour;
      while (gapStart < item.startDec) {
        let nextGapEnd = Math.floor(gapStart) + 1;
        if (nextGapEnd > item.startDec) nextGapEnd = item.startDec;
        segments.push({ startDec: gapStart, endDec: nextGapEnd });
        gapStart = nextGapEnd;
      }
    }

    const actualEnd = Math.min(24, Math.max(item.startDec + 0.25, item.endDec));
    segments.push({
      startDec: item.startDec,
      endDec: actualEnd,
      task: item.task,
    });

    currentHour = Math.max(currentHour, actualEnd);
  }

  while (currentHour < 24) {
    const nextHour = Math.min(24, Math.floor(currentHour) + 1);
    const end = nextHour > currentHour ? nextHour : currentHour + 1;
    segments.push({ startDec: currentHour, endDec: Math.min(24, end) });
    currentHour = Math.min(24, end);
  }

  return segments;
}

export const DailyPlanner: React.FC<Props> = ({
  tasks = [],
  theme,
  categories = [],
  onToggleComplete,
  onSnoozeTask,
  onAddTask,
  onTasksUpdated,
  onStartTaskTimer,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  // Add Event Sheet State
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<TaskCategory>(categories[0]?.id || 'Personal');
  const [startTimeStr, setStartTimeStr] = useState('09:00 AM');
  const [endTimeStr, setEndTimeStr] = useState('10:00 AM');
  const [eventRequiresTimer, setEventRequiresTimer] = useState(false);
  const [eventNotificationEnabled, setEventNotificationEnabled] = useState(true);

  // Detail Task BottomSheet State
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  // Time Picker Modal State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end'>('start');

  // Task Verification Modal State
  const [verifyingTask, setVerifyingTask] = useState<Task | null>(null);
  const [verificationReason, setVerificationReason] = useState<'timer_required' | 'out_of_time' | null>(null);

  const [nowTime, setNowTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const selectedDateStr = getLocalDateStr(selectedDate);
  const todayStr = getLocalDateStr(nowTime);
  const todayDateNum = nowTime.getDate();

  // Filter tasks for selected date
  const dayTasks = (tasks || []).filter(t => t.dateStr === selectedDateStr);
  const timelineSegments = buildTimelineSegments(dayTasks);

  const handlePrevMonth = () => {
    triggerHaptic.lightImpact();
    const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    setSelectedDate(prev);
  };

  const handleNextMonth = () => {
    triggerHaptic.lightImpact();
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    setSelectedDate(next);
  };

  const handleOpenSegmentAddTask = (startDec: number, endDec: number) => {
    triggerHaptic.lightImpact();
    const startStr = formatDecimalHourLabel(startDec).toUpperCase();
    const endStr = formatDecimalHourLabel(endDec).toUpperCase();
    setStartTimeStr(startStr);
    setEndTimeStr(endStr);
    setEventTitle('');
    setEventRequiresTimer(false);
    setEventNotificationEnabled(true);
    setShowAddEventSheet(true);
  };

  const handleSaveEvent = async () => {
    triggerHaptic.notificationSuccess();
    if (eventTitle.trim()) {
      const startDec = parseTimeToDecimalHour(startTimeStr);
      const endDec = parseTimeToDecimalHour(endTimeStr);
      let durationMins = Math.round((endDec - startDec) * 60);
      if (durationMins <= 0) durationMins = 60;

      const updated = await Database.addTask({
        title: eventTitle.trim(),
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationMins,
        category: eventCategory,
        completed: false,
        snoozed: false,
        dateStr: selectedDateStr,
        requiresTimer: eventRequiresTimer,
        notificationEnabled: eventNotificationEnabled,
      });

      if (onTasksUpdated) {
        onTasksUpdated(updated);
      }
    }
    setShowAddEventSheet(false);
    setEventTitle('');
  };

  const handleAttemptComplete = (task: Task) => {
    triggerHaptic.mediumImpact();

    if (task.completed) {
      onToggleComplete(task.id);
      return;
    }

    if (task.requiresTimer) {
      const isTimerDone = (task.leftoverSeconds !== undefined && task.leftoverSeconds <= 0) ||
                          (task.elapsedSeconds !== undefined && task.elapsedSeconds >= (task.timerDurationMins || 25) * 60);

      if (!isTimerDone) {
        setVerifyingTask(task);
        setVerificationReason('timer_required');
        return;
      }
    }

    onToggleComplete(task.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    triggerHaptic.mediumImpact();
    const allTasks = await Database.getTasks();
    const filtered = allTasks.filter(t => t.id !== taskId);
    await Database.saveTasks(filtered);
    if (onTasksUpdated) {
      onTasksUpdated(filtered);
    }
  };

  // Build Month Grid
  const getMonthGridDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const gridDays = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dateNum = prevMonthLastDay - i;
      gridDays.push({
        dateNum,
        isCurrentMonth: false,
        dateObj: new Date(year, month - 1, dateNum),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      gridDays.push({
        dateNum: i,
        isCurrentMonth: true,
        dateObj: new Date(year, month, i),
      });
    }

    const totalSlots = Math.ceil(gridDays.length / 7) * 7;
    const remainingSlots = totalSlots - gridDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
      gridDays.push({
        dateNum: i,
        isCurrentMonth: false,
        dateObj: new Date(year, month + 1, i),
      });
    }

    return gridDays;
  };

  const monthGridDays = getMonthGridDays();
  const monthYearHeader = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* 1. Top Header Row (Month Name only in header, Today Date Pill on Right Side) */}
      <View style={styles.topHeaderRow}>
        <View style={styles.headerLeftRow}>
          {viewMode === 'timeline' && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => {
                triggerHaptic.lightImpact();
                setViewMode('month');
              }}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>
          )}

          <View>
            <Text style={styles.headerTitle}>
              {viewMode === 'timeline'
                ? selectedDate.toLocaleDateString('en-US', { month: 'long' })
                : 'Planner'}
            </Text>
            <Text style={styles.headerSubtitle}>Monthly schedule & timetable</Text>
          </View>
        </View>

        {/* Current Date Pill on Right Side */}
        <TouchableOpacity
          style={styles.headerTodayPillRight}
          onPress={() => {
            triggerHaptic.mediumImpact();
            setSelectedDate(new Date());
            setViewMode('timeline');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTodayDateNum}>{todayDateNum}</Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: MONTH CALENDAR PAGE */}
      {viewMode === 'month' && (
        <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
          {/* Month Navigation Header with Soft Round Background Fill & No Borders */}
          <View style={styles.monthNavWrapper}>
            <View style={styles.monthNavPill}>
              <TouchableOpacity style={styles.monthNavArrowBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
                <ChevronLeft size={18} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.monthNavTitle}>{monthYearHeader}</Text>

              <TouchableOpacity style={styles.monthNavArrowBtn} onPress={handleNextMonth} activeOpacity={0.7}>
                <ChevronRight size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Month Calendar Grid */}
          <View style={styles.calendarSection}>
            <View style={styles.weekdayHeaderRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <Text key={idx} style={styles.weekdayLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.monthGridContainer}>
              {monthGridDays.map((item, idx) => {
                const dateStr = getLocalDateStr(item.dateObj);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDateStr;

                const currentDayTasks = (tasks || []).filter(t => t.dateStr === dateStr);
                const { score, colorState } = calculateDayProductivityScore(currentDayTasks);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.monthGridCell,
                      !item.isCurrentMonth && styles.monthGridCellDim,
                      isToday && styles.monthGridCellToday,
                      isSelected && !isToday && styles.monthGridCellSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setSelectedDate(item.dateObj);
                      setViewMode('timeline');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.monthCellDateText,
                        !item.isCurrentMonth && styles.monthCellDateDimText,
                        isToday && styles.monthCellDateTodayText,
                        isSelected && !isToday && styles.monthCellDateSelectedText,
                      ]}
                    >
                      {item.dateNum}
                    </Text>

                    {/* Productivity Score Written Below the Date */}
                    <View
                      style={[
                        styles.scoreBadgePill,
                        colorState === 'good' && styles.scoreGoodBg,
                        colorState === 'avg' && styles.scoreAvgBg,
                        colorState === 'worse' && styles.scoreWorseBg,
                        colorState === 'empty' && styles.scoreEmptyBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreBadgeText,
                          colorState === 'good' && styles.scoreGoodText,
                          colorState === 'avg' && styles.scoreAvgText,
                          colorState === 'worse' && styles.scoreWorseText,
                          colorState === 'empty' && styles.scoreEmptyText,
                        ]}
                      >
                        {score > 0 ? `${score}%` : '0%'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* VIEW 2: 24-HOUR DYNAMIC TIMELINE PAGE */}
      {viewMode === 'timeline' && (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Sticky Reduced-Height Date Header (Sat 1) */}
          <View style={styles.stickyTimelineDateHeaderBox}>
            <Text style={styles.timelineDayNameText}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={styles.timelineDateNumText}>
              {selectedDate.getDate()}
            </Text>
          </View>

          <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.timelinePageContainer}>
              {/* Dynamic Time Segments */}
              <View style={styles.timeStripContainer}>
                {timelineSegments.map((seg, idx) => {
                  const startLabel = formatDecimalHourLabel(seg.startDec);
                  const durationHours = seg.endDec - seg.startDec;
                  // Base scale: 64px per hour. Longer slots (> 1 hr) scale proportionally taller!
                  const baseHourHeight = 64;
                  const calculatedHeight = Math.max(44, Math.round(durationHours * baseHourHeight));
                  const task = seg.task;
                  const catStyle = task ? getCatStyle(categories, task.category) : null;
                  const catName = task ? getCategoryName(categories, task.category) : '';
                  const showCatName = catName && catName !== 'cat-work' && catName.toLowerCase() !== 'work';

                  return (
                    <View key={idx} style={[styles.slotHourBlock, { minHeight: calculatedHeight }]}>
                      {/* Time Label on Left */}
                      <View style={styles.timeLabelContainer}>
                        <Text style={styles.cleanTimeLabelText}>{startLabel}</Text>
                      </View>

                      {/* Strip with Proportional Dynamic Height Scaling according to Task Duration */}
                      <TouchableOpacity
                        style={[
                          styles.whiteSlotStrip,
                          { minHeight: calculatedHeight },
                          task && catStyle ? { backgroundColor: catStyle.bg } : { backgroundColor: '#FFFFFF' },
                        ]}
                        onPress={() => {
                          if (task) {
                            triggerHaptic.lightImpact();
                            setSelectedDetailTask(task);
                          } else {
                            handleOpenSegmentAddTask(seg.startDec, seg.endDec);
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        {task && catStyle ? (
                          <View style={styles.taskStripInnerRow}>
                            <View style={styles.slotTaskInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                  style={[
                                    styles.slotTaskTitle,
                                    task.completed && styles.taskCompletedStrike,
                                  ]}
                                  numberOfLines={durationHours >= 1.5 ? 2 : 1}
                                >
                                  {task.title}
                                </Text>

                                {/* Timer Required Icon */}
                                {task.requiresTimer && (
                                  <View style={styles.timerRequiredBadge}>
                                    <Timer size={12} color="#2563EB" />
                                  </View>
                                )}
                              </View>

                              <Text style={styles.slotTaskMeta}>
                                {task.startTime || startLabel} {task.endTime ? `- ${task.endTime}` : ''}{showCatName ? ` • ${catName}` : ''}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.slotCheckBtn,
                                task.completed && { backgroundColor: catStyle.bar, borderColor: catStyle.bar },
                              ]}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleAttemptComplete(task);
                              }}
                            >
                              {task.completed && <Check size={12} color="#FFFFFF" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.slotDeleteBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                            >
                              <Trash2 size={13} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Final End Label */}
                <View style={styles.timeLabelContainer}>
                  <Text style={styles.cleanTimeLabelText}>12 am</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Redesigned Add Task / Event Bottom Sheet Modal (Soft Fill Input Fields, Top Save Button) */}
      <BottomSheet
        visible={showAddEventSheet}
        onClose={() => setShowAddEventSheet(false)}
        snapPoints={['92%']}
        theme={theme}
      >
        {({ scrollEnabled, onScroll, closeSheet }) => (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Task</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              {/* Save Button moved to Top Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity style={styles.topSaveBtnPill} onPress={handleSaveEvent} activeOpacity={0.85}>
                  <Text style={styles.topSaveBtnText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeSheet} style={styles.modalCloseBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              scrollEnabled={scrollEnabled}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Solve 2 LeetCode Problems"
                placeholderTextColor="#94A3B8"
                value={eventTitle}
                onChangeText={setEventTitle}
                autoFocus
              />

              {/* Starting Time & Ending Time */}
              <View style={styles.timePickersRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.timeCardBox}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setTimePickerTarget('start');
                      setTimePickerVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Clock size={16} color="#2563EB" />
                    <Text style={styles.timeDisplayText}>{startTimeStr || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timeCardBox}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setTimePickerTarget('end');
                      setTimePickerVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Clock size={16} color="#2563EB" />
                    <Text style={styles.timeDisplayText}>{endTimeStr || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Category Chooser */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryWrapRow}>
                {(categories || []).map((cat) => {
                  const isCatSelected = eventCategory === cat.id;
                  const catColor = cat.color || '#2563EB';
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChoiceChip,
                        isCatSelected
                          ? { backgroundColor: catColor }
                          : { backgroundColor: '#F1F5F9' },
                      ]}
                      onPress={() => setEventCategory(cat.id as TaskCategory)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.catChoiceChipText,
                          isCatSelected ? { color: '#FFFFFF' } : { color: '#334155' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Additional Options */}
              <View style={styles.optionsSectionGroup}>
                {/* Is Timer Required Toggle */}
                <View style={styles.toggleSettingRow}>
                  <View style={styles.toggleLabelGroup}>
                    <Timer size={18} color="#2563EB" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.toggleSettingTitle}>Is Timer Required?</Text>
                      <Text style={styles.toggleSettingSubText}>Requires focus timer to mark completed</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.customTogglePill, eventRequiresTimer && styles.customTogglePillActive]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setEventRequiresTimer(!eventRequiresTimer);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.customToggleCircle, eventRequiresTimer && styles.customToggleCircleActive]} />
                  </TouchableOpacity>
                </View>

                {/* Notification Enabled Toggle */}
                <View style={styles.toggleSettingRow}>
                  <View style={styles.toggleLabelGroup}>
                    {eventNotificationEnabled ? <Bell size={18} color="#2563EB" /> : <BellOff size={18} color="#94A3B8" />}
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.toggleSettingTitle}>Enable Notification</Text>
                      <Text style={styles.toggleSettingSubText}>Send reminder when task starts</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.customTogglePill, eventNotificationEnabled && styles.customTogglePillActive]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setEventNotificationEnabled(!eventNotificationEnabled);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.customToggleCircle, eventNotificationEnabled && styles.customToggleCircleActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </BottomSheet>

      {/* Task Details Bottom Sheet Modal (Opened on clicking any task) */}
      <BottomSheet
        visible={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        snapPoints={['65%']}
        theme={theme}
      >
        {({ closeSheet }) => (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {selectedDetailTask && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Task Details</Text>
                    <Text style={styles.modalSubtitle}>Scheduled Event Summary</Text>
                  </View>
                  <TouchableOpacity onPress={closeSheet} style={styles.modalCloseBtn}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {/* Task Header Summary Banner */}
                  <View style={styles.detailTitleCard}>
                    <Text style={styles.detailTitleText}>{selectedDetailTask.title}</Text>
                    <View style={styles.detailBadgesRow}>
                      <View
                        style={[
                          styles.detailCategoryBadge,
                          { backgroundColor: getCategoryLightBg(getCategoryColor(categories, selectedDetailTask.category)) }
                        ]}
                      >
                        <Text
                          style={[
                            styles.detailCategoryBadgeText,
                            { color: getCategoryTextColor(getCategoryColor(categories, selectedDetailTask.category)) }
                          ]}
                        >
                          {getCategoryName(categories, selectedDetailTask.category)}
                        </Text>
                      </View>

                      <View style={[styles.detailStatusBadge, selectedDetailTask.completed && styles.detailStatusCompletedBg]}>
                        <Text style={[styles.detailStatusBadgeText, selectedDetailTask.completed && styles.detailStatusCompletedText]}>
                          {selectedDetailTask.completed ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Task Info Field Group */}
                  <View style={styles.detailInfoBoxGroup}>
                    {/* Time */}
                    <View style={styles.detailInfoRow}>
                      <View style={styles.detailInfoLeft}>
                        <Clock size={17} color="#2563EB" />
                        <Text style={styles.detailInfoLabel}>Scheduled Time</Text>
                      </View>
                      <Text style={styles.detailInfoValue}>
                        {selectedDetailTask.startTime} - {selectedDetailTask.endTime} ({selectedDetailTask.durationMins}m)
                      </Text>
                    </View>

                    {/* Timer Required */}
                    <View style={styles.detailInfoRow}>
                      <View style={styles.detailInfoLeft}>
                        <Timer size={17} color="#2563EB" />
                        <Text style={styles.detailInfoLabel}>Timer Required</Text>
                      </View>
                      <Text style={[styles.detailInfoValue, selectedDetailTask.requiresTimer ? { color: '#2563EB' } : { color: '#64748B' }]}>
                        {selectedDetailTask.requiresTimer ? 'Yes (Timer Enabled)' : 'No'}
                      </Text>
                    </View>

                    {/* Notification Status */}
                    <View style={styles.detailInfoRow}>
                      <View style={styles.detailInfoLeft}>
                        {selectedDetailTask.notificationEnabled !== false ? (
                          <Bell size={17} color="#10B981" />
                        ) : (
                          <BellOff size={17} color="#94A3B8" />
                        )}
                        <Text style={styles.detailInfoLabel}>Notification</Text>
                      </View>
                      <Text
                        style={[
                          styles.detailInfoValue,
                          selectedDetailTask.notificationEnabled !== false ? { color: '#10B981' } : { color: '#64748B' }
                        ]}
                      >
                        {selectedDetailTask.notificationEnabled !== false ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.detailActionBtnsRow}>
                    <TouchableOpacity
                      style={[styles.detailToggleCompleteBtn, selectedDetailTask.completed && styles.detailToggleCompletedActive]}
                      onPress={() => {
                        triggerHaptic.mediumImpact();
                        handleAttemptComplete(selectedDetailTask);
                        closeSheet();
                      }}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={16} color={selectedDetailTask.completed ? '#10B981' : '#FFFFFF'} />
                      <Text style={[styles.detailToggleCompleteText, selectedDetailTask.completed && { color: '#10B981' }]}>
                        {selectedDetailTask.completed ? 'Completed' : 'Mark Complete'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailDeleteBtn}
                      onPress={() => {
                        triggerHaptic.heavyImpact();
                        handleDeleteTask(selectedDetailTask.id);
                        closeSheet();
                      }}
                      activeOpacity={0.85}
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text style={styles.detailDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        )}
      </BottomSheet>

      {/* Task Verification Modal */}
      {verifyingTask && (
        <Modal transparent animationType="fade" visible={!!verifyingTask}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <AlertCircle size={32} color="#D97706" style={{ marginBottom: 12 }} />
              <Text style={styles.modalTitle}>Verification Required</Text>
              <Text style={styles.modalBody}>
                {verificationReason === 'timer_required'
                  ? `Task "${verifyingTask.title}" requires a completed focus timer before marking done.`
                  : `Task "${verifyingTask.title}" is scheduled for a different time.`}
              </Text>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  if (onStartTaskTimer && verifyingTask.requiresTimer) {
                    onStartTaskTimer(verifyingTask);
                  }
                  setVerifyingTask(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>Start Timer Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  onToggleComplete(verifyingTask.id);
                  setVerifyingTask(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSecondaryBtnText}>Complete Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Visual Google-Style Time Picker Modal */}
      <TimePickerModal
        visible={timePickerVisible}
        initialTimeStr={timePickerTarget === 'start' ? startTimeStr : endTimeStr}
        title={timePickerTarget === 'start' ? 'Select Task Start Time' : 'Select Task End Time'}
        onSelectTime={(timeStr) => {
          if (timePickerTarget === 'start') {
            setStartTimeStr(timeStr);
          } else {
            setEndTimeStr(timeStr);
          }
        }}
        onClose={() => setTimePickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Top Header Row
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
  },
  headerTodayPillRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerTodayDateNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#2563EB',
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

  mainScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 2. Month Navigation Header
  monthNavWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  monthNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 320,
  },
  monthNavArrowBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  monthNavTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  // 3. Calendar Section
  calendarSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#94A3B8',
  },
  monthGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthGridCell: {
    width: '13.5%',
    margin: '0.39%',
    minHeight: 68, // Increased height of date cell
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  monthGridCellDim: {
    backgroundColor: '#FAFAFA',
  },
  monthGridCellToday: {
    backgroundColor: '#E0F2FE',
  },
  monthGridCellSelected: {
    backgroundColor: '#DBEAFE',
  },
  monthCellDateText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
  },
  monthCellDateDimText: {
    color: '#CBD5E1',
  },
  monthCellDateTodayText: {
    color: '#0284C7',
  },
  monthCellDateSelectedText: {
    color: '#1E40AF',
  },

  // Productivity Score Badges Below Date
  scoreBadgePill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
  },
  scoreGoodBg: {
    backgroundColor: '#DCFCE7',
  },
  scoreGoodText: {
    color: '#15803D',
  },
  scoreAvgBg: {
    backgroundColor: '#FEF3C7',
  },
  scoreAvgText: {
    color: '#B45309',
  },
  scoreWorseBg: {
    backgroundColor: '#FEE2E2',
  },
  scoreWorseText: {
    color: '#B91C1C',
  },
  scoreEmptyBg: {
    backgroundColor: '#F1F5F9',
  },
  scoreEmptyText: {
    color: '#94A3B8',
  },
  scoreBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9.5,
  },
  todayDotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    marginTop: 6,
  },

  // 4. Sticky Date Header & Dynamic Timeline View
  stickyTimelineDateHeaderBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineDayNameText: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  timelineDateNumText: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: '#0F172A',
    lineHeight: 22,
  },
  timelinePageContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
  },
  timeStripContainer: {
    backgroundColor: '#F8FAFC',
  },
  slotHourBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timeLabelContainer: {
    width: 44,
    paddingTop: 2,
  },
  cleanTimeLabelText: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 11,
    color: '#475569',
    textAlign: 'left',
  },
  whiteSlotStrip: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    borderWidth: 0,
  },

  // Task Inner Content
  taskStripInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTaskInfo: {
    flex: 1,
  },
  slotTaskTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
  },
  slotTaskMeta: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  taskCompletedStrike: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  slotCheckBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  slotDeleteBtn: {
    padding: 6,
    marginLeft: 6,
  },

  // Modal / Bottom Sheet (Soft Fill Fields, No Borders)
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalScrollContent: {
    paddingTop: 12,
    paddingBottom: 70,
  },
  inputLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  inputField: {
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
  },
  timePickersRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  timeCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeDisplayText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#2563EB',
    marginLeft: 8,
  },
  categoryWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChoiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 0,
  },
  catChoiceChipText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
  },
  saveTaskBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveTaskBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  topSaveBtnPill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSaveBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  timerRequiredBadge: {
    backgroundColor: '#EFF6FF',
    padding: 3,
    borderRadius: 6,
  },
  optionsSectionGroup: {
    marginTop: 18,
    gap: 12,
  },
  toggleSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
  },
  toggleLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleSettingTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
  },
  toggleSettingSubText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  customTogglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  customTogglePillActive: {
    backgroundColor: '#2563EB',
  },
  customToggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  customToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  detailTitleCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  detailTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
  },
  detailBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailCategoryBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  detailStatusCompletedBg: {
    backgroundColor: '#DCFCE7',
  },
  detailStatusBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#B45309',
  },
  detailStatusCompletedText: {
    color: '#15803D',
  },
  detailInfoBoxGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailInfoLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#475569',
  },
  detailInfoValue: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 12.5,
    color: '#0F172A',
  },
  detailActionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  detailToggleCompleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailToggleCompletedActive: {
    backgroundColor: '#DCFCE7',
  },
  detailToggleCompleteText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailDeleteBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13.5,
    color: '#EF4444',
  },

  // Verification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalBody: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 12,
  },
  modalPrimaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  modalPrimaryBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  modalSecondaryBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#64748B',
  },
});

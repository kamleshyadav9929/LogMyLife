import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Task, TaskCategory, UserCategory } from '../../types';
import { ThemeConfig, getCategoryColor, getCategoryLightBg, getCategoryTextColor } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import { BottomSheet } from '../common/BottomSheet';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  X,
  Clock,
  Check,
  CheckCircle2,
  Trash2,
  Flame,
  CheckSquare,
  AlertCircle,
  Play
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
  if (normalized === 0) return '12:00 AM';
  if (normalized === 12) return '12:00 PM';
  if (normalized > 12) return `${normalized - 12}:00 PM`;
  return `${normalized}:00 AM`;
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
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleSubTab, setScheduleSubTab] = useState<'all' | 'upcoming' | 'completed' | 'missed'>('all');

  // Add Event Sheet State
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [clickedSlotHour, setClickedSlotHour] = useState<number>(9);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<TaskCategory>(categories[0]?.id || 'Personal');
  const [startTimeStr, setStartTimeStr] = useState('09:00 AM');
  const [endTimeStr, setEndTimeStr] = useState('10:00 AM');

  // Task Verification Modal State
  const [verifyingTask, setVerifyingTask] = useState<Task | null>(null);
  const [verificationReason, setVerificationReason] = useState<'timer_required' | 'out_of_time' | null>(null);

  const [nowTime, setNowTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const selectedDateStr = getLocalDateStr(selectedDate);
  const isSelectedToday = selectedDateStr === getLocalDateStr(new Date());

  // Filter tasks for selected date
  const dayTasks = (tasks || []).filter(t => t.dateStr === selectedDateStr);

  // Compute 7-day carousel around selected date
  const getCarouselDates = (): Date[] => {
    const list: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  };
  const carouselDates = getCarouselDates();

  // Counts for sub-tabs
  const currentHourDec = nowTime.getHours() + nowTime.getMinutes() / 60;
  const todayStr = getLocalDateStr(nowTime);
  const isPastDate = selectedDateStr < todayStr;
  const isFutureDate = selectedDateStr > todayStr;

  const countAll = dayTasks.length;
  const countCompleted = dayTasks.filter(t => t.completed).length;

  const countUpcoming = dayTasks.filter(t => {
    if (t.completed) return false;
    if (isFutureDate) return true;
    if (isPastDate) return false;
    const startDec = parseTimeToDecimalHour(t.startTime);
    const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
    return endDec > currentHourDec;
  }).length;

  const countMissed = dayTasks.filter(t => {
    if (t.completed) return false;
    if (isPastDate) return true;
    if (isFutureDate) return false;
    const startDec = parseTimeToDecimalHour(t.startTime);
    const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
    return endDec <= currentHourDec;
  }).length;

  // Filtered tasks according to subtab
  const getFilteredTasks = (): Task[] => {
    let list = [...dayTasks];
    if (scheduleSubTab === 'completed') {
      list = list.filter(t => t.completed);
    } else if (scheduleSubTab === 'upcoming') {
      list = list.filter(t => {
        if (t.completed) return false;
        if (isFutureDate) return true;
        if (isPastDate) return false;
        const startDec = parseTimeToDecimalHour(t.startTime);
        const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
        return endDec > currentHourDec;
      });
    } else if (scheduleSubTab === 'missed') {
      list = list.filter(t => {
        if (t.completed) return false;
        if (isPastDate) return true;
        if (isFutureDate) return false;
        const startDec = parseTimeToDecimalHour(t.startTime);
        const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
        return endDec <= currentHourDec;
      });
    }

    // Sort chronologically by start time
    return list.sort((a, b) => parseTimeToDecimalHour(a.startTime) - parseTimeToDecimalHour(b.startTime));
  };

  const filteredTasks = getFilteredTasks();

  const handlePrevDay = () => {
    triggerHaptic.lightImpact();
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    triggerHaptic.lightImpact();
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

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

  const handleTodayClick = () => {
    triggerHaptic.mediumImpact();
    setSelectedDate(new Date());
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

    const startDec = parseTimeToDecimalHour(task.startTime);
    const endDec = startDec + Math.max(0.5, (task.durationMins || 60) / 60);
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    if (isToday && (currentHourDec < startDec || currentHourDec > endDec)) {
      setVerifyingTask(task);
      setVerificationReason('out_of_time');
      return;
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
      {/* 1. Header Navigation Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Daily Planner</Text>
          <Text style={styles.headerSubtitle}>
            {viewMode === 'day' ? 'Daily Schedule & Tasks' : 'Monthly Overview'}
          </Text>
        </View>

        <View style={styles.headerRightRow}>
          {/* Day / Month Segment Switcher */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentedPill, viewMode === 'day' && styles.segmentedPillActive]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setViewMode('day');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentedPillText, viewMode === 'day' && styles.segmentedPillTextActive]}>
                Day
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentedPill, viewMode === 'month' && styles.segmentedPillActive]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setViewMode('month');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentedPillText, viewMode === 'month' && styles.segmentedPillTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Soft Blue + Add Task Button */}
          <TouchableOpacity
            style={styles.softAddTaskBtn}
            onPress={onAddTask}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#2563EB" />
            <Text style={styles.softAddTaskBtnText}>Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DAY VIEW */}
      {viewMode === 'day' && (
        <ScrollView style={styles.dayViewScroll} showsVerticalScrollIndicator={false}>
          {/* Date Selector Navigation Bar */}
          <View style={styles.dateNavRow}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevDay} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateDisplayPill}
              onPress={() => setViewMode('month')}
              activeOpacity={0.8}
            >
              <Calendar size={16} color="#2563EB" />
              <Text style={styles.dateDisplayText}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextDay} activeOpacity={0.7}>
              <ChevronRight size={20} color="#0F172A" />
            </TouchableOpacity>

            {!isSelectedToday && (
              <TouchableOpacity style={styles.todayPillBtn} onPress={handleTodayClick} activeOpacity={0.8}>
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 7-Day Date Carousel */}
          <View style={styles.carouselContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
              {carouselDates.map((dObj, idx) => {
                const dStr = getLocalDateStr(dObj);
                const isSelected = dStr === selectedDateStr;
                const isToday = dStr === todayStr;
                const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dObj.getDate();
                const dTasks = (tasks || []).filter(t => t.dateStr === dStr);
                const hasDone = dTasks.some(t => t.completed);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.carouselCard,
                      isSelected && styles.carouselCardActive,
                      isToday && !isSelected && styles.carouselCardToday,
                    ]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setSelectedDate(dObj);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.carouselDayName, isSelected && styles.carouselTextActive]}>
                      {dayName}
                    </Text>
                    <Text style={[styles.carouselDayNum, isSelected && styles.carouselTextActive, isToday && !isSelected && styles.carouselDayNumToday]}>
                      {dayNum}
                    </Text>

                    {hasDone ? (
                      <View style={styles.carouselDoneDot} />
                    ) : dTasks.length > 0 ? (
                      <View style={styles.carouselPendingDot} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Schedule Sub-Tabs Filter */}
          <View style={styles.subTabRow}>
            {[
              { id: 'all', label: 'All', count: countAll },
              { id: 'upcoming', label: 'Upcoming', count: countUpcoming },
              { id: 'completed', label: 'Done', count: countCompleted },
              { id: 'missed', label: 'Missed', count: countMissed },
            ].map(tabItem => {
              const isActive = scheduleSubTab === tabItem.id;
              return (
                <TouchableOpacity
                  key={tabItem.id}
                  style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setScheduleSubTab(tabItem.id as any);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                    {tabItem.label}
                  </Text>
                  <View style={[styles.subTabBadge, isActive ? styles.subTabBadgeActive : styles.subTabBadgeInactive]}>
                    <Text style={[styles.subTabBadgeText, isActive ? styles.subTabBadgeTextActive : styles.subTabBadgeTextInactive]}>
                      {tabItem.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tasks List */}
          <View style={styles.taskListContainer}>
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <CheckSquare size={36} color="#94A3B8" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyStateTitle}>No Tasks Scheduled</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {scheduleSubTab === 'all'
                    ? 'No tasks created for this date. Tap + Task to add your first item!'
                    : `No ${scheduleSubTab} tasks found for this date.`}
                </Text>
                <TouchableOpacity style={styles.emptyStateBtn} onPress={onAddTask} activeOpacity={0.85}>
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.emptyStateBtnText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredTasks.map(task => {
                const catStyle = getCatStyle(categories, task.category);

                return (
                  <View key={task.id} style={styles.taskCard}>
                    {/* Category color bar accent */}
                    <View style={[styles.categoryBarAccent, { backgroundColor: catStyle.bar }]} />

                    {/* Task Content */}
                    <View style={styles.taskCardBody}>
                      <View style={styles.taskCardHeader}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          style={[
                            styles.checkboxBtn,
                            task.completed && { backgroundColor: catStyle.bar, borderColor: catStyle.bar },
                          ]}
                          onPress={() => handleAttemptComplete(task)}
                          activeOpacity={0.8}
                        >
                          {task.completed && <Check size={14} color="#FFFFFF" />}
                        </TouchableOpacity>

                        {/* Title & Category Pill */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={styles.titleCatRow}>
                            <Text
                              style={[
                                styles.taskTitleText,
                                task.completed && styles.taskCompletedStrike,
                              ]}
                              numberOfLines={2}
                            >
                              {task.title}
                            </Text>
                            <View style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}>
                              <Text style={[styles.categoryPillText, { color: catStyle.text }]}>
                                {task.category}
                              </Text>
                            </View>
                          </View>

                          {/* Time & Meta info */}
                          <View style={styles.taskMetaRow}>
                            <Clock size={12} color="#64748B" />
                            <Text style={styles.taskMetaText}>
                              {task.startTime || 'Scheduled'} {task.endTime ? `- ${task.endTime}` : ''} ({task.durationMins || 60}m)
                            </Text>

                            {task.requiresTimer && (
                              <View style={styles.timerBadge}>
                                <Clock size={10} color="#2563EB" />
                                <Text style={styles.timerBadgeText}>Timer Required</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Card Actions Footer */}
                      <View style={styles.taskCardFooter}>
                        {task.requiresTimer && onStartTaskTimer && !task.completed && (
                          <TouchableOpacity
                            style={styles.startTimerBtn}
                            onPress={() => {
                              triggerHaptic.lightImpact();
                              onStartTaskTimer(task);
                            }}
                            activeOpacity={0.8}
                          >
                            <Play size={12} color="#2563EB" />
                            <Text style={styles.startTimerBtnText}>Start Pomodoro</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.deleteTaskBtn}
                          onPress={() => handleDeleteTask(task.id)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={15} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* 3. MONTH OVERVIEW CALENDAR VIEW */}
      {viewMode === 'month' && (
        <ScrollView style={styles.monthViewContainer} showsVerticalScrollIndicator={false}>
          {/* Month Navigation */}
          <View style={styles.monthNavHeader}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.monthNavTitle}>{monthYearHeader}</Text>

            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth} activeOpacity={0.7}>
              <ChevronRight size={20} color="#0F172A" />
            </TouchableOpacity>

            {!isSelectedToday && (
              <TouchableOpacity style={styles.todayPillBtn} onPress={handleTodayClick} activeOpacity={0.8}>
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayHeaderRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Month Grid */}
          <View style={styles.monthGridContainer}>
            {monthGridDays.map((item, idx) => {
              const dateStr = getLocalDateStr(item.dateObj);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;

              const dayTasks = (tasks || []).filter(t => t.dateStr === dateStr);
              const completedCount = dayTasks.filter(t => t.completed).length;
              const isDone = completedCount > 0;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.monthGridCell,
                    isDone && styles.monthGridCellDone,
                    isToday && styles.monthGridCellToday,
                    isSelected && !isToday && styles.monthGridCellSelected,
                  ]}
                  onPress={() => {
                    triggerHaptic.mediumImpact();
                    setSelectedDate(item.dateObj);
                    setViewMode('day');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthCellDateText,
                      !item.isCurrentMonth && styles.monthCellDateDim,
                      isToday && styles.monthCellDateToday,
                    ]}
                  >
                    {item.dateNum}
                  </Text>

                  {isDone ? (
                    <View style={styles.monthDoneBadge}>
                      <Flame size={10} color="#92400E" />
                      <Text style={styles.monthDoneBadgeText}>{completedCount}</Text>
                    </View>
                  ) : isToday ? (
                    <View style={styles.todayDotIndicator} />
                  ) : dayTasks.length > 0 ? (
                    <View style={styles.pendingDotIndicator} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  segmentedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  segmentedPillActive: {
    backgroundColor: '#EFF6FF',
  },
  segmentedPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  segmentedPillTextActive: {
    color: '#1A73E8',
  },
  softAddTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  softAddTaskBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#2563EB',
  },
  dayViewScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateDisplayPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateDisplayText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
  },
  todayPillBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  todayPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#2563EB',
  },
  carouselContainer: {
    marginBottom: 16,
  },
  carouselContent: {
    gap: 8,
    paddingRight: 16,
  },
  carouselCard: {
    width: 58,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  carouselCardToday: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  carouselDayName: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  carouselDayNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    marginTop: 2,
  },
  carouselDayNumToday: {
    color: '#2563EB',
  },
  carouselTextActive: {
    color: '#FFFFFF',
  },
  carouselDoneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  carouselPendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTabPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  subTabLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  subTabLabelActive: {
    color: '#2563EB',
  },
  subTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subTabBadgeActive: {
    backgroundColor: '#2563EB',
  },
  subTabBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  subTabBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
  },
  subTabBadgeTextActive: {
    color: '#FFFFFF',
  },
  subTabBadgeTextInactive: {
    color: '#64748B',
  },
  taskListContainer: {
    paddingBottom: 40,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyStateTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
  },
  emptyStateSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryBarAccent: {
    width: 6,
  },
  taskCardBody: {
    flex: 1,
    padding: 14,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitleText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 15,
    color: '#0F172A',
    flex: 1,
  },
  taskCompletedStrike: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  taskMetaText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  timerBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#2563EB',
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  startTimerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startTimerBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#2563EB',
  },
  deleteTaskBtn: {
    padding: 6,
    marginLeft: 'auto',
  },
  monthViewContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  monthNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
    width: '14.28%',
    textAlign: 'center',
  },
  monthGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginBottom: 40,
  },
  monthGridCell: {
    width: '14.28%',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  monthGridCellDone: {
    backgroundColor: '#FEF3C7',
  },
  monthGridCellToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  monthGridCellSelected: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  monthCellDateText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#334155',
  },
  monthCellDateDim: {
    color: '#CBD5E1',
  },
  monthCellDateToday: {
    color: '#1D4ED8',
  },
  monthDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  monthDoneBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#92400E',
  },
  todayDotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
    marginTop: 4,
  },
  pendingDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
    marginBottom: 6,
  },
  modalBody: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  modalPrimaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryBtnText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryBtnText: {
    fontFamily: FONTS.groteskMedium,
    color: '#64748B',
    fontSize: 12,
  },
});

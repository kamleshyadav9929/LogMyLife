import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Task, JournalEntry, UserGamification, UserCategory } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { calculateMultiFactorStreak } from '../../services/streakEngine';
import { ChevronLeft, ChevronRight, ArrowLeft, Flame, Trophy, CheckCircle2 } from 'lucide-react-native';

interface Props {
  theme: ThemeConfig;
  tasks: Task[];
  journalEntries: JournalEntry[];
  gamification: UserGamification;
  categories?: UserCategory[];
  onBackToDashboard: () => void;
  onNavigateTab?: (tab: 'planner' | 'settings' | 'ai' | 'journal') => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const StreakCalendarView: React.FC<Props> = ({
  theme,
  tasks,
  journalEntries,
  gamification,
  categories = [],
  onBackToDashboard,
  onNavigateTab,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ dateStr: string; tasksCount: number; journalCount: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    triggerHaptic.lightImpact();
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDetails(null);
  };

  const handleNextMonth = () => {
    triggerHaptic.lightImpact();
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDetails(null);
  };

  const handleToday = () => {
    triggerHaptic.lightImpact();
    setCurrentDate(new Date());
    setSelectedDayDetails(null);
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  let activeMonthDaysCount = 0;
  const daysGrid: any[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push({ type: 'empty', id: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    const completedTasksCount = tasks.filter(t => t.completed && t.dateStr === dateStr).length;
    const hasJournal = journalEntries.some(j => j.dateStr === dateStr);
    const isDone = completedTasksCount > 0 || hasJournal;

    if (isDone) activeMonthDaysCount++;

    const isToday = dateStr === todayStr;

    daysGrid.push({
      type: 'day',
      id: dateStr,
      dayNumber: day,
      dateStr,
      isDone,
      isToday,
      completedTasksCount,
      journalCount: hasJournal ? 1 : 0,
      isFuture: new Date(dateStr) > new Date(todayStr),
    });
  }

  // Real continuous streak & longest streak calculation
  const streakMetrics = calculateMultiFactorStreak(
    tasks,
    journalEntries,
    [],
    [],
    categories
  );

  const currentStreak = streakMetrics.currentStreak;
  const longestStreak = streakMetrics.longestStreak;

  return (
    <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtnIconOnly}
          onPress={() => {
            triggerHaptic.lightImpact();
            onBackToDashboard();
          }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Flame size={20} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={styles.titleText}>Streak & Activity</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Summary Metric Cards (ONLY Current Streak & Longest Streak) */}
      <View style={styles.statsBannerRow}>
        <View style={styles.statCardItem}>
          <Flame size={20} color="#F59E0B" />
          <Text style={styles.statCardVal}>{currentStreak} Days</Text>
          <Text style={styles.statCardLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCardItem}>
          <Trophy size={20} color="#F59E0B" />
          <Text style={styles.statCardVal}>{longestStreak} Days</Text>
          <Text style={styles.statCardLabel}>Longest Streak</Text>
        </View>
      </View>

      {/* Month Navigation Row (No outer box covering month name, No today badge) */}
      <View style={styles.monthNavigationHeader}>
        <TouchableOpacity
          style={styles.googleArrowBtn}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.monthTitleText}>
          {MONTH_NAMES[month]} {year}
        </Text>

        <TouchableOpacity
          style={styles.googleArrowBtn}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.weekDaysHeaderRow}>
        {DAY_LABELS.map((dayLabel, idx) => (
          <Text key={idx} style={styles.weekDayLabel}>
            {dayLabel}
          </Text>
        ))}
      </View>

      {/* Full Month Calendar Grid (design.md Pattern 4.D) */}
      <View style={styles.calendarGrid}>
        {daysGrid.map((item) => {
          if (item.type === 'empty') {
            return <View key={item.id} style={styles.calendarCellEmpty} />;
          }

          const isSelected = selectedDayDetails?.dateStr === item.dateStr;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.calendarCell,
                item.isDone && styles.calendarCellDone,
                item.isToday && styles.calendarCellToday,
                isSelected && styles.calendarCellSelected,
              ]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setSelectedDayDetails({
                  dateStr: item.dateStr!,
                  tasksCount: item.completedTasksCount || 0,
                  journalCount: item.journalCount || 0,
                });
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  item.isDone && styles.dayNumberTextDone,
                  item.isToday && styles.dayNumberTextToday,
                  item.isFuture && styles.dayNumberTextFuture,
                ]}
              >
                {item.dayNumber}
              </Text>

              {item.isDone ? (
                <Flame size={12} color="#92400E" style={{ marginTop: 2 }} />
              ) : item.isToday ? (
                <View style={styles.todayDot} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Inspection Activity Card (design.md Pattern 4.E) */}
      {selectedDayDetails && (
        <View style={styles.dayDetailsCard}>
          <View style={styles.dayDetailsHeader}>
            <CheckCircle2 size={16} color={selectedDayDetails.tasksCount > 0 || selectedDayDetails.journalCount > 0 ? '#10B981' : '#64748B'} />
            <Text style={styles.dayDetailsTitle}>
              Activity for {selectedDayDetails.dateStr}
            </Text>
          </View>

          {selectedDayDetails.tasksCount === 0 && selectedDayDetails.journalCount === 0 ? (
            <Text style={styles.dayDetailsBody}>No tasks or journal reflections completed on this date.</Text>
          ) : (
            <View style={{ gap: 4 }}>
              {selectedDayDetails.tasksCount > 0 && (
                <Text style={styles.dayDetailsBody}>
                  ✓ Completed {selectedDayDetails.tasksCount} task(s)
                </Text>
              )}
              {selectedDayDetails.journalCount > 0 && (
                <Text style={styles.dayDetailsBody}>
                  📓 Saved daily reflection log
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtnIconOnly: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  backBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  statsBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCardItem: {
    flex: 1,
    backgroundColor: '#F3F7FF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  statCardVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    marginTop: 6,
  },
  statCardLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Month Navigation Header (Clean unboxed month title, arrow buttons on sides)
  monthNavigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 16,
  },
  googleArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  monthTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
  },

  // Calendar Grid
  weekDaysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekDayLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 8,
  },
  calendarCellEmpty: {
    width: '14.28%',
    height: 52,
  },
  calendarCell: {
    width: '14.28%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  calendarCellDone: {
    backgroundColor: '#FEF3C7',
  },
  calendarCellToday: {
    backgroundColor: '#EEF4FF',
  },
  calendarCellSelected: {
    backgroundColor: '#FAF5FF',
    shadowOpacity: 0,
    elevation: 0,
  },
  dayNumberText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#334155',
  },
  dayNumberTextDone: {
    color: '#92400E',
  },
  dayNumberTextToday: {
    color: '#1D4ED8',
  },
  dayNumberTextFuture: {
    color: '#CBD5E1',
  },
  cellStreakIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
    marginTop: 4,
  },

  // Day Details Card
  dayDetailsCard: {
    backgroundColor: '#F3F7FF',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    shadowOpacity: 0,
    elevation: 0,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dayDetailsTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
  },
  dayDetailsBody: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#475569',
  },
});

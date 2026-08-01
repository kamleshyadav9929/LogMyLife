import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Task, JournalEntry, UserGamification } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { BottomSheet } from './BottomSheet';
import { ChevronLeft, ChevronRight, X, Flame, Calendar as CalendarIcon, CheckCircle2, Award } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  tasks: Task[];
  journalEntries: JournalEntry[];
  gamification: UserGamification;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const StreakCalendarModal: React.FC<Props> = ({
  visible,
  onClose,
  theme,
  tasks,
  journalEntries,
  gamification,
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

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate real active days in this month
  let activeMonthDaysCount = 0;
  const daysGrid: any[] = [];

  // Padding cells before day 1
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

  // Real current streak calculation from continuous past days
  const calculateRealStreak = () => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasCompleted = tasks.some(t => t.completed && t.dateStr === dateStr) || journalEntries.some(j => j.dateStr === dateStr);

      if (hasCompleted) {
        streak++;
      } else if (i > 0) {
        // If today hasn't been completed yet, check yesterday before breaking streak
        break;
      }
    }
    return streak;
  };

  const realStreakDays = calculateRealStreak();

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['88%', '95%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollPadding}
          scrollEnabled={scrollEnabled}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Flame size={22} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.titleText}>Streak & Activity Calendar</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBannerRow}>
            <View style={styles.statCardItem}>
              <Flame size={18} color="#F59E0B" />
              <Text style={styles.statCardVal}>{realStreakDays} Days</Text>
              <Text style={styles.statCardLabel}>Current Streak</Text>
            </View>

            <View style={styles.statCardItem}>
              <CalendarIcon size={18} color="#2563EB" />
              <Text style={styles.statCardVal}>{activeMonthDaysCount} / {daysInMonth}</Text>
              <Text style={styles.statCardLabel}>Active in {MONTH_NAMES[month].slice(0, 3)}</Text>
            </View>

            <View style={styles.statCardItem}>
              <Award size={18} color="#10B981" />
              <Text style={styles.statCardVal}>Lvl {gamification.level}</Text>
              <Text style={styles.statCardLabel}>{gamification.xp} XP Earned</Text>
            </View>
          </View>

          {/* Google Material Style Month Navigation Bar */}
          <View style={styles.monthNavigationHeader}>
            <TouchableOpacity
              style={styles.googleArrowBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.monthTitleWrapper}>
              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity style={styles.todayPillBtn} onPress={handleToday}>
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            </View>

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

          {/* Full Month Calendar Grid */}
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

          {/* Day Inspection Card */}
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
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  closeBtn: {
    padding: 4,
  },
  statsBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCardItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCardVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 6,
  },
  statCardLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Google Material Style Month Navigation
  monthNavigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },
  googleArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthTitleText: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
  },
  todayPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  todayPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#2563EB',
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
    borderRadius: 12,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  calendarCellDone: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  calendarCellToday: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  calendarCellSelected: {
    borderWidth: 2,
    borderColor: '#7C3AED',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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

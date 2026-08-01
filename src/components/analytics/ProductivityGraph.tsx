import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../theme/typography';
import { Task, JournalEntry } from '../../types';

interface GraphDataPoint {
  label: string;
  score: number;
  dateStr: string;
}

interface Props {
  tasks?: Task[];
  journalEntries?: JournalEntry[];
}

export const ProductivityGraph: React.FC<Props> = ({ tasks = [], journalEntries = [] }) => {
  // Generate real 7-day data ending today
  const getWeekData = (): GraphDataPoint[] => {
    const days: GraphDataPoint[] = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayLabels[d.getDay()];
      const monthDayStr = `${monthLabels[d.getMonth()]} ${d.getDate()}`;

      const dayTasks = tasks.filter(t => t.dateStr === dateStr);
      const dayJournal = journalEntries.filter(j => j.dateStr === dateStr);

      let score = 0;
      if (dayTasks.length > 0) {
        const completed = dayTasks.filter(t => t.completed).length;
        const ratio = completed / dayTasks.length;
        score = Math.round(ratio * 80 + (dayJournal.length > 0 ? 20 : 0));
      } else if (dayJournal.length > 0) {
        score = 40;
      }

      days.push({
        label: dayName,
        score,
        dateStr: monthDayStr,
      });
    }

    return days;
  };

  const weekData = getWeekData();
  const totalScore = weekData.reduce((acc, curr) => acc + curr.score, 0);
  const avgScore = Math.round(totalScore / weekData.length);
  const maxScore = Math.max(...weekData.map(d => d.score), 1);

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Productivity Graph</Text>
          <Text style={styles.cardSubtitle}>7-day performance breakdown</Text>
        </View>

        <View style={styles.avgBadge}>
          <Text style={styles.avgBadgeLabel}>Avg Score</Text>
          <Text style={styles.avgBadgeValue}>{avgScore} pts</Text>
        </View>
      </View>

      {/* Modern Vertical Pill Bar Chart */}
      <View style={styles.barsContainer}>
        {weekData.map((item, idx) => {
          const isPeak = item.score > 0 && item.score === maxScore;
          const fillPct = item.score > 0 ? Math.max(12, item.score) : 6;

          let barBg = '#2563EB'; // Royal Blue
          if (isPeak) barBg = '#7C3AED'; // Violet Peak
          else if (item.score >= 75) barBg = '#10B981'; // Emerald

          return (
            <View key={idx} style={styles.barCol}>
              {/* Score Floating Pill */}
              <View style={[styles.scoreBadge, isPeak && styles.scoreBadgePeak]}>
                <Text style={[styles.scoreBadgeText, isPeak && styles.scoreBadgeTextPeak]}>
                  {item.score > 0 ? item.score : '-'}
                </Text>
              </View>

              {/* Vertical Track & Filled Bar */}
              <View style={styles.trackBar}>
                <View
                  style={[
                    styles.fillBar,
                    {
                      height: `${fillPct}%`,
                      backgroundColor: item.score > 0 ? barBg : '#CBD5E1',
                    },
                    isPeak && styles.fillBarPeak,
                  ]}
                />
              </View>

              {/* Day Label Pill */}
              <View style={[styles.dayLabelBox, isPeak && styles.dayLabelBoxPeak]}>
                <Text style={[styles.dayLabelText, isPeak && styles.dayLabelTextPeak]}>
                  {item.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  avgBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  avgBadgeLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 9,
    color: '#2563EB',
  },
  avgBadgeValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: '#1E40AF',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 165,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  scoreBadgePeak: {
    backgroundColor: '#FAF5FF',
  },
  scoreBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
  },
  scoreBadgeTextPeak: {
    color: '#7C3AED',
  },
  trackBar: {
    width: 24,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fillBar: {
    width: '100%',
    borderRadius: 12,
  },
  fillBarPeak: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dayLabelBox: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  dayLabelBoxPeak: {
    backgroundColor: '#EFF6FF',
  },
  dayLabelText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  dayLabelTextPeak: {
    fontFamily: FONTS.groteskBold,
    color: '#2563EB',
  },
});

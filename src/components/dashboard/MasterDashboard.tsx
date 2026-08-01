import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, TextInput } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { UserProfile, Task, TimetableSlot, SubjectProgress, JournalEntry, AISyncResult, UserGamification, UserCategory } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { PlannerEmptyIllustration } from '../common/EmptyStateIllustrations';
import {
  Sparkles,
  Clock,
  Plus,
  Search,
  Check,
  ChevronRight,
  ListTodo,
  Mic,
  X,
  Tag,
  Flame,
} from 'lucide-react-native';

const MONO_FONT = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

interface Props {
  profile: UserProfile;
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectProgress[];
  journalEntries: JournalEntry[];
  aiSyncResults: AISyncResult[];
  gamification: UserGamification;
  categories: UserCategory[];
  theme: ThemeConfig;
  onNavigateTab: (tab: 'planner' | 'academic' | 'ai' | 'journal') => void;
  onOpenAddTask: () => void;
  onOpenPomodoro: () => void;
  onOpenSearch: () => void;
  onOpenLogModal: () => void;
  onOpenEditProfile?: () => void;
  onOpenAchievements?: () => void;
  onOpenStreakModal?: () => void;
  onOpenCategoryManager?: () => void;
  onQuickCompleteTask?: (taskId: string) => void;
}

export const MasterDashboard: React.FC<Props> = ({
  profile,
  tasks,
  timetable,
  syllabus,
  journalEntries,
  aiSyncResults,
  gamification,
  categories,
  theme,
  onNavigateTab,
  onOpenAddTask,
  onOpenPomodoro,
  onOpenSearch,
  onOpenLogModal,
  onOpenEditProfile,
  onOpenAchievements,
  onOpenStreakModal,
  onOpenCategoryManager,
  onQuickCompleteTask,
}) => {
  const [analyticsFilter, setAnalyticsFilter] = useState<'day' | 'week' | 'month'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardScheduleTab, setDashboardScheduleTab] = useState<'upcoming' | 'missed' | 'completed'>('upcoming');

  // Inline Search Results logic
  const searchResults: { id: string; type: string; title: string; subtitle: string; category?: string }[] = [];
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();

    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)) {
        searchResults.push({
          id: t.id,
          type: 'Task',
          title: t.title,
          subtitle: `${t.startTime || 'Today'} • ${t.category}`,
          category: t.category,
        });
      }
    });

    timetable.forEach((slot) => {
      if (slot.subject.toLowerCase().includes(q) || slot.code.toLowerCase().includes(q) || slot.instructor.toLowerCase().includes(q)) {
        searchResults.push({
          id: slot.id,
          type: 'Class',
          title: slot.subject,
          subtitle: `${slot.code} | ${slot.timeStr} (${slot.room})`,
          category: slot.category,
        });
      }
    });

    syllabus.forEach((subject) => {
      subject.topicsList.forEach((t, idx) => {
        if (t.title.toLowerCase().includes(q) || subject.subject.toLowerCase().includes(q)) {
          searchResults.push({
            id: `${subject.id}-${idx}`,
            type: 'Syllabus',
            title: t.title,
            subtitle: `${subject.subject} • ${t.completed ? 'Completed' : 'Pending'}`,
            category: subject.category,
          });
        }
      });
    });

    journalEntries.forEach((entry) => {
      if (entry.reflections.toLowerCase().includes(q)) {
        searchResults.push({
          id: entry.id,
          type: 'Journal',
          title: entry.reflections.slice(0, 50) + '...',
          subtitle: `Journal Log • ${entry.dateStr}`,
        });
      }
    });
  }

  // Name extraction (e.g. Rao / Ashok)
  const displayName = profile.name.split(' ').length > 1 ? profile.name.split(' ').slice(-1)[0] : profile.name;

  // 7-day streak calculation strictly derived from real completed tasks and journal entries
  const getPastSevenDays = () => {
    const days = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayLabels[d.getDay()];

      const hasCompletedTask = tasks.some(t => t.completed && t.dateStr === dateStr);
      const hasJournalEntry = journalEntries.some(j => j.dateStr === dateStr);
      const isDone = hasCompletedTask || hasJournalEntry;

      days.push({
        dayName,
        dateStr,
        isDone,
        isToday: i === 0,
      });
    }
    return days;
  };

  const streakDaysData = getPastSevenDays();

  // Analytics Calculations based on Day, Week, Month
  const getAnalyticsData = () => {
    let multiplier = 1;
    if (analyticsFilter === 'week') multiplier = 5.5;
    if (analyticsFilter === 'month') multiplier = 22;

    const dsaMins = Math.round(tasks.filter(t => t.category === 'DSA' && t.completed).reduce((acc, t) => acc + (t.durationMins || 60), 0) * multiplier);
    const collegeMins = Math.round(tasks.filter(t => t.category === 'College' && t.completed).reduce((acc, t) => acc + (t.durationMins || 60), 0) * multiplier);
    const docMins = Math.round(tasks.filter(t => t.category === 'Documentary' && t.completed).reduce((acc, t) => acc + (t.durationMins || 60), 0) * multiplier);
    const personalMins = Math.round(tasks.filter(t => t.category === 'Personal' && t.completed).reduce((acc, t) => acc + (t.durationMins || 60), 0) * multiplier);

    const baseData = [
      { name: 'College', mins: collegeMins, color: '#2563EB' },
      { name: 'DSA / Study', mins: dsaMins, color: '#7C3AED' },
      { name: 'Documentary', mins: docMins, color: '#D97706' },
      { name: 'Personal', mins: personalMins, color: '#10B981' },
    ];

    const totalMins = baseData.reduce((acc, curr) => acc + curr.mins, 0);

    const categoriesWithPct = baseData.map(c => ({
      ...c,
      pct: totalMins > 0 ? Math.round((c.mins / totalMins) * 100) : 0,
      formattedTime: `${Math.floor(c.mins / 60)}h ${c.mins % 60}m`,
    }));

    const totalHours = Math.floor(totalMins / 60);
    const totalRemMins = totalMins % 60;
    const formattedTotalTime = `${totalHours}h ${totalRemMins}m`;

    return {
      categories: categoriesWithPct,
      totalMins,
      formattedTotalTime,
    };
  };

  const analytics = getAnalyticsData();

  // Donut chart SVG math
  const size = 140;
  const strokeWidth = 16;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const donutSegments = analytics.categories.map(cat => {
    const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
    cumulativeAngle += cat.pct;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  function parseTimeToDec(timeStr?: string): number {
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

  const categoryColors: Record<string, string> = {
    DSA: '#7C3AED',
    Study: '#7C3AED',
    College: '#2563EB',
    Work: '#2563EB',
    Documentary: '#D97706',
    Personal: '#10B981',
    Wastage: '#EF4444',
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayDateStr = getTodayDateStr();
  const currentNow = new Date();
  const currentHourDec = currentNow.getHours() + currentNow.getMinutes() / 60;

  const todayTasksList = tasks.filter(t => !t.dateStr || t.dateStr === todayDateStr);

  const upcomingDashboardTasks = todayTasksList.filter(t => {
    if (t.completed) return false;
    const startDec = parseTimeToDec(t.startTime);
    const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
    return endDec > currentHourDec;
  });

  const missedDashboardTasks = todayTasksList.filter(t => {
    if (t.completed) return false;
    const startDec = parseTimeToDec(t.startTime);
    const endDec = startDec + Math.max(0.5, (t.durationMins || 60) / 60);
    return endDec <= currentHourDec;
  });

  const completedDashboardTasks = todayTasksList.filter(t => t.completed);

  const displayDashboardTasks = dashboardScheduleTab === 'upcoming'
    ? upcomingDashboardTasks
    : dashboardScheduleTab === 'missed'
    ? missedDashboardTasks
    : completedDashboardTasks;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Header with Separated Profile Photo & Taller Flat Inline Search Bar */}
      <View style={styles.heroHeaderSection}>
        <View style={styles.headerTopRow}>
          {/* Standalone User Icon / Profile Photo */}
          <TouchableOpacity
            style={styles.profileAvatarStandalone}
            onPress={() => {
              triggerHaptic.lightImpact();
              if (onOpenEditProfile) {
                onOpenEditProfile();
              } else {
                onOpenLogModal();
              }
            }}
            activeOpacity={0.85}
          >
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatarImage} />
            ) : (
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' }}
                style={styles.profileAvatarImage}
              />
            )}
          </TouchableOpacity>

          {/* Category Manager Button */}
          {onOpenCategoryManager && (
            <TouchableOpacity
              style={[styles.profileAvatarStandalone, { backgroundColor: '#EFF6FF', borderWidth: 0 }]}
              onPress={() => {
                triggerHaptic.lightImpact();
                onOpenCategoryManager();
              }}
              activeOpacity={0.85}
            >
              <Tag size={18} color="#2563EB" />
            </TouchableOpacity>
          )}

          {/* Standalone Taller Flat Inline Search Bar (No Outer Borders or Shadows) */}
          <View style={styles.googleSearchBarContainer}>
            <Search size={18} color="#64748B" style={{ marginLeft: 14, marginRight: 8 }} />
            <TextInput
              style={styles.inlineSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tasks, logs..."
              placeholderTextColor="#64748B"
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6, marginRight: 6 }}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <Mic size={18} color="#64748B" style={{ marginRight: 14 }} />
            )}
          </View>
        </View>

        {/* Inline Search Dropdown Box (Opens Right There) */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.inlineSearchResultsCard}>
            <View style={styles.inlineSearchHeader}>
              <Text style={styles.inlineSearchTitle}>Search Results ({searchResults.length})</Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {searchResults.length === 0 ? (
              <Text style={styles.noResultsText}>No items found for "{searchQuery}"</Text>
            ) : (
              searchResults.slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.inlineResultRow}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setSearchQuery('');
                    // Navigate to the relevant tab based on result type
                    if (item.type === 'Task') onNavigateTab('planner');
                    else if (item.type === 'Class') onNavigateTab('academic');
                    else if (item.type === 'Syllabus') onNavigateTab('academic');
                    else if (item.type === 'Journal') onNavigateTab('journal');
                  }}
                >
                  <View style={styles.resultMainInfo}>
                    <Text style={styles.resultItemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.resultItemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.resultTypeBadge}>
                    <Text style={styles.resultTypeBadgeText}>{item.type}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Faint line below search bar */}
        <View style={styles.headerBottomHairline} />
      </View>

      {/* 2. Last 7 Days Streak (Centered Bold Heading with Google Arrow on right to open Month Calendar) */}
      <View style={styles.streakSection}>
        <TouchableOpacity
          style={styles.streakHeaderRowTouchable}
          onPress={() => {
            triggerHaptic.lightImpact();
            if (onOpenStreakModal) onOpenStreakModal();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.streakHeaderSpacer} />
          <Text style={[styles.largeBoldCenteredHeading, { flex: 1 }]}>LAST 7 DAYS STREAK</Text>
          <View style={styles.googleStreakArrowCircle}>
            <ChevronRight size={16} color="#2563EB" />
          </View>
        </TouchableOpacity>

        <View style={styles.streakRow}>
          {streakDaysData.map((item, idx) => (
            <View key={idx} style={styles.streakCol}>
              <Text style={[styles.streakDayLabelAbove, item.isToday && styles.streakDayLabelToday]}>
                {item.dayName}
              </Text>
              <View style={[styles.streakCircle, item.isToday && styles.streakCircleToday]}>
                <Flame size={16} color={item.isDone ? '#F59E0B' : '#94A3B8'} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.dividerHairline} />

      {/* 3. Analytics Section (Centered Bold Heading, Frameless) */}
      <View style={styles.framelessSection}>
        <View style={styles.centeredSectionHeader}>
          <Text style={styles.largeBoldCenteredHeading}>ANALYTICS</Text>

          {/* 3 Chips: Day, Week, Month */}
          <View style={styles.chipsContainerCentered}>
            <TouchableOpacity
              style={[styles.chipButton, analyticsFilter === 'day' && styles.chipActive]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setAnalyticsFilter('day');
              }}
            >
              <Text style={[styles.chipText, analyticsFilter === 'day' && styles.chipTextActive]}>Day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipButton, analyticsFilter === 'week' && styles.chipActive]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setAnalyticsFilter('week');
              }}
            >
              <Text style={[styles.chipText, analyticsFilter === 'week' && styles.chipTextActive]}>Week</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipButton, analyticsFilter === 'month' && styles.chipActive]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setAnalyticsFilter('month');
              }}
            >
              <Text style={[styles.chipText, analyticsFilter === 'month' && styles.chipTextActive]}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Side-by-Side Pie Chart and Category Distribution */}
        <View style={styles.analyticsSideBySideRow}>
          {/* Pie / Donut Chart with Total Time in Center */}
          <View style={styles.chartCenterWrapper}>
            <View style={styles.svgContainer}>
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {donutSegments.map((segment, index) => (
                    <Circle
                      key={index}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={segment.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  ))}
                </G>
              </Svg>

              {/* Total Time Text at Center */}
              <View style={styles.donutCenterOverlay}>
                <Text style={styles.totalTimeCenterVal}>{analytics.formattedTotalTime}</Text>
                <Text style={styles.totalTimeCenterLabel}>TOTAL LOGGED</Text>
              </View>
            </View>
          </View>

          {/* Vertical Categories View (Name + Dot on left, Time on right) */}
          <View style={styles.verticalCategoryList}>
            {analytics.categories.map((cat, idx) => (
              <View key={idx} style={styles.categoryRowItem}>
                <View style={styles.catLeftInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryNameText}>{cat.name}</Text>
                </View>

                <View style={styles.catRightInfo}>
                  <Text style={styles.categoryTimeVal}>{cat.formattedTime}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* View Full Analytics Button (Solid Royal Blue Background) */}
        <TouchableOpacity
          style={styles.actionBtnDistinctBg}
          onPress={() => {
            triggerHaptic.lightImpact();
            onNavigateTab('ai');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnDistinctText}>View Full Analytics</Text>
          <ChevronRight size={15} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.dividerHairline} />

      {/* 4. TODAY'S SCHEDULE (Unified Section with Live Tab Filtering: Upcoming, Missed, Completed) */}
      <View style={styles.framelessSection}>
        <View style={styles.tasksHeaderRow}>
          <Text style={styles.tasksHeaderTitle}>TODAY'S SCHEDULE</Text>
          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={() => {
              triggerHaptic.lightImpact();
              onOpenAddTask();
            }}
          >
            <Plus size={14} color="#0F172A" />
            <Text style={styles.quickAddBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Even Soft Chips in a Single Row (No Count Numbers) */}
        <View style={styles.evenChipsRow}>
          <TouchableOpacity
            style={[
              styles.evenScheduleChip,
              dashboardScheduleTab === 'upcoming' && styles.evenScheduleChipActive,
            ]}
            onPress={() => {
              triggerHaptic.lightImpact();
              setDashboardScheduleTab('upcoming');
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.evenScheduleChipText,
                dashboardScheduleTab === 'upcoming' && styles.evenScheduleChipTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.evenScheduleChip,
              dashboardScheduleTab === 'missed' && styles.evenScheduleChipActive,
              missedDashboardTasks.length > 0 && dashboardScheduleTab !== 'missed' && styles.evenScheduleChipMissedAlert,
            ]}
            onPress={() => {
              triggerHaptic.lightImpact();
              setDashboardScheduleTab('missed');
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.evenScheduleChipText,
                dashboardScheduleTab === 'missed' && styles.evenScheduleChipTextActive,
                missedDashboardTasks.length > 0 && dashboardScheduleTab !== 'missed' && styles.evenScheduleChipTextMissedAlert,
              ]}
            >
              Missed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.evenScheduleChip,
              dashboardScheduleTab === 'completed' && styles.evenScheduleChipActive,
            ]}
            onPress={() => {
              triggerHaptic.lightImpact();
              setDashboardScheduleTab('completed');
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.evenScheduleChipText,
                dashboardScheduleTab === 'completed' && styles.evenScheduleChipTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksListContainer}>
          {displayDashboardTasks.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <PlannerEmptyIllustration size={90} />
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 14, color: '#0F172A', marginTop: 8 }}>
                {dashboardScheduleTab === 'upcoming' && 'No Upcoming Tasks'}
                {dashboardScheduleTab === 'missed' && 'No Missed Tasks'}
                {dashboardScheduleTab === 'completed' && 'No Completed Tasks'}
              </Text>
              <Text style={{ fontFamily: FONTS.groteskMedium, fontSize: 12, color: '#94A3B8', marginTop: 2, textAlign: 'center' }}>
                Tap "+ Add Task" to schedule your day.
              </Text>
            </View>
          ) : (
            displayDashboardTasks.map(task => (
              <View key={task.id} style={styles.taskItemRow}>
                <TouchableOpacity
                  style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}
                  onPress={() => {
                    triggerHaptic.notificationSuccess();
                    if (onQuickCompleteTask) onQuickCompleteTask(task.id);
                  }}
                >
                  {task.completed && <Check size={12} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.taskTextContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    {dashboardScheduleTab === 'missed' && (
                      <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontFamily: FONTS.groteskBold, fontSize: 9, color: '#DC2626' }}>MISSED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.taskMetaText}>
                    {task.startTime || '09:00 AM'} • {task.durationMins || 60} mins ({task.category})
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* View Full Day Planner Button */}
        <TouchableOpacity
          style={styles.actionBtnDistinctBg}
          onPress={() => {
            triggerHaptic.lightImpact();
            onNavigateTab('planner');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnDistinctText}>View Full Day Planner</Text>
          <ChevronRight size={15} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Quick Utility Dock */}
      <View style={styles.quickDockBar}>
        <TouchableOpacity style={styles.dockItemBtn} onPress={onOpenPomodoro}>
          <Clock size={15} color="#0F172A" />
          <Text style={styles.dockItemText}>Pomodoro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dockItemBtn} onPress={onOpenLogModal}>
          <Sparkles size={15} color="#7C3AED" />
          <Text style={styles.dockItemText}>Log Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dockItemBtn} onPress={onOpenSearch}>
          <Search size={15} color="#0F172A" />
          <Text style={styles.dockItemText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockItemBtn}
          onPress={() => {
            triggerHaptic.lightImpact();
            if (onOpenAchievements) onOpenAchievements();
          }}
        >
          <ListTodo size={15} color="#F59E0B" />
          <Text style={styles.dockItemText}>Badges</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    backgroundColor: '#FFFFFF',
  },

  // 1. Hero Header & Separated Flat Taller Search Bar
  heroHeaderSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarStandalone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  googleSearchBarContainer: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 23,
    paddingHorizontal: 2,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  inlineSearchInput: {
    flex: 1,
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    height: '100%',
  },
  inlineSearchResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  inlineSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inlineSearchTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  clearSearchText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#2563EB',
  },
  noResultsText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  inlineResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  resultMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultItemTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  resultItemSubtitle: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  resultTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultTypeBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#334155',
  },
  headerBottomHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 10,
  },

  // Section Headers Centered & Bold & Large
  centeredSectionHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeBoldCenteredHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: '#0F172A',
    letterSpacing: 1.0,
    textAlign: 'center',
  },
  scheduleSubheading: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },

  // 2. Last 7 Days Streak
  streakSection: {
    marginBottom: 16,
  },
  streakHeaderRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  streakHeaderSpacer: {
    width: 28,
  },
  googleStreakArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  streakCol: {
    alignItems: 'center',
  },
  streakDayLabelAbove: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  streakDayLabelToday: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
  },
  streakCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCircleToday: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
  },
  streakEmojiIcon: {
    fontSize: 19,
  },

  dividerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 22,
  },

  // 3. Analytics Section
  framelessSection: {
    marginVertical: 4,
  },
  chipsContainerCentered: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    gap: 4,
    marginTop: 10,
  },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
  chipTextActive: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
  },
  analyticsSideBySideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  chartCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeCenterVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: '#0F172A',
  },
  totalTimeCenterLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 8.5,
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  verticalCategoryList: {
    flex: 1,
    marginLeft: 16,
  },
  categoryRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  catLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryNameText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  catRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTimeVal: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 13,
    color: '#334155',
  },
  actionBtnDistinctBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    backgroundColor: '#F1F5F9',
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  actionBtnDistinctText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#0F172A',
    marginRight: 4,
  },

  // 4. Frameless & Boxless Schedule (Generous Vertical Gap between Time Slots)
  framelessScheduleContainer: {
    marginTop: 8,
  },
  framelessScheduleRowItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  spaciousLeftAccentBar: {
    width: 5,
    height: '100%',
    minHeight: 42,
    borderRadius: 3,
    marginRight: 14,
  },
  spaciousScheduleMain: {
    flex: 1,
  },
  scheduleTimeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  spaciousTimeText: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 12,
    color: '#64748B',
  },
  spaciousCatBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spaciousCatBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
  },
  spaciousTitleText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14.5,
    color: '#0F172A',
    lineHeight: 20,
  },

  // 5. Tasks List
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tasksHeaderTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 0.8,
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickAddBtnText: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    fontSize: 12,
    marginLeft: 4,
  },
  tasksListContainer: {
    marginTop: 4,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskTextContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMetaText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  taskCategoryTag: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
  },

  // Quick Utility Dock
  quickDockBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dockItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dockItemText: {
    fontFamily: FONTS.groteskSemibold,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },

  // 3 Even Soft Schedule Chips Styles
  evenChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  evenScheduleChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evenScheduleChipActive: {
    backgroundColor: '#EFF6FF',
  },
  evenScheduleChipMissedAlert: {
    backgroundColor: '#FEF2F2',
  },
  evenScheduleChipText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  evenScheduleChipTextActive: {
    color: '#1A73E8',
  },
  evenScheduleChipTextMissedAlert: {
    color: '#DC2626',
  },
});

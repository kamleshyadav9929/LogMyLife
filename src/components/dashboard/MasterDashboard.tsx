import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, TextInput } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { UserProfile, Task, TimetableSlot, SubjectProgress, AISyncResult, UserCategory } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { PlannerEmptyIllustration } from '../common/EmptyStateIllustrations';
import { ProductivityMeterGauge } from '../analytics/ProductivityMeterGauge';
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
  Timer,
  PlusCircle,
  ArrowRight,
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
  aiSyncResults: AISyncResult[];
  categories: UserCategory[];
  theme: ThemeConfig;
  onNavigateTab: (tab: 'planner' | 'ai' | 'habits') => void;
  onOpenAddTask: () => void;
  onOpenAddHabit?: () => void;
  onOpenPomodoro: () => void;
  onOpenSearch: () => void;
  onOpenEditProfile?: () => void;
  onOpenStreakModal?: () => void;
  onOpenCategoryManager?: () => void;
  onQuickCompleteTask?: (taskId: string) => void;
}

export const MasterDashboard: React.FC<Props> = ({
  profile,
  tasks,
  timetable,
  syllabus,
  aiSyncResults,
  categories,
  theme,
  onNavigateTab,
  onOpenAddTask,
  onOpenAddHabit,
  onOpenPomodoro,
  onOpenSearch,
  onOpenEditProfile,
  onOpenStreakModal,
  onOpenCategoryManager,
  onQuickCompleteTask,
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
  }

  // Name extraction (e.g. Rao / Ashok)
  const displayName = profile.name.split(' ').length > 1 ? profile.name.split(' ').slice(-1)[0] : profile.name;

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayDateStr = getTodayDateStr();

  // 7-day streak calculation strictly derived from real completed tasks
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
      const isDone = hasCompletedTask;

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

  // Analytics Calculations strictly for Today's Data
  const getAnalyticsData = () => {
    const defaultCatList = [
      { id: 'cat-work', name: 'Work & Projects', color: '#2563EB' },
      { id: 'cat-learning', name: 'Learning & Skills', color: '#7C3AED' },
      { id: 'cat-health', name: 'Health & Fitness', color: '#10B981' },
      { id: 'cat-personal', name: 'Personal & Life', color: '#F59E0B' },
      { id: 'cat-focus', name: 'Focus & Deep Work', color: '#0EA5E9' },
    ];

    const activeCategories = (categories && categories.length > 0)
      ? categories.map(c => ({ id: c.id, name: c.name, color: c.color }))
      : defaultCatList;

    const todayTasks = tasks.filter(t => !t.dateStr || t.dateStr === todayDateStr);

    const baseData = activeCategories.map(cat => {
      const mins = Math.round(
        todayTasks
          .filter(t => t.completed && (
            t.category === cat.id ||
            t.category === cat.name ||
            (cat.name === 'Learning & Skills' && (t.category === 'DSA' || t.category === 'Study')) ||
            (cat.name === 'Work & Projects' && (t.category === 'College' || t.category === 'Work'))
          ))
          .reduce((acc, t) => acc + (t.durationMins || 60), 0)
      );
      return {
        name: cat.name,
        mins,
        color: cat.color,
      };
    });

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

  // Meter SVG math & Productivity score calculation
  const meterSize = 120;
  const strokeWidth = 14;
  const meterCenter = meterSize / 2;
  const meterRadius = meterCenter - strokeWidth;
  const meterCircumference = 2 * Math.PI * meterRadius;

  let cumulativeAngle = 0;
  const donutSegments = analytics.categories.map((cat) => {
    const strokeDasharray = `${(cat.pct / 100) * meterCircumference} ${meterCircumference}`;
    const strokeDashoffset = -((cumulativeAngle / 100) * meterCircumference);
    cumulativeAngle += cat.pct;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const productivityScore =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : analytics.totalMins > 0
      ? 85
      : 75;

  let scoreStatusLabel = 'High Productivity';
  let scoreStatusColor = '#10B981';
  if (productivityScore >= 80) {
    scoreStatusLabel = 'High Productivity';
    scoreStatusColor = '#10B981';
  } else if (productivityScore >= 50) {
    scoreStatusLabel = 'Moderate Focus';
    scoreStatusColor = '#F59E0B';
  } else {
    scoreStatusLabel = 'Needs Focus Push';
    scoreStatusColor = '#EF4444';
  }

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
    'Work & Projects': '#2563EB',
    'Learning & Skills': '#7C3AED',
    'Health & Fitness': '#10B981',
    'Personal & Life': '#F59E0B',
    'Focus & Deep Work': '#0EA5E9',
    Work: '#2563EB',
    Study: '#7C3AED',
    Personal: '#F59E0B',
    Wastage: '#EF4444',
  };

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
          {/* Standalone User Icon / Profile Photo — hide in search mode */}
          {!isSearchFocused && searchQuery.length === 0 && (
            <TouchableOpacity
              style={styles.profileAvatarStandalone}
              onPress={() => {
                triggerHaptic.lightImpact();
                if (onOpenEditProfile) {
                  onOpenEditProfile();
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
          )}

          {/* Standalone Flat Inline Search Bar */}
          <View
            style={[
              styles.googleSearchBarContainer,
              (isSearchFocused || searchQuery.length > 0) && styles.googleSearchBarContainerFocused,
            ]}
          >
            <Search size={18} color={isSearchFocused ? '#0F172A' : '#64748B'} style={{ marginLeft: 14, marginRight: 8 }} />
            <TextInput
              style={styles.inlineSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tasks, logs..."
              placeholderTextColor="#64748B"
              returnKeyType="search"
              onFocus={() => {
                triggerHaptic.lightImpact();
                setIsSearchFocused(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
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

        {/* Faint line below search bar */}
        <View style={styles.headerBottomHairline} />
      </View>

      {/* Screen Background Below Header when Search is Active/Clicked */}
      {(isSearchFocused || searchQuery.trim().length > 0) ? (
        <View style={styles.whiteSearchOverlayContent}>
          <View style={styles.inlineSearchHeader}>
            <Text style={styles.inlineSearchTitle}>
              {searchQuery.trim().length > 0 ? `Search Results (${searchResults.length})` : 'Quick Search'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
            >
              <Text style={styles.clearSearchText}>Close</Text>
            </TouchableOpacity>
          </View>

          {searchQuery.trim().length === 0 ? (
            <View style={styles.quickSearchHintsBox}>
              <Text style={styles.quickSearchHintTitle}>Tap to search categories or tasks:</Text>
              <View style={styles.quickSearchTagsRow}>
                {['Work & Projects', 'Learning & Skills', 'Health & Fitness', 'Personal & Life', 'Focus & Deep Work'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.quickSearchTagPill}
                    onPress={() => setSearchQuery(tag)}
                  >
                    <Text style={styles.quickSearchTagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : searchResults.length === 0 ? (
            <Text style={styles.noResultsText}>No items found for "{searchQuery}"</Text>
          ) : (
            <View style={{ gap: 4 }}>
              {searchResults.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.inlineResultRow}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setSearchQuery('');
                    setIsSearchFocused(false);
                    if (item.type === 'Task') onNavigateTab('planner');
                    else if (item.type === 'Class') onNavigateTab('planner');
                    else if (item.type === 'Syllabus') onNavigateTab('ai');
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
              ))}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* 2. World-Class Quick Tiles Deck (2x2 Grid of Premium Soft-Fill Cards) */}
          <View style={styles.quickTilesDeckContainer}>
            <Text style={styles.quickTilesHeaderTitle}>QUICK ACTIONS</Text>

            <View style={styles.quickTilesGridRow}>
              {/* TILE 1: POMODORO TIMER */}
              <TouchableOpacity
                style={[styles.quickTileCard, { backgroundColor: '#F0FDF4' }]}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  onOpenPomodoro();
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.tileIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Timer size={18} color="#166534" />
                </View>
                <View style={styles.tileTextContent}>
                  <Text style={styles.tileTitleText}>Pomodoro</Text>
                  <Text style={[styles.tileSubText, { color: '#15803D' }]}>Focus Session</Text>
                </View>
              </TouchableOpacity>

              {/* TILE 2: ADD TASK */}
              <TouchableOpacity
                style={[styles.quickTileCard, { backgroundColor: '#EFF6FF' }]}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  onOpenAddTask();
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.tileIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Plus size={18} color="#1E40AF" strokeWidth={2.5} />
                </View>
                <View style={styles.tileTextContent}>
                  <Text style={styles.tileTitleText}>Add Task</Text>
                  <Text style={[styles.tileSubText, { color: '#1D4ED8' }]}>New Schedule</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.quickTilesGridRow}>
              {/* TILE 3: QUICK SEARCH */}
              <TouchableOpacity
                style={[styles.quickTileCard, { backgroundColor: '#F8FAFC' }]}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  onOpenSearch();
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.tileIconCircle, { backgroundColor: '#E2E8F0' }]}>
                  <Search size={18} color="#334155" />
                </View>
                <View style={styles.tileTextContent}>
                  <Text style={styles.tileTitleText}>Search</Text>
                  <Text style={[styles.tileSubText, { color: '#64748B' }]}>Find Logs</Text>
                </View>
              </TouchableOpacity>

              {/* TILE 4: ADD HABIT */}
              <TouchableOpacity
                style={[styles.quickTileCard, { backgroundColor: '#FDF2F8' }]}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  if (onOpenAddHabit) {
                    onOpenAddHabit();
                  } else {
                    onNavigateTab('habits');
                  }
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.tileIconCircle, { backgroundColor: '#FBCFE8' }]}>
                  <PlusCircle size={18} color="#BE185D" />
                </View>
                <View style={styles.tileTextContent}>
                  <Text style={styles.tileTitleText}>Add Habit</Text>
                  <Text style={[styles.tileSubText, { color: '#BE185D' }]}>New Tracker</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerHairline} />

          {/* 3. Analytics Section (Centered Title & Soft Arrow Button, Color Filled Card) */}
          <View style={styles.filledSectionCard}>
            <View style={styles.centeredSectionHeaderRow}>
              <Text style={styles.sectionHeaderTitleCentered}>ANALYTICS</Text>
              <TouchableOpacity
                style={styles.headerArrowBtnSoftPos}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  onNavigateTab('ai');
                }}
                activeOpacity={0.8}
              >
                <ArrowRight size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Side-by-Side: Total Logged Pie Chart on Left, Compact Categories List on Right */}
            <View style={styles.analyticsSideBySideRow}>
              {/* LEFT: Pie / Donut Chart with Total Time in Center */}
              <View style={styles.chartCenterWrapper}>
                <View style={styles.svgContainer}>
                  <Svg width={meterSize} height={meterSize} viewBox={`0 0 ${meterSize} ${meterSize}`}>
                    <G rotation="-90" origin={`${meterCenter}, ${meterCenter}`}>
                      <Circle
                        cx={meterCenter}
                        cy={meterCenter}
                        r={meterRadius}
                        stroke="#E2E8F0"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {donutSegments.map((segment, index) => (
                        <Circle
                          key={index}
                          cx={meterCenter}
                          cy={meterCenter}
                          r={meterRadius}
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

                  <View style={styles.donutCenterOverlayMeter}>
                    <Text style={styles.totalTimeCenterValMeter}>{analytics.formattedTotalTime}</Text>
                    <Text style={styles.totalTimeCenterLabelMeter}>TOTAL LOGGED</Text>
                  </View>
                </View>
              </View>

              {/* RIGHT: Compact Categories & Time List (Unboxed, Small Font, Flat Rows) */}
              <View style={styles.sideCategoryList}>
                {analytics.categories.map((cat, idx) => (
                  <View key={idx} style={styles.sideCategoryRowItem}>
                    <View style={styles.catLeftInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.compactCategoryNameText} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>

                    <View style={styles.catRightInfo}>
                      <Text style={styles.compactCategoryTimeVal}>{cat.formattedTime}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 4. TODAY'S SCHEDULE (Color Filled Card with Soft Buttons & Colored Highlights) */}
          <View style={styles.filledSectionCard}>
            <View style={styles.tasksHeaderRow}>
              <Text style={styles.tasksHeaderTitle}>TODAY'S SCHEDULE</Text>
              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={styles.quickAddBtnSoft}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    onOpenAddTask();
                  }}
                >
                  <Plus size={14} color="#0F172A" />
                  <Text style={styles.quickAddBtnText}>Add Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerArrowBtnSoft}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    onNavigateTab('planner');
                  }}
                  activeOpacity={0.8}
                >
                  <ArrowRight size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3 Even Soft Chips with Distinct Active Color Highlights */}
            <View style={styles.evenChipsRow}>
              <TouchableOpacity
                style={[
                  styles.evenScheduleChip,
                  dashboardScheduleTab === 'upcoming' && styles.evenScheduleChipUpcomingActive,
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
                    dashboardScheduleTab === 'upcoming' && styles.evenScheduleChipUpcomingTextActive,
                  ]}
                >
                  Upcoming
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.evenScheduleChip,
                  dashboardScheduleTab === 'missed' && styles.evenScheduleChipMissedActive,
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
                    dashboardScheduleTab === 'missed' && styles.evenScheduleChipMissedTextActive,
                  ]}
                >
                  Missed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.evenScheduleChip,
                  dashboardScheduleTab === 'completed' && styles.evenScheduleChipCompletedActive,
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
                    dashboardScheduleTab === 'completed' && styles.evenScheduleChipCompletedTextActive,
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
          </View>


        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  googleSearchBarContainerFocused: {
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
    borderColor: 'transparent',
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
  whiteSearchOverlayContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 450,
  },
  quickSearchHintsBox: {
    paddingVertical: 12,
  },
  quickSearchHintTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  quickSearchTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSearchTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickSearchTagText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#0F172A',
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
  streakCircleDone: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
  },
  streakCircleMissed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  streakEmojiIcon: {
    fontSize: 20,
  },

  // Filled Section Card (No borders, soft color fill)
  filledSectionCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 14,
    marginVertical: 6,
    borderWidth: 0,
  },
  centeredSectionHeaderRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 32,
  },
  sectionHeaderTitleCentered: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: '#0F172A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerArrowBtnSoftPos: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: '#0F172A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerArrowBtnSoft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  quickAddBtnSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0,
  },

  dividerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  // 3. Analytics Section
  framelessSection: {
    marginVertical: 4,
  },
  analyticsSideBySideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  chartCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 6,
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
  donutCenterOverlayMeter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeCenterValMeter: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: '#0F172A',
  },
  totalTimeCenterLabelMeter: {
    fontFamily: FONTS.semiBold,
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sideCategoryList: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    gap: 6,
  },
  sideCategoryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  catLeftInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  compactCategoryNameText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#0F172A',
    flexShrink: 1,
  },
  catRightInfo: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  compactCategoryTimeVal: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: '#64748B',
  },
  categoriesFaintBottomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 12,
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
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
    marginBottom: 8,
  },
  tasksHeaderTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 0.8,
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  quickAddBtnText: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    fontSize: 11.5,
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
    borderBottomColor: '#E2E8F0',
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

  // World-Class Quick Tiles Deck
  quickTilesDeckContainer: {
    marginTop: 16,
    marginBottom: 4,
  },
  quickTilesHeaderTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  quickTilesGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickTileCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
  },
  tileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tileTextContent: {
    flex: 1,
  },
  tileTitleText: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 13,
    color: '#0F172A',
  },
  tileSubText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    marginTop: 1,
  },

  // 3 Even Soft Schedule Chips Styles with Thematic Color Highlights
  evenChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  evenScheduleChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evenScheduleChipText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  evenScheduleChipUpcomingActive: {
    backgroundColor: '#DBEAFE',
  },
  evenScheduleChipUpcomingTextActive: {
    color: '#1E40AF',
  },
  evenScheduleChipMissedActive: {
    backgroundColor: '#FEE2E2',
  },
  evenScheduleChipMissedTextActive: {
    color: '#DC2626',
  },
  evenScheduleChipCompletedActive: {
    backgroundColor: '#DCFCE7',
  },
  evenScheduleChipCompletedTextActive: {
    color: '#15803D',
  },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreenNative from 'expo-splash-screen';
import { UserProfile, Task, TimetableSlot, SubjectProgress, AISyncResult, UserCategory } from './src/types';
import { Database } from './src/storage/db';
import { THEMES, ThemeKey, ThemeConfig } from './src/theme/colors';
import { FONTS } from './src/theme/typography';
import { MasterDashboard } from './src/components/dashboard/MasterDashboard';
import { DailyPlanner } from './src/components/planner/DailyPlanner';
import { AnalyticsDashboard } from './src/components/analytics/AnalyticsDashboard';
import { AddTaskModal } from './src/components/common/AddTaskModal';
import { PomodoroModal } from './src/components/common/PomodoroModal';
import { GlobalSearchModal } from './src/components/common/GlobalSearchModal';
import { EditProfileModal } from './src/components/common/EditProfileModal';
import { StreakCalendarModal } from './src/components/common/StreakCalendarModal';
import { CategoryManagerModal } from './src/components/common/CategoryManagerModal';
import { TimerIncompleteModal } from './src/components/common/TimerIncompleteModal';
import { StreakCalendarView } from './src/components/streak/StreakCalendarView';
import { PomodoroView } from './src/components/pomodoro/PomodoroView';
import { SettingsView } from './src/components/settings/SettingsView';
import { HabitTrackerView } from './src/components/habits/HabitTrackerView';
import { SplashScreen as AnimatedSplashScreen } from './src/components/splash/SplashScreen';
import { triggerHaptic } from './src/services/haptics';
import { Calendar, CheckSquare, BarChart2, BookOpen, LayoutDashboard, CheckCircle2, User, Sparkles, Flame } from 'lucide-react-native';

import { SpatialBackgroundProvider } from './src/components/common/SpatialBackgroundContext';
import { SpatialBackgroundContainer } from './src/components/common/SpatialBackgroundContainer';

// Prevent native splash screen from auto-hiding until initial load completes
SplashScreenNative.preventAutoHideAsync().catch(() => {});

const THEME_KEYS: ThemeKey[] = ['pure_white', 'slate_light', 'minimal_white'];

export default function App() {
  const [fontsLoaded] = useFonts({
    'Gilroy-ExtraBold': require('./assets/Gilroy-FREE/Gilroy-ExtraBold.otf'),
    'Gilroy-Light': require('./assets/Gilroy-FREE/Gilroy-Light.otf'),
    'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_700Bold.ttf'),
    'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_600SemiBold.ttf'),
    'PlusJakartaSans-Medium': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_500Medium.ttf'),
    'PlusJakartaSans-Regular': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_400Regular.ttf'),
  });

  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'planner' | 'settings' | 'ai' | 'streak' | 'pomodoro' | 'habits'>('overview');
  const [currentThemeKey, setCurrentThemeKey] = useState<ThemeKey>('pure_white');

  const theme: ThemeConfig = THEMES[currentThemeKey];

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [syllabus, setSyllabus] = useState<SubjectProgress[]>([]);
  const [aiSyncResults, setAiSyncResults] = useState<AISyncResult[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);

  // Modals & Toast
  const [selectedTimerTask, setSelectedTimerTask] = useState<Task | undefined>(undefined);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = React.useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    async function loadData() {
      try {
        await Database.init();
        const prof = await Database.getUserProfile();
        const t = await Database.getTasks();
        const tt = await Database.getTimetable();
        const sys = await Database.getSyllabus();
        const ai = await Database.getAISyncResults();
        const cats = await Database.getCategories();

        setProfile(prof);
        setTasks(t);
        setTimetable(tt);
        setSyllabus(sys);
        setAiSyncResults(ai);
        setCategories(cats);
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setLoading(false);
        // Hide native splash screen so custom animated splash component takes over smoothly
        SplashScreenNative.hideAsync().catch(() => {});
      }
    }

    loadData();
  }, []);


  const handleCycleTheme = () => {
    triggerHaptic.mediumImpact();
    const currentIndex = THEME_KEYS.indexOf(currentThemeKey);
    const nextIndex = (currentIndex + 1) % THEME_KEYS.length;
    setCurrentThemeKey(THEME_KEYS[nextIndex]);
  };

  const [timerIncompleteTask, setTimerIncompleteTask] = useState<Task | null>(null);

  const handleToggleComplete = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask && !targetTask.completed && targetTask.requiresTimer) {
      const targetMins = Math.max(1, targetTask.timerDurationMins || targetTask.durationMins || 30);
      const targetSecs = targetMins * 60;
      const elapsedSecs = Math.max(0, targetTask.elapsedSeconds || 0);
      const progressRatio = targetSecs > 0 ? (elapsedSecs / targetSecs) : 1;

      if (progressRatio < 0.8) {
        triggerHaptic.notificationWarning();
        setTimerIncompleteTask(targetTask);
        return;
      }
    }

    const updated = await Database.toggleTaskComplete(taskId);
    setTasks(updated);
  };

  const handleSnoozeTask = async (taskId: string) => {
    const updated = await Database.snoozeTask(taskId);
    setTasks(updated);
  };

  const handleAddNewTask = async (newTaskData: Omit<Task, 'id'>) => {
    const updated = await Database.addTask(newTaskData);
    setTasks(updated);
    triggerToast('Task added to planner!');
  };

  const handleSyncComplete = async (result: AISyncResult) => {
    setAiSyncResults([result, ...aiSyncResults]);
  };

  const handlePomodoroSessionComplete = async (mins: number) => {
    triggerToast(`Focus session complete! 🎯`);
  };

  const handleRefreshTasks = async (updated: Task[]) => {
    setTasks(updated);
  };

  if (loading || !profile || !fontsLoaded || showSplash) {
    return (
      <AnimatedSplashScreen
        onFinish={() => setShowSplash(false)}
        isReady={!loading && profile !== null && fontsLoaded}
      />
    );
  }

  return (
    <SpatialBackgroundProvider>
      <SpatialBackgroundContainer>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

          <SafeAreaView style={styles.safeArea}>
            {/* Floating Toast Notification */}
            {toastMessage && (
              <View style={styles.globalToastBanner}>
                <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.globalToastText}>{toastMessage}</Text>
              </View>
            )}

            {/* Main Tab Content View */}
            <View style={styles.contentView}>
              {activeTab === 'overview' && (
                <MasterDashboard
                  profile={profile}
                  tasks={tasks}
                  timetable={timetable}
                  syllabus={syllabus}
                  aiSyncResults={aiSyncResults}
                  categories={categories}
                  theme={theme}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                  }}
                  onOpenAddTask={() => setShowAddTaskModal(true)}
                  onOpenAddHabit={() => setActiveTab('habits')}
                  onOpenPomodoro={() => setActiveTab('pomodoro')}
                  onOpenSearch={() => setShowSearchModal(true)}
                  onOpenEditProfile={() => setShowEditProfileModal(true)}
                  onOpenStreakModal={() => setActiveTab('streak')}
                  onOpenCategoryManager={() => setShowCategoryManagerModal(true)}
                  onQuickCompleteTask={handleToggleComplete}
                />
              )}

              {activeTab === 'pomodoro' && (
                <PomodoroView
                  theme={theme}
                  targetTask={selectedTimerTask}
                  onBackToDashboard={() => setActiveTab('overview')}
                  onSessionComplete={handlePomodoroSessionComplete}
                />
              )}

              {activeTab === 'streak' && (
                <StreakCalendarView
                  theme={theme}
                  tasks={tasks}
                  onBackToDashboard={() => setActiveTab('overview')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'planner' && (
                <DailyPlanner
                  tasks={tasks}
                  theme={theme}
                  categories={categories}
                  onToggleComplete={handleToggleComplete}
                  onSnoozeTask={handleSnoozeTask}
                  onAddTask={() => setShowAddTaskModal(true)}
                  onTasksUpdated={handleRefreshTasks}
                  onStartTaskTimer={(task) => {
                    setSelectedTimerTask(task);
                    setActiveTab('pomodoro');
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  profile={profile}
                  categories={categories}
                  theme={theme}
                  onOpenEditProfile={() => setShowEditProfileModal(true)}
                  onCategoriesUpdated={(updatedCats) => setCategories(updatedCats)}
                />
              )}

              {activeTab === 'ai' && (
                <AnalyticsDashboard
                  tasks={tasks}
                  syllabus={syllabus}
                  theme={theme}
                  categories={categories}
                  onTasksUpdated={handleRefreshTasks}
                />
              )}

              {activeTab === 'habits' && (
                <HabitTrackerView
                  theme={theme}
                  onBackToDashboard={() => setActiveTab('overview')}
                />
              )}
            </View>

            {/* Authentic Google Material 3 Style Bottom Navigation Bar */}
            <View style={styles.googleNavContainer}>
              <TouchableOpacity
                style={styles.googleNavItem}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setActiveTab('overview');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.googleIconPill, activeTab === 'overview' && styles.googleIconPillActive]}>
                  <LayoutDashboard
                    size={20}
                    color={activeTab === 'overview' ? '#0F172A' : '#64748B'}
                  />
                </View>
                <Text
                  style={[
                    styles.googleNavLabel,
                    activeTab === 'overview' && styles.googleNavLabelActive,
                  ]}
                >
                  Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleNavItem}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setActiveTab('planner');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.googleIconPill, activeTab === 'planner' && styles.googleIconPillActive]}>
                  <CheckSquare
                    size={20}
                    color={activeTab === 'planner' ? '#0F172A' : '#64748B'}
                  />
                </View>
                <Text
                  style={[
                    styles.googleNavLabel,
                    activeTab === 'planner' && styles.googleNavLabelActive,
                  ]}
                >
                  Planner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleNavItem}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setActiveTab('ai');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.googleIconPill, activeTab === 'ai' && styles.googleIconPillActive]}>
                  <BarChart2
                    size={20}
                    color={activeTab === 'ai' ? '#0F172A' : '#64748B'}
                  />
                </View>
                <Text
                  style={[
                    styles.googleNavLabel,
                    activeTab === 'ai' && styles.googleNavLabelActive,
                  ]}
                >
                  Analytics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleNavItem}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setActiveTab('habits');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.googleIconPill, activeTab === 'habits' && styles.googleIconPillActive]}>
                  <Flame
                    size={20}
                    color={activeTab === 'habits' ? '#0F172A' : '#64748B'}
                  />
                </View>
                <Text
                  style={[
                    styles.googleNavLabel,
                    activeTab === 'habits' && styles.googleNavLabelActive,
                  ]}
                >
                  Habits
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleNavItem}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setActiveTab('settings');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.googleIconPill, activeTab === 'settings' && styles.googleIconPillActive]}>
                  <User
                    size={20}
                    color={activeTab === 'settings' ? '#0F172A' : '#64748B'}
                  />
                </View>
                <Text
                  style={[
                    styles.googleNavLabel,
                    activeTab === 'settings' && styles.googleNavLabelActive,
                  ]}
                >
                  You
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </SpatialBackgroundContainer>

      {/* Spatial Bottom Sheets */}
      <AddTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        theme={theme}
        categories={categories}
        onAddTask={handleAddNewTask}
      />

      <PomodoroModal
        visible={showPomodoroModal}
        onClose={() => setShowPomodoroModal(false)}
        theme={theme}
        onSessionComplete={handlePomodoroSessionComplete}
      />

      <CategoryManagerModal
        visible={showCategoryManagerModal}
        onClose={() => setShowCategoryManagerModal(false)}
        theme={theme}
        categories={categories}
        onAddCategory={async (cat) => {
          const updated = await Database.addCategory(cat);
          setCategories(updated);
          triggerToast('Category created!');
        }}
        onUpdateCategory={async (id, cat) => {
          const updated = await Database.updateCategory(id, cat);
          setCategories(updated);
          triggerToast('Category updated!');
        }}
        onDeleteCategory={async (id) => {
          const updated = await Database.deleteCategory(id);
          setCategories(updated);
          triggerToast('Category deleted');
        }}
      />

      <GlobalSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        theme={theme}
        tasks={tasks}
        timetable={timetable}
        syllabus={syllabus}
        onNavigate={(tab) => {
          setShowSearchModal(false);
          setActiveTab(tab);
        }}
      />

      <StreakCalendarModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        theme={theme}
        tasks={tasks}
      />

      <TimerIncompleteModal
        visible={!!timerIncompleteTask}
        task={timerIncompleteTask}
        onClose={() => setTimerIncompleteTask(null)}
        onResumeTimer={(t) => {
          setSelectedTimerTask(t);
          setActiveTab('pomodoro');
        }}
        onForceComplete={async (t) => {
          const updated = await Database.toggleTaskComplete(t.id);
          setTasks(updated);
        }}
      />


      {profile && (
        <EditProfileModal
          visible={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          profile={profile}
          theme={theme}
          onSaveProfile={async (updatedProfile) => {
            setProfile(updatedProfile);
            await Database.saveUserProfile(updatedProfile);
            triggerToast('Profile updated successfully ✓');
          }}
        />
      )}
    </SpatialBackgroundProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.groteskSemibold,
    color: '#64748B',
    fontSize: 14,
    marginTop: 14,
  },
  contentView: {
    flex: 1,
  },

  // Google Material 3 Style Bottom Navigation Bar
  googleNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingHorizontal: 8,
  },
  googleNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconPill: {
    width: 50,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  googleIconPillActive: {
    backgroundColor: '#FCE7F3',
  },
  googleNavLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  googleNavLabelActive: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#0F172A',
  },

  // Floating Toast Notification
  globalToastBanner: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 12 : 12,
    left: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  globalToastText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});

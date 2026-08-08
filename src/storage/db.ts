import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Task, TimetableSlot, SubjectProgress, AISyncResult, UserGamification, PomodoroSession, TaskCategory, UserCategory, ActivityLog } from '../types';
import { SEED_USER_PROFILE, SEED_TASKS, SEED_TIMETABLE, SEED_SYLLABUS, SEED_AI_SYNC, DEFAULT_CATEGORIES } from '../seed/defaultData';

const KEYS = {
  USER_PROFILE: '@logmylife_user_profile',
  TASKS: '@logmylife_tasks',
  TIMETABLE: '@logmylife_timetable',
  SYLLABUS: '@logmylife_syllabus',
  AI_SYNC: '@logmylife_ai_sync',
  GEMINI_KEY: '@logmylife_gemini_api_key',
  GAMIFICATION: '@logmylife_gamification',
  POMODORO_SESSIONS: '@logmylife_pomodoro_sessions',
  CATEGORIES: '@logmylife_categories',
  ACTIVITY_LOGS: '@logmylife_activity_logs',
  ATTENDANCE_RECORDS: '@logmylife_attendance_records',
};

const DEFAULT_GAMIFICATION: UserGamification = {
  xp: 0,
  level: 1,
  streakDays: 0,
  totalFocusMins: 0,
  completedPomodoros: 0,
  unlockedBadgeIds: [],
};

// Legacy category migration map — converts old hardcoded categories to general UserCategory entries
const LEGACY_CATEGORY_MIGRATION: Record<string, { name: string; tag: 'productive' | 'work' | 'new_skill' | 'fun' | 'health' | 'routine'; color: string; icon: string }> = {
  'DSA': { name: 'Learning & Skills', tag: 'new_skill', color: '#7C3AED', icon: 'brain' },
  'College': { name: 'Work & Projects', tag: 'work', color: '#2563EB', icon: 'briefcase' },
  'Documentary': { name: 'Focus & Deep Work', tag: 'productive', color: '#0EA5E9', icon: 'target' },
  'Personal': { name: 'Personal & Life', tag: 'routine', color: '#F59E0B', icon: 'user' },
  'Work': { name: 'Work & Projects', tag: 'work', color: '#2563EB', icon: 'briefcase' },
  'Study': { name: 'Learning & Skills', tag: 'new_skill', color: '#7C3AED', icon: 'book' },
  'Wastage': { name: 'Leisure & Break', tag: 'fun', color: '#EF4444', icon: 'coffee' },
};

// In-Memory fallback store
let memoryStore: {
  profile: UserProfile;
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectProgress[];
  aiSync: AISyncResult[];
  geminiApiKey: string;
  gamification: UserGamification;
  pomodoroSessions: PomodoroSession[];
  categories: UserCategory[];
  activityLogs: ActivityLog[];
  attendanceRecords: any[];
} = {
  profile: SEED_USER_PROFILE,
  tasks: [],
  timetable: [],
  syllabus: [],
  aiSync: [],
  geminiApiKey: '',
  gamification: DEFAULT_GAMIFICATION,
  pomodoroSessions: [],
  categories: [],
  activityLogs: [],
  attendanceRecords: [],
};

// Safe Storage Adapter with Web localStorage / in-memory fallback
const storageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {}
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    }
  },
};

// Helper: migrate legacy categories in tasks/pomodoro/timetable
function migrateCategories(
  tasks: Task[],
  pomodoroSessions: PomodoroSession[],
  existingCategories: UserCategory[]
): { categories: UserCategory[]; tasks: Task[]; sessions: PomodoroSession[] } {
  const categoriesMap = new Map<string, UserCategory>();
  existingCategories.forEach(c => categoriesMap.set(c.id, c));

  // Also index by name for matching
  const categoryByName = new Map<string, UserCategory>();
  existingCategories.forEach(c => categoryByName.set(c.name.toLowerCase(), c));

  // Scan for legacy category names in tasks
  const legacyNames = new Set<string>();
  tasks.forEach(t => {
    if (t.category && !categoriesMap.has(t.category)) {
      legacyNames.add(t.category);
    }
  });
  pomodoroSessions.forEach(s => {
    if (s.category && !categoriesMap.has(s.category)) {
      legacyNames.add(s.category as string);
    }
  });

  // Create new categories for legacy names
  const legacyToIdMap = new Map<string, string>();
  legacyNames.forEach(name => {
    // Check if we already have a matching category by name
    const existing = categoryByName.get(name.toLowerCase());
    if (existing) {
      legacyToIdMap.set(name, existing.id);
      return;
    }

    const migration = LEGACY_CATEGORY_MIGRATION[name];
    const newCat: UserCategory = {
      id: 'cat-migrated-' + name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: migration ? migration.name : name,
      tag: migration ? migration.tag : 'productive',
      color: migration ? migration.color : '#64748B',
      icon: migration ? migration.icon : '📌',
      createdAt: new Date().toISOString(),
    };
    categoriesMap.set(newCat.id, newCat);
    categoryByName.set(newCat.name.toLowerCase(), newCat);
    legacyToIdMap.set(name, newCat.id);
  });

  // Update tasks to use category IDs
  const migratedTasks = tasks.map(t => {
    const newId = legacyToIdMap.get(t.category);
    if (newId) {
      return { ...t, category: newId };
    }
    return t;
  });

  // Update pomodoro sessions
  const migratedSessions = pomodoroSessions.map(s => {
    const newId = legacyToIdMap.get(s.category as string);
    if (newId) {
      return { ...s, category: newId };
    }
    return s;
  });

  return {
    categories: Array.from(categoriesMap.values()),
    tasks: migratedTasks,
    sessions: migratedSessions,
  };
}

export const Database = {
  async init(): Promise<void> {
    try {
      const profileJson = await storageAdapter.getItem(KEYS.USER_PROFILE);
      const isOldDummy = profileJson && profileJson.includes('Ashok Choudhary');

      if (!profileJson || isOldDummy) {
        // Seed database with empty state
        await storageAdapter.setItem(KEYS.USER_PROFILE, JSON.stringify(SEED_USER_PROFILE));
        await storageAdapter.setItem(KEYS.TASKS, JSON.stringify([]));
        await storageAdapter.setItem(KEYS.TIMETABLE, JSON.stringify([]));
        await storageAdapter.setItem(KEYS.SYLLABUS, JSON.stringify([]));
        await storageAdapter.setItem(KEYS.AI_SYNC, JSON.stringify([]));
        await storageAdapter.setItem(KEYS.GAMIFICATION, JSON.stringify(DEFAULT_GAMIFICATION));
        await storageAdapter.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        await storageAdapter.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify([]));

        memoryStore.profile = SEED_USER_PROFILE;
        memoryStore.tasks = [];
        memoryStore.timetable = [];
        memoryStore.syllabus = [];
        memoryStore.aiSync = [];
        memoryStore.gamification = DEFAULT_GAMIFICATION;
        memoryStore.categories = DEFAULT_CATEGORIES;
        memoryStore.activityLogs = [];
      } else {
        memoryStore.profile = JSON.parse(profileJson);
        const tasks = await storageAdapter.getItem(KEYS.TASKS);
        if (tasks) memoryStore.tasks = JSON.parse(tasks);

        const tt = await storageAdapter.getItem(KEYS.TIMETABLE);
        if (tt) memoryStore.timetable = JSON.parse(tt);

        const sys = await storageAdapter.getItem(KEYS.SYLLABUS);
        if (sys) memoryStore.syllabus = JSON.parse(sys);

        const ai = await storageAdapter.getItem(KEYS.AI_SYNC);
        if (ai) memoryStore.aiSync = JSON.parse(ai);

        const key = await storageAdapter.getItem(KEYS.GEMINI_KEY);
        if (key) memoryStore.geminiApiKey = key;

        const g = await storageAdapter.getItem(KEYS.GAMIFICATION);
        if (g) memoryStore.gamification = JSON.parse(g);

        const p = await storageAdapter.getItem(KEYS.POMODORO_SESSIONS);
        if (p) memoryStore.pomodoroSessions = JSON.parse(p);

        // Load categories (or create defaults + migrate)
        const catJson = await storageAdapter.getItem(KEYS.CATEGORIES);
        let categories: UserCategory[] = catJson ? JSON.parse(catJson) : [];

        // Sanitize categories to remove emojis and old student names
        categories = categories.map(cat => {
          let name = cat.name;
          let icon = cat.icon || 'folder';

          if (name.includes('DSA')) name = 'Learning & Skills';
          else if (name.includes('College')) name = 'Work & Projects';
          else if (name.includes('Documentary')) name = 'Focus & Deep Work';
          else if (name === 'Personal') name = 'Personal & Life';

          // Convert emojis to icon names if needed
          if (icon === '💼') icon = 'briefcase';
          else if (icon === '🧠' || icon === '🧩' || icon === '📚') icon = 'brain';
          else if (icon === '💪') icon = 'activity';
          else if (icon === '🏠' || icon === '📌') icon = 'user';
          else if (icon === '🎯' || icon === '🎬') icon = 'target';
          else if (icon === '🎮') icon = 'coffee';

          return { ...cat, name, icon };
        });

        // Run migration for legacy categories
        const migrationResult = migrateCategories(memoryStore.tasks, memoryStore.pomodoroSessions, categories);
        memoryStore.categories = migrationResult.categories;

        // Save sanitized categories
        memoryStore.tasks = migrationResult.tasks;
        memoryStore.pomodoroSessions = migrationResult.sessions;
        await storageAdapter.setItem(KEYS.TASKS, JSON.stringify(memoryStore.tasks));
        await storageAdapter.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(memoryStore.pomodoroSessions));
        await storageAdapter.setItem(KEYS.CATEGORIES, JSON.stringify(memoryStore.categories));

        // Load activity logs
        const logsJson = await storageAdapter.getItem(KEYS.ACTIVITY_LOGS);
        if (logsJson) memoryStore.activityLogs = JSON.parse(logsJson);
      }
    } catch {
      // Memory store fallback active
    }
  },

  // ────────── Categories ──────────

  async getCategories(): Promise<UserCategory[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : memoryStore.categories;
    } catch {
      return memoryStore.categories;
    }
  },

  async saveCategories(categories: UserCategory[]): Promise<void> {
    memoryStore.categories = categories;
    try {
      await storageAdapter.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {}
  },

  async addCategory(category: Omit<UserCategory, 'id' | 'createdAt'>): Promise<UserCategory[]> {
    const categories = await this.getCategories();
    const newCat: UserCategory = {
      ...category,
      id: 'cat-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCat];
    await this.saveCategories(updated);
    return updated;
  },

  async updateCategory(categoryId: string, updates: Partial<UserCategory>): Promise<UserCategory[]> {
    const categories = await this.getCategories();
    const updated = categories.map(c => c.id === categoryId ? { ...c, ...updates } : c);
    await this.saveCategories(updated);
    return updated;
  },

  async deleteCategory(categoryId: string): Promise<UserCategory[]> {
    const categories = await this.getCategories();
    const updated = categories.filter(c => c.id !== categoryId);
    await this.saveCategories(updated);
    return updated;
  },

  async resetCategoriesToDefault(): Promise<UserCategory[]> {
    memoryStore.categories = DEFAULT_CATEGORIES;
    try {
      await storageAdapter.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    } catch {}
    return DEFAULT_CATEGORIES;
  },

  getCategoryById(categories: UserCategory[], categoryId: string): UserCategory | undefined {
    return categories.find(c => c.id === categoryId);
  },

  getCategoryColor(categories: UserCategory[], categoryId: string): string {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || '#64748B';
  },

  getCategoryName(categories: UserCategory[], categoryId: string): string {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  },

  // ────────── Activity Logs ──────────

  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.ACTIVITY_LOGS);
      return data ? JSON.parse(data) : memoryStore.activityLogs;
    } catch {
      return memoryStore.activityLogs;
    }
  },

  async saveActivityLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: 'log-' + Date.now(),
    };
    const updated = [newLog, ...logs];
    memoryStore.activityLogs = updated;
    try {
      await storageAdapter.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
    } catch {}
    await this.addXP(15);
    return updated;
  },

  async deleteActivityLog(logId: string): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs();
    const updated = logs.filter(l => l.id !== logId);
    memoryStore.activityLogs = updated;
    try {
      await storageAdapter.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // ────────── User Profile ──────────

  async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await storageAdapter.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : memoryStore.profile;
    } catch {
      return memoryStore.profile;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    memoryStore.profile = profile;
    try {
      await storageAdapter.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch {
      // Memory store fallback active
    }
  },

  // ────────── Tasks ──────────

  async getTasks(): Promise<Task[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : memoryStore.tasks;
    } catch {
      return memoryStore.tasks;
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    memoryStore.tasks = tasks;
    try {
      await storageAdapter.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch {}
  },

  async toggleTaskComplete(taskId: string, verified: boolean = false): Promise<Task[]> {
    const tasks = await this.getTasks();
    let gainedXP = false;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (!t.completed) {
          gainedXP = true;
          return {
            ...t,
            completed: true,
            completedAt: new Date().toISOString(),
            verifiedCompletion: verified,
          };
        }
        return { ...t, completed: false, completedAt: undefined, verifiedCompletion: undefined };
      }
      return t;
    });
    await this.saveTasks(updated);

    if (gainedXP) {
      const xpAmount = verified ? 50 : 30;
      await this.addXP(xpAmount);
    }
    return updated;
  },

  async completeAllTodayTasks(): Promise<Task[]> {
    const tasks = await this.getTasks();
    let newlyCompletedCount = 0;
    const updated = tasks.map(t => {
      if (!t.completed) newlyCompletedCount++;
      return { ...t, completed: true, completedAt: new Date().toISOString(), verifiedCompletion: false };
    });
    await this.saveTasks(updated);

    if (newlyCompletedCount > 0) {
      await this.addXP(newlyCompletedCount * 30);
    }
    return updated;
  },

  async addTask(task: Omit<Task, 'id'>): Promise<Task[]> {
    const tasks = await this.getTasks();
    const timerMins = task.timerDurationMins || task.durationMins || 25;
    const newTask: Task = {
      ...task,
      id: 't-' + Date.now(),
      requiresTimer: task.requiresTimer ?? false,
      notificationEnabled: task.notificationEnabled ?? true,
      timerDurationMins: timerMins,
      leftoverSeconds: task.leftoverSeconds ?? timerMins * 60,
      elapsedSeconds: task.elapsedSeconds ?? 0,
      earlyStopReasons: task.earlyStopReasons || [],
    };
    const updated = [newTask, ...tasks];
    await this.saveTasks(updated);
    return updated;
  },

  async updateTaskTimerProgress(
    taskId: string,
    elapsedSeconds: number,
    leftoverSeconds: number,
    isCompleted: boolean,
    stopReason?: string
  ): Promise<Task[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const existingReasons = t.earlyStopReasons || [];
        const newReasons = stopReason
          ? [
              ...existingReasons,
              { timestamp: new Date().toISOString(), reason: stopReason, elapsedSecs: elapsedSeconds },
            ]
          : existingReasons;

        return {
          ...t,
          elapsedSeconds: (t.elapsedSeconds || 0) + elapsedSeconds,
          leftoverSeconds: isCompleted ? 0 : leftoverSeconds,
          completed: isCompleted ? true : t.completed,
          completedAt: isCompleted ? new Date().toISOString() : t.completedAt,
          verifiedCompletion: isCompleted ? true : t.verifiedCompletion,
          earlyStopReasons: newReasons,
        };
      }
      return t;
    });

    await this.saveTasks(updated);
    if (isCompleted) {
      await this.addXP(100);
    }
    return updated;
  },

  async addQuickPresetTask(title: string, category: TaskCategory, durationMins: number): Promise<Task[]> {
    return this.addTask({
      title,
      category,
      startTime: 'Now',
      endTime: `${durationMins}m later`,
      durationMins,
      completed: false,
      snoozed: false,
      dateStr: new Date().toISOString().split('T')[0],
      notes: 'Added via 1-Click Quick Preset',
    });
  },

  async snoozeTask(taskId: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, snoozed: true };
      }
      return t;
    });
    await this.saveTasks(updated);
    return updated;
  },

  // ────────── Timetable ──────────

  async getTimetable(): Promise<TimetableSlot[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.TIMETABLE);
      return data ? JSON.parse(data) : memoryStore.timetable;
    } catch {
      return memoryStore.timetable;
    }
  },

  async saveTimetable(timetable: TimetableSlot[]): Promise<void> {
    memoryStore.timetable = timetable;
    try {
      await storageAdapter.setItem(KEYS.TIMETABLE, JSON.stringify(timetable));
    } catch {}
  },

  async addClassSlot(slotData: Omit<TimetableSlot, 'id'>): Promise<{ timetable: TimetableSlot[]; tasks: Task[] }> {
    const timetable = await this.getTimetable();
    const newSlot: TimetableSlot = {
      ...slotData,
      id: 'tt-' + Date.now(),
    };
    const updatedTt = [...timetable, newSlot];
    await this.saveTimetable(updatedTt);

    // Calculate date for the day of week (1 = Mon, 7 = Sun)
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    const diff = slotData.dayOfWeek - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Automatically create a corresponding Task for the Planner time slot!
    const updatedTasks = await this.addTask({
      title: `Class: ${slotData.subject} (${slotData.code})`,
      category: slotData.category,
      startTime: slotData.timeStr,
      endTime: 'Auto',
      durationMins: 60,
      completed: false,
      snoozed: false,
      dateStr: dateStr,
      notes: `Room: ${slotData.room} • Instructor: ${slotData.instructor}`,
    });

    return { timetable: updatedTt, tasks: updatedTasks };
  },

  async removeClassSlot(slotId: string): Promise<TimetableSlot[]> {
    const timetable = await this.getTimetable();
    const updated = timetable.filter(t => t.id !== slotId);
    await this.saveTimetable(updated);
    return updated;
  },

  async updateClassSlot(slotId: string, updatedData: Partial<TimetableSlot>): Promise<TimetableSlot[]> {
    const timetable = await this.getTimetable();
    const updated = timetable.map(t => (t.id === slotId ? { ...t, ...updatedData } : t));
    await this.saveTimetable(updated);
    return updated;
  },

  // ────────── Syllabus ──────────

  async getSyllabus(): Promise<SubjectProgress[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.SYLLABUS);
      return data ? JSON.parse(data) : memoryStore.syllabus;
    } catch {
      return memoryStore.syllabus;
    }
  },

  async toggleTopicComplete(subjectId: string, topicIndex: number): Promise<SubjectProgress[]> {
    const syllabus = await this.getSyllabus();
    let gainedXP = false;
    const updated = syllabus.map(s => {
      if (s.id === subjectId) {
        const topics = [...s.topicsList];
        const wasCompleted = topics[topicIndex].completed;
        topics[topicIndex] = { ...topics[topicIndex], completed: !wasCompleted };
        if (!wasCompleted) gainedXP = true;
        const completedCount = topics.filter(t => t.completed).length;
        return {
          ...s,
          topicsList: topics,
          completedTopics: completedCount,
        };
      }
      return s;
    });
    memoryStore.syllabus = updated;
    try {
      await storageAdapter.setItem(KEYS.SYLLABUS, JSON.stringify(updated));
    } catch {}
    if (gainedXP) {
      await this.addXP(40);
    }
    return updated;
  },

  async addTopicToSubject(subjectId: string, topicTitle: string): Promise<SubjectProgress[]> {
    const syllabus = await this.getSyllabus();
    const updated = syllabus.map(s => {
      if (s.id === subjectId) {
        const newTopics = [...s.topicsList, { title: topicTitle.trim(), completed: false }];
        return {
          ...s,
          topicsList: newTopics,
          totalTopics: newTopics.length,
        };
      }
      return s;
    });
    memoryStore.syllabus = updated;
    try {
      await storageAdapter.setItem(KEYS.SYLLABUS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  async markAllTopicsComplete(subjectId: string): Promise<SubjectProgress[]> {
    const syllabus = await this.getSyllabus();
    const updated = syllabus.map(s => {
      if (s.id === subjectId) {
        const newTopics = s.topicsList.map(t => ({ ...t, completed: true }));
        return {
          ...s,
          topicsList: newTopics,
          completedTopics: newTopics.length,
        };
      }
      return s;
    });
    memoryStore.syllabus = updated;
    try {
      await storageAdapter.setItem(KEYS.SYLLABUS, JSON.stringify(updated));
    } catch {}
    await this.addXP(150);
    return updated;
  },

  async importAIScheduleToPlanner(suggestedSchedule: { time: string; activity: string; category: TaskCategory }[]): Promise<Task[]> {
    const tasks = await this.getTasks();
    // Import to tomorrow's date, not today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const newTasks: Task[] = suggestedSchedule.map((slot, idx) => ({
      id: 'ai-task-' + Date.now() + '-' + idx,
      title: slot.activity,
      category: slot.category,
      startTime: slot.time,
      endTime: 'Auto',
      durationMins: 60,
      completed: false,
      snoozed: false,
      dateStr: tomorrowStr,
      notes: 'Imported from AI Recommended Plan',
    }));

    const updated = [...newTasks, ...tasks];
    await this.saveTasks(updated);
    return updated;
  },

  // ────────── AI Sync ──────────

  async getAISyncResults(): Promise<AISyncResult[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.AI_SYNC);
      return data ? JSON.parse(data) : memoryStore.aiSync;
    } catch {
      return memoryStore.aiSync;
    }
  },

  async saveAISyncResult(result: AISyncResult): Promise<AISyncResult[]> {
    const results = await this.getAISyncResults();
    const updated = [result, ...results];
    memoryStore.aiSync = updated;
    try {
      await storageAdapter.setItem(KEYS.AI_SYNC, JSON.stringify(updated));
    } catch {}
    await this.addXP(100);
    return updated;
  },

  // ────────── Gamification ──────────

  async getGamification(): Promise<UserGamification> {
    try {
      const data = await storageAdapter.getItem(KEYS.GAMIFICATION);
      return data ? JSON.parse(data) : memoryStore.gamification;
    } catch {
      return memoryStore.gamification;
    }
  },

  async saveGamification(gamification: UserGamification): Promise<void> {
    memoryStore.gamification = gamification;
    try {
      await storageAdapter.setItem(KEYS.GAMIFICATION, JSON.stringify(gamification));
    } catch {}
  },

  async addXP(amount: number): Promise<UserGamification> {
    const current = await this.getGamification();
    const newXP = current.xp + amount;
    const newLevel = Math.floor(newXP / 100);
    const updated: UserGamification = {
      ...current,
      xp: newXP,
      level: newLevel,
    };
    await this.saveGamification(updated);
    return updated;
  },

  // ────────── Pomodoro ──────────

  async logPomodoroSession(
    durationMins: number,
    category: any,
    sessionGoal?: string,
    stopReason?: string,
    isCompleted: boolean = true,
    leftoverSeconds?: number,
    taskId?: string
  ): Promise<{ gamification: UserGamification; sessions: PomodoroSession[] }> {
    const currentG = await this.getGamification();
    const pSessions = await this.getPomodoroSessions();

    const newSession: PomodoroSession = {
      id: 'p-' + Date.now(),
      durationMins,
      category,
      completedAt: new Date().toISOString(),
      sessionGoal,
      stopReason,
      isCompleted,
      leftoverSeconds,
      taskId,
    };

    const updatedSessions = [newSession, ...pSessions];
    memoryStore.pomodoroSessions = updatedSessions;
    try {
      await storageAdapter.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(updatedSessions));
    } catch {}

    const earnedXP = isCompleted ? 100 : Math.max(20, Math.floor((durationMins / 25) * 60));
    const updatedG: UserGamification = {
      ...currentG,
      totalFocusMins: currentG.totalFocusMins + durationMins,
      completedPomodoros: isCompleted ? currentG.completedPomodoros + 1 : currentG.completedPomodoros,
      xp: currentG.xp + earnedXP,
      level: Math.floor((currentG.xp + earnedXP) / 100),
    };

    await this.saveGamification(updatedG);

    if (taskId) {
      await this.updateTaskTimerProgress(
        taskId,
        durationMins * 60,
        leftoverSeconds || 0,
        isCompleted,
        stopReason
      );
    }

    return { gamification: updatedG, sessions: updatedSessions };
  },

  async getPomodoroSessions(): Promise<PomodoroSession[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.POMODORO_SESSIONS);
      return data ? JSON.parse(data) : memoryStore.pomodoroSessions;
    } catch {
      return memoryStore.pomodoroSessions;
    }
  },

  async deletePomodoroSession(sessionId: string): Promise<PomodoroSession[]> {
    const sessions = await this.getPomodoroSessions();
    const updated = sessions.filter((s) => s.id !== sessionId);
    memoryStore.pomodoroSessions = updated;
    try {
      await storageAdapter.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // ────────── Gemini API Key ──────────

  async getGeminiApiKey(): Promise<string> {
    try {
      const key = await storageAdapter.getItem(KEYS.GEMINI_KEY);
      return key || memoryStore.geminiApiKey;
    } catch {
      return memoryStore.geminiApiKey;
    }
  },

  async saveGeminiApiKey(key: string): Promise<void> {
    memoryStore.geminiApiKey = key;
    try {
      await storageAdapter.setItem(KEYS.GEMINI_KEY, key);
    } catch {}
  },

  // ────────── Offline Location Attendance Records ──────────

  async getAttendanceRecords(): Promise<any[]> {
    try {
      const data = await storageAdapter.getItem(KEYS.ATTENDANCE_RECORDS);
      return data ? JSON.parse(data) : memoryStore.attendanceRecords;
    } catch {
      return memoryStore.attendanceRecords;
    }
  },

  async saveAttendanceRecord(record: any): Promise<any[]> {
    const records = await this.getAttendanceRecords();
    const filtered = records.filter(r => !(r.slotId === record.slotId && r.dateStr === record.dateStr));
    const updated = [record, ...filtered];
    memoryStore.attendanceRecords = updated;
    try {
      await storageAdapter.setItem(KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  async deleteAttendanceRecord(id: string): Promise<any[]> {
    const records = await this.getAttendanceRecords();
    const updated = records.filter(r => r.id !== id);
    memoryStore.attendanceRecords = updated;
    try {
      await storageAdapter.setItem(KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  async clearAttendanceHistory(): Promise<void> {
    memoryStore.attendanceRecords = [];
    try {
      await storageAdapter.setItem(KEYS.ATTENDANCE_RECORDS, JSON.stringify([]));
    } catch {}
  }
};

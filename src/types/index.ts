// Category tag determines the productivity weight of a category
export type CategoryTag = 'productive' | 'work' | 'new_skill' | 'fun' | 'health' | 'routine';

// User-defined category (replaces hardcoded DSA/College/Documentary/Personal)
export interface UserCategory {
  id: string;
  name: string;           // e.g., "Coding", "Gym", "Reading"
  tag: CategoryTag;       // productivity classification
  color: string;          // hex color for UI
  icon: string;           // emoji for display
  createdAt: string;
}

// Backward compat alias — now just a string (the category ID or legacy name)
export type TaskCategory = string;

export type MoodType = 'energized' | 'content' | 'deep_work' | 'tired';

export interface UserProfile {
  name: string;
  role: string;
  targetDeadline: string; // ISO string e.g. "2026-04-14"
  targetLabel: string;
  bio: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;  // category ID or legacy name
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:30 AM"
  durationMins: number;
  completed: boolean;
  completedAt?: string;   // ISO timestamp of actual completion
  verifiedCompletion?: boolean;  // true if completion was verified (timer/time-match)
  snoozed: boolean;
  dateStr: string;   // "YYYY-MM-DD"
  notes?: string;
  requiresTimer?: boolean;
  timerDurationMins?: number;
  leftoverSeconds?: number;
  elapsedSeconds?: number;
  earlyStopReasons?: { timestamp: string; reason: string; elapsedSecs: number }[];
}

export interface TimetableSlot {
  id: string;
  subject: string;
  code: string;
  timeStr: string; // "10:00 AM - 11:30 AM"
  room: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  category: TaskCategory;
  instructor: string;
  notifyEnabled: boolean;
}

export interface SubjectProgress {
  id: string;
  subject: string;
  code: string;
  category: TaskCategory;
  completedTopics: number;
  totalTopics: number;
  nextExamDate: string; // "2026-04-10"
  topicsList: { title: string; completed: boolean }[];
}

export interface JournalEntry {
  id: string;
  dateStr: string; // "YYYY-MM-DD"
  mood: MoodType;
  reflections: string;
  wins: string[];
  blockers: string[];
}

export interface AISyncResult {
  id: string;
  dateStr: string;
  productivityScore: number; // 0 - 100
  keyTakeaway: string;
  nextDayFocus: string;
  suggestedSchedule: { time: string; activity: string; category: TaskCategory }[];
  syncedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  reqCount: number;
  currentCount: number;
}

export interface UserGamification {
  xp: number;
  level: number;
  streakDays: number;
  totalFocusMins: number;
  completedPomodoros: number;
  unlockedBadgeIds: string[];
}

export interface PomodoroSession {
  id: string;
  durationMins: number;
  category: TaskCategory;
  completedAt: string;
  sessionGoal?: string;
  stopReason?: string;
  isCompleted?: boolean;
  leftoverSeconds?: number;
  taskId?: string;
}

export interface SearchResultItem {
  id: string;
  type: 'task' | 'class' | 'topic' | 'journal';
  title: string;
  subtitle: string;
  category?: TaskCategory;
  dateStr?: string;
}

// Activity log for non-planner activities (life logging)
export interface ActivityLog {
  id: string;
  title: string;
  categoryId: string;     // references UserCategory.id
  tag: CategoryTag;
  durationMins: number;
  dateStr: string;
  timestamp: string;       // ISO string
  source: 'timer' | 'manual' | 'planner';
  notes?: string;
}

// Productivity weight mapping for category tags
export const CATEGORY_TAG_WEIGHTS: Record<CategoryTag, number> = {
  productive: 1.0,
  work: 1.0,
  new_skill: 1.2,
  fun: 0.3,
  health: 0.8,
  routine: 0.5,
};

export const CATEGORY_TAG_INFO: Record<CategoryTag, { label: string; icon: string }> = {
  productive: { label: 'Productive', icon: 'target' },
  work: { label: 'Work', icon: 'briefcase' },
  new_skill: { label: 'New Skill', icon: 'brain' },
  fun: { label: 'Fun', icon: 'coffee' },
  health: { label: 'Health', icon: 'activity' },
  routine: { label: 'Routine', icon: 'user' },
};

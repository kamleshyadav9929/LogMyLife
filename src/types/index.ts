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
  notificationEnabled?: boolean;
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
  location?: { latitude: number; longitude: number; radiusMeters: number; locationName?: string };
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

export interface AISyncResult {
  id: string;
  dateStr: string;
  productivityScore: number; // 0 - 100
  keyTakeaway: string;
  nextDayFocus: string;
  suggestedSchedule: { time: string; activity: string; category: TaskCategory }[];
  syncedAt: string;
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
  type: 'task' | 'class' | 'topic';
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

export interface AppUsageLog {
  id: string;
  appName: string;
  packageName: string;
  iconName: string;
  iconColor: string;
  bgTint: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  dateStr: string;
  categoryTag: CategoryTag;
  isAutoTracked?: boolean;
}

export interface AppPreset {
  name: string;
  packageName: string;
  iconName: string;
  iconColor: string;
  bgTint: string;
  categoryTag: CategoryTag;
  emoji: string;
}

export const POPULAR_APP_PRESETS: AppPreset[] = [
  { name: 'Instagram', packageName: 'com.instagram.android', iconName: 'camera', iconColor: '#E4405F', bgTint: '#FDF2F8', categoryTag: 'fun', emoji: '📸' },
  { name: 'YouTube', packageName: 'com.google.android.youtube', iconName: 'youtube', iconColor: '#FF0000', bgTint: '#FEF2F2', categoryTag: 'fun', emoji: '▶️' },
  { name: 'VS Code', packageName: 'com.microsoft.vscode', iconName: 'code', iconColor: '#007ACC', bgTint: '#F0F9FF', categoryTag: 'work', emoji: '💻' },
  { name: 'WhatsApp', packageName: 'com.whatsapp', iconName: 'message-square', iconColor: '#25D366', bgTint: '#F0FDF4', categoryTag: 'routine', emoji: '💬' },
  { name: 'Spotify', packageName: 'com.spotify.music', iconName: 'music', iconColor: '#1DB954', bgTint: '#F0FDF4', categoryTag: 'fun', emoji: '🎵' },
  { name: 'X / Twitter', packageName: 'com.twitter.android', iconName: 'twitter', iconColor: '#1DA1F2', bgTint: '#F0F9FF', categoryTag: 'fun', emoji: '🐦' },
  { name: 'Netflix', packageName: 'com.netflix.mediaclient', iconName: 'tv', iconColor: '#E50914', bgTint: '#FEF2F2', categoryTag: 'fun', emoji: '🍿' },
  { name: 'Chrome / Web', packageName: 'com.android.chrome', iconName: 'globe', iconColor: '#4285F4', bgTint: '#EFF6FF', categoryTag: 'productive', emoji: '🌐' },
];

export type HabitFrequencyType = 'daily' | 'weekly_target' | 'specific_days';

export interface Habit {
  id: string;
  name: string;
  color: string;
  frequencyType: HabitFrequencyType;
  targetDays: number[]; // 0=Sun, 1=Mon...6=Sat (used for specific_days)
  weeklyTargetCount?: number; // e.g. 5 times per week (used for weekly_target)
  completedDates: string[]; // array of "YYYY-MM-DD"
  createdAt: string;
  categoryId?: string; // linked to UserCategory.id
  reminderTime?: string; // e.g. "08:00 AM"
  goalDescription?: string; // e.g. "Read 15 pages" or "Drink 2L water"
  notes?: string;
  streak: number;
  bestStreak: number;
}



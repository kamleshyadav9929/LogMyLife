import { UserProfile, Task, TimetableSlot, SubjectProgress, AISyncResult, UserCategory } from '../types';

export const SEED_USER_PROFILE: UserProfile = {
  name: 'User Profile',
  role: 'Productivity Enthusiast',
  targetDeadline: '',
  targetLabel: '',
  bio: '',
};

export const SEED_TASKS: Task[] = [];

export const SEED_TIMETABLE: TimetableSlot[] = [];

export const SEED_SYLLABUS: SubjectProgress[] = [];

export const SEED_AI_SYNC: AISyncResult[] = [];

// Default categories created on first launch
export const DEFAULT_CATEGORIES: UserCategory[] = [
  {
    id: 'cat-work',
    name: 'Work & Projects',
    tag: 'work',
    color: '#2563EB',
    icon: 'briefcase',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-learning',
    name: 'Learning & Skills',
    tag: 'new_skill',
    color: '#7C3AED',
    icon: 'brain',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-health',
    name: 'Health & Fitness',
    tag: 'health',
    color: '#10B981',
    icon: 'activity',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-personal',
    name: 'Personal & Life',
    tag: 'routine',
    color: '#F59E0B',
    icon: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-focus',
    name: 'Focus & Deep Work',
    tag: 'productive',
    color: '#0EA5E9',
    icon: 'target',
    createdAt: new Date().toISOString(),
  },
];

// Color palette for user category creation
export const CATEGORY_COLOR_OPTIONS = [
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#0EA5E9', // Sky Blue
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

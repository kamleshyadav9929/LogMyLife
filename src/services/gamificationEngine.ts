import { Task, ActivityLog, PomodoroSession, UserGamification, Achievement } from '../types';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  completed: boolean;
  type: 'tasks' | 'timer' | 'categories';
  targetCount: number;
  currentCount: number;
}

export function getLevelProgress(xp: number): { level: number; currentXP: number; nextLevelXP: number; progressPct: number } {
  // Progression curve: Level N requires N * 150 total XP
  let level = 1;
  let requiredForCurrent = 0;
  let requiredForNext = 150;

  while (xp >= requiredForNext) {
    level++;
    requiredForCurrent = requiredForNext;
    requiredForNext = requiredForNext + level * 150;
  }

  const xpInCurrentLevel = xp - requiredForCurrent;
  const xpNeededForLevel = requiredForNext - requiredForCurrent;
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)));

  return {
    level,
    currentXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForLevel,
    progressPct,
  };
}

export function generateDailyChallenges(
  dateStr: string,
  tasks: Task[],
  pomodoros: PomodoroSession[]
): DailyChallenge[] {
  const dayTasks = tasks.filter(t => t.dateStr === dateStr);
  const completedTasks = dayTasks.filter(t => t.completed).length;

  const dayPomodoros = pomodoroSessionsFilter(pomodoros, dateStr);

  return [
    {
      id: `ch-tasks-${dateStr}`,
      title: 'Complete 3 Planned Tasks',
      description: 'Finish at least 3 scheduled items today',
      rewardXP: 100,
      completed: completedTasks >= 3,
      type: 'tasks',
      targetCount: 3,
      currentCount: Math.min(3, completedTasks),
    },
    {
      id: `ch-timer-${dateStr}`,
      title: 'Deep Focus Session',
      description: 'Complete 1 Pomodoro timer session',
      rewardXP: 75,
      completed: dayPomodoros >= 1,
      type: 'timer',
      targetCount: 1,
      currentCount: Math.min(1, dayPomodoros),
    },
  ];
}

function pomodoroSessionsFilter(sessions: PomodoroSession[], dateStr: string): number {
  return sessions.filter(s => s.completedAt.startsWith(dateStr) && s.isCompleted).length;
}

export function checkAchievements(
  gamification: UserGamification,
  tasks: Task[],
  pomodoros: PomodoroSession[]
): Achievement[] {
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const completedPomodoroCount = pomodoros.filter(s => s.isCompleted).length;

  return [
    {
      id: 'first_task',
      title: 'First Step',
      description: 'Complete your first task',
      iconName: 'check',
      unlocked: completedTasksCount >= 1,
      reqCount: 1,
      currentCount: Math.min(1, completedTasksCount),
    },
    {
      id: 'timer_beast',
      title: 'Focus Beast',
      description: 'Complete 5+ timer sessions',
      iconName: 'clock',
      unlocked: completedPomodoroCount >= 5,
      reqCount: 5,
      currentCount: Math.min(5, completedPomodoroCount),
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Maintain a 7-day active streak',
      iconName: 'flame',
      unlocked: gamification.streakDays >= 7,
      reqCount: 7,
      currentCount: Math.min(7, gamification.streakDays),
    },
  ];
}

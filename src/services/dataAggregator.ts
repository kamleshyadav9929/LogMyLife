import { Task, ActivityLog, PomodoroSession, UserCategory, SubjectProgress, AISyncResult } from '../types';

export interface DailySnapshot {
  dateStr: string;
  tasks: Task[];
  completedTasks: Task[];
  activityLogs: ActivityLog[];
  pomodoros: PomodoroSession[];
  totalFocusMins: number;
}

export function getDailySnapshot(
  dateStr: string,
  tasks: Task[],
  activityLogs: ActivityLog[],
  pomodoroSessions: PomodoroSession[]
): DailySnapshot {
  const dayTasks = tasks.filter(t => t.dateStr === dateStr);
  const completedTasks = dayTasks.filter(t => t.completed);
  const logs = activityLogs.filter(l => l.dateStr === dateStr);
  const pomodoros = pomodoroSessions.filter(s => s.completedAt.startsWith(dateStr) && s.isCompleted);

  const focusFromTasks = completedTasks.reduce((acc, t) => acc + (t.durationMins || 0), 0);
  const focusFromPomodoros = pomodoros.reduce((acc, s) => acc + s.durationMins, 0);
  const totalFocusMins = Math.max(focusFromTasks, focusFromPomodoros);

  return {
    dateStr,
    tasks: dayTasks,
    completedTasks,
    activityLogs: logs,
    pomodoros,
    totalFocusMins,
  };
}

export function getCategoryDistribution(
  tasks: Task[],
  activityLogs: ActivityLog[],
  categories: UserCategory[],
  daysBack: number = 7
): Record<string, { name: string; tag: string; color: string; mins: number }> {
  const dist: Record<string, { name: string; tag: string; color: string; mins: number }> = {};

  categories.forEach(c => {
    dist[c.id] = { name: c.name, tag: c.tag, color: c.color, mins: 0 };
  });

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  const startStr = startDate.toISOString().split('T')[0];

  tasks.filter(t => t.completed && t.dateStr >= startStr).forEach(t => {
    if (dist[t.category]) {
      dist[t.category].mins += t.durationMins || 30;
    }
  });

  activityLogs.filter(l => l.dateStr >= startStr).forEach(l => {
    if (dist[l.categoryId]) {
      dist[l.categoryId].mins += l.durationMins || 15;
    }
  });

  return dist;
}

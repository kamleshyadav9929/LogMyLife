import { Task, ActivityLog, PomodoroSession, UserCategory, CATEGORY_TAG_WEIGHTS } from '../types';
import { getLocalDateStr, getLocalDateFromISO } from '../utils/dateUtils';

export interface DailyActivityScore {
  score: number;
  taskPoints: number;
  timerPoints: number;
  verifiedBonus: number;
  activityLogPoints: number;
  multiplier: number;
}

export function calculateDailyActivityScore(
  tasks: Task[],
  activityLogs: ActivityLog[],
  pomodoroSessions: PomodoroSession[],
  categories: UserCategory[],
  dateStr: string,
  currentStreak: number = 0
): DailyActivityScore {
  // Filter for target date using local date mapping
  const dayTasks = tasks.filter(t => t.dateStr === dateStr);
  const dayLogs = activityLogs.filter(l => l.dateStr === dateStr);
  const dayPomodoros = pomodoroSessions.filter(s => getLocalDateFromISO(s.completedAt) === dateStr && s.isCompleted);

  // 1. Task Points (5 pts per completed task, weighted by category tag)
  let taskPoints = 0;
  let verifiedBonus = 0;

  dayTasks.forEach(t => {
    if (t.completed) {
      const cat = categories.find(c => c.id === t.category);
      const tag = cat?.tag || 'routine';
      const weight = CATEGORY_TAG_WEIGHTS[tag] || 1.0;
      taskPoints += Math.round(5 * weight);

      if (t.verifiedCompletion) {
        verifiedBonus += 3;
      }
    }
  });
  taskPoints = Math.min(40, taskPoints);
  verifiedBonus = Math.min(15, verifiedBonus);

  // 2. Timer Points (10 pts per completed pomodoro session)
  const timerPoints = Math.min(30, dayPomodoros.length * 10);

  // 3. Activity Log Points (5 pts per manual activity log, weighted)
  let activityLogPoints = 0;
  dayLogs.forEach(l => {
    const weight = CATEGORY_TAG_WEIGHTS[l.tag] || 1.0;
    activityLogPoints += Math.round(5 * weight);
  });
  activityLogPoints = Math.min(15, activityLogPoints);

  // 4. Streak Multiplier (grows 0.1x per consecutive streak day, caps at 1.5x)
  const multiplier = Math.min(1.5, 1.0 + Math.floor(currentStreak / 3) * 0.1);

  // Total raw score before multiplier
  const rawScore = taskPoints + timerPoints + verifiedBonus + activityLogPoints;
  const finalScore = Math.min(100, Math.round(rawScore * multiplier));

  return {
    score: finalScore,
    taskPoints,
    timerPoints,
    verifiedBonus,
    activityLogPoints,
    multiplier,
  };
}

export function calculateMultiFactorStreak(
  tasks: Task[],
  activityLogs: ActivityLog[],
  pomodoroSessions: PomodoroSession[],
  categories: UserCategory[],
  threshold: number = 30
): { currentStreak: number; longestStreak: number; todayScore: number } {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const todayScoreObj = calculateDailyActivityScore(
    tasks,
    activityLogs,
    pomodoroSessions,
    categories,
    todayStr,
    0
  );
  const todayScore = todayScoreObj.score;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak looking backwards from today
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateStr(d);

    const dayScoreObj = calculateDailyActivityScore(
      tasks,
      activityLogs,
      pomodoroSessions,
      categories,
      dStr,
      currentStreak
    );

    if (dayScoreObj.score >= threshold) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Calculate longest streak across history
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateStr(d);

    const dayScoreObj = calculateDailyActivityScore(
      tasks,
      activityLogs,
      pomodoroSessions,
      categories,
      dStr,
      tempStreak
    );

    if (dayScoreObj.score >= threshold) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, longestStreak),
    todayScore,
  };
}


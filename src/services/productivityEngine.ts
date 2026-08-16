import { Task, ActivityLog, PomodoroSession, UserCategory, CATEGORY_TAG_WEIGHTS } from '../types';
import { calculateDailyActivityScore } from './streakEngine';
import { getLocalDateStr, getLocalDateFromISO } from '../utils/dateUtils';

export interface ScoreBreakdown {
  taskExecution: number;    // max 35 pts
  focusedTime: number;      // max 25 pts
  lifeBalance: number;      // max 15 pts
  reflection: number;       // max 15 pts
  streakBonus: number;      // max 10 pts
  totalScore: number;       // max 100 pts
}

export interface DynamicInsight {
  id: string;
  type: 'peak' | 'balance' | 'timer' | 'streak' | 'growth' | 'burnout';
  title: string;
  body: string;
  tag: string;
  tagColor: string;
  bg: string;
  textColor: string;
}

export function calculateDetailedProductivityScore(
  tasks: Task[],
  activityLogs: ActivityLog[],
  pomodoroSessions: PomodoroSession[],
  categories: UserCategory[],
  streakDays: number = 0,
  dateStr?: string
): ScoreBreakdown {
  const targetDateStr = dateStr || getLocalDateStr();

  const dayTasks = tasks.filter(t => t.dateStr === targetDateStr);
  const dayLogs = activityLogs.filter(l => l.dateStr === targetDateStr);
  const dayPomodoros = pomodoroSessions.filter(s => getLocalDateFromISO(s.completedAt) === targetDateStr && s.isCompleted);

  // 1. Task Execution (max 35 pts) - Exclude snoozed tasks from denominator
  let taskExecution = 0;
  const activeTasks = dayTasks.filter(t => !t.snoozed);
  if (activeTasks.length > 0) {
    const completedTasks = activeTasks.filter(t => t.completed);
    let weightedCompletionRatio = 0;

    activeTasks.forEach(t => {
      if (t.completed) {
        const cat = categories.find(c => c.id === t.category);
        const weight = CATEGORY_TAG_WEIGHTS[cat?.tag || 'routine'] || 1.0;
        weightedCompletionRatio += weight;
      }
    });

    const executionRatio = Math.min(1.0, weightedCompletionRatio / activeTasks.length);
    taskExecution = Math.round(executionRatio * 30);

    // Verified completion bonus (+5 pts)
    const verifiedCount = completedTasks.filter(t => t.verifiedCompletion).length;
    if (completedTasks.length > 0 && verifiedCount / completedTasks.length >= 0.5) {
      taskExecution += 5;
    }
  }
  taskExecution = Math.min(35, taskExecution);


  // 2. Focused Time (max 25 pts)
  // Target: 120 mins focus time per day
  const totalTimerMins = dayPomodoros.reduce((acc, s) => acc + s.durationMins, 0);
  const targetMins = 120;
  const focusedTime = Math.min(25, Math.round((totalTimerMins / targetMins) * 25));

  // 3. Life Balance (max 15 pts) — diversity across tags used today
  const tagsUsed = new Set<string>();
  dayTasks.filter(t => t.completed).forEach(t => {
    const cat = categories.find(c => c.id === t.category);
    if (cat?.tag) tagsUsed.add(cat.tag);
  });
  dayLogs.forEach(l => tagsUsed.add(l.tag));

  let lifeBalance = 0;
  if (tagsUsed.size >= 4) lifeBalance = 15;
  else if (tagsUsed.size === 3) lifeBalance = 12;
  else if (tagsUsed.size === 2) lifeBalance = 8;
  else if (tagsUsed.size === 1) lifeBalance = 4;

  // 4. Reflection & Self-Awareness (max 15 pts based on activity logs)
  let reflection = Math.min(15, dayLogs.length * 5);

  // 5. Streak Bonus (max 10 pts)
  const streakBonus = Math.min(10, streakDays * 2);

  const totalScore = Math.min(100, taskExecution + focusedTime + lifeBalance + reflection + streakBonus);

  return {
    taskExecution,
    focusedTime,
    lifeBalance,
    reflection,
    streakBonus,
    totalScore,
  };
}

export function generatePersonalizedInsights(
  tasks: Task[],
  activityLogs: ActivityLog[],
  pomodoroSessions: PomodoroSession[],
  categories: UserCategory[],
  scoreBreakdown: ScoreBreakdown
): DynamicInsight[] {
  const insights: DynamicInsight[] = [];
  const completedTasks = tasks.filter(t => t.completed);

  // Insight 1: Task Execution Performance
  if (scoreBreakdown.taskExecution >= 28) {
    insights.push({
      id: 'ins-exec-high',
      type: 'growth',
      title: 'High Execution Rate',
      body: `You completed your tasks efficiently today! Task execution contribution is ${scoreBreakdown.taskExecution}/35 pts.`,
      tag: 'PEAK MOMENTUM',
      tagColor: '#1E40AF',
      bg: '#EEF2FF',
      textColor: '#1E1B4B',
    });
  } else if (tasks.length > 0 && completedTasks.length / tasks.length < 0.5) {
    insights.push({
      id: 'ins-exec-low',
      type: 'balance',
      title: 'Task Backlog Alert',
      body: `More than 50% of today's planned tasks are incomplete. Try breaking large tasks into 25m Pomodoro sessions.`,
      tag: 'BACKLOG RISK',
      tagColor: '#B45309',
      bg: '#FFFBEB',
      textColor: '#451A03',
    });
  } else {
    insights.push({
      id: 'ins-exec-normal',
      type: 'growth',
      title: 'Steady Progress',
      body: `Execution ratio is balanced. Log verified timer sessions to earn higher productivity multipliers.`,
      tag: 'DAILY MOMENTUM',
      tagColor: '#1E40AF',
      bg: '#EEF2FF',
      textColor: '#1E1B4B',
    });
  }

  // Insight 2: Timer & Focus Adherence
  if (scoreBreakdown.focusedTime < 10) {
    insights.push({
      id: 'ins-timer-low',
      type: 'timer',
      title: 'Timer Utilization Low',
      body: `You logged ${scoreBreakdown.focusedTime * 5}m of timer focus. Using the Pomodoro timer adds verified completion bonuses.`,
      tag: 'FOCUS OPPORTUNITY',
      tagColor: '#6D28D9',
      bg: '#F5F3FF',
      textColor: '#2E1065',
    });
  } else {
    insights.push({
      id: 'ins-timer-good',
      type: 'timer',
      title: 'Deep Focus Achieved',
      body: `Great focus discipline! You earned ${scoreBreakdown.focusedTime}/25 pts in focus time score today.`,
      tag: 'PEAK FOCUS WINDOW',
      tagColor: '#6D28D9',
      bg: '#F5F3FF',
      textColor: '#2E1065',
    });
  }

  // Insight 3: Life Balance / Diversity
  if (scoreBreakdown.lifeBalance >= 12) {
    insights.push({
      id: 'ins-balance-high',
      type: 'balance',
      title: 'Well-Rounded Life Log',
      body: `You engaged across multiple category tags today (work, health, skills). Excellent balance!`,
      tag: 'HIGH BALANCE',
      tagColor: '#047857',
      bg: '#ECFDF5',
      textColor: '#064E3B',
    });
  } else {
    insights.push({
      id: 'ins-balance-low',
      type: 'balance',
      title: 'Category Diversity',
      body: `Your activity was concentrated in 1 category. Consider balancing work with learning or health.`,
      tag: 'BALANCE CHECK',
      tagColor: '#B45309',
      bg: '#FFFBEB',
      textColor: '#451A03',
    });
  }

  return insights;
}

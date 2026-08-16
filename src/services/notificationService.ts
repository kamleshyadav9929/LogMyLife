import { triggerHaptic } from './haptics';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info';
  icon?: 'bell' | 'warning' | 'check' | 'smartphone' | 'zap';
}

type NotificationListener = (payload: NotificationPayload) => void;

const listeners: Set<NotificationListener> = new Set();

export const NotificationService = {
  /**
   * Subscribe to notification events
   */
  subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Dispatch a notification event to all active UI subscribers
   */
  dispatch(payload: Omit<NotificationPayload, 'id'>): void {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const fullPayload: NotificationPayload = { id, ...payload };
    listeners.forEach(l => l(fullPayload));
  },

  /**
   * Send a notification when an app usage / task timer starts
   */
  notifyAppSessionStarted(appName: string, durationMins: number = 30): void {
    triggerHaptic.notificationSuccess();
    this.dispatch({
      title: `📱 Tracked Session Started`,
      message: `Timer for "${appName}" has started (${durationMins}m allocated).`,
      type: 'success',
      icon: 'smartphone',
    });
  },

  /**
   * Send a notification when a focus timer is interrupted by another app
   */
  notifyFocusTimerInterrupted(appName: string, durationMins: number): void {
    triggerHaptic.notificationWarning();
    this.dispatch({
      title: `⚠️ Focus Timer Interrupted`,
      message: `Your timer paused because ${appName} was used for ${durationMins} min(s). Tap Play to restart.`,
      type: 'warning',
      icon: 'warning',
    });
  },

  /**
   * Send a notification for general task reminders
   */
  notifyTaskReminder(taskTitle: string, timeStr: string): void {
    triggerHaptic.lightImpact();
    this.dispatch({
      title: `⏰ Task Reminder`,
      message: `"${taskTitle}" is scheduled for ${timeStr}.`,
      type: 'info',
      icon: 'bell',
    });
  },
};

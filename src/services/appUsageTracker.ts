import { Platform, Linking } from 'react-native';
import { Database } from '../storage/db';
import { AppPreset, AppUsageLog, POPULAR_APP_PRESETS } from '../types';
import { NotificationService } from './notificationService';

export const AppUsageTracker = {
  /**
   * Check if real-time auto-tracking is supported on current platform
   */
  isAutoTrackingSupported(): boolean {
    return Platform.OS === 'android';
  },

  /**
   * Open Android System Settings for Usage Access permission
   */
  async openAndroidUsageAccessSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Linking.openSettings();
      } catch (e) {
        console.warn('Could not open Android Settings:', e);
      }
    }
  },

  /**
   * Resolve any app name or preset into a fully valid AppPreset (NO hardcoded fallback)
   */
  resolveAppPreset(appNameOrPreset: AppPreset | string): AppPreset {
    if (typeof appNameOrPreset !== 'string') {
      return appNameOrPreset;
    }

    const nameClean = appNameOrPreset.trim();
    const matched = POPULAR_APP_PRESETS.find(
      p => p.name.toLowerCase() === nameClean.toLowerCase() ||
           p.name.toLowerCase().includes(nameClean.toLowerCase()) ||
           nameClean.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matched) {
      return matched;
    }

    // Dynamic preset for custom or unlisted apps
    return {
      name: nameClean || 'App Session',
      packageName: `com.app.${(nameClean || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      iconName: 'smartphone',
      iconColor: '#6366F1',
      bgTint: '#EEF2FF',
      categoryTag: 'fun',
      emoji: '📱',
    };
  },

  /**
   * Quick Log an app session for ANY app (dynamic preset or app name) with optional push notification
   */
  async quickLogAppSession(
    appNameOrPreset: AppPreset | string,
    durationMins: number = 30,
    sendNotification: boolean = false
  ): Promise<AppUsageLog[]> {
    const preset = this.resolveAppPreset(appNameOrPreset);
    const now = new Date();
    const startTimeDate = new Date(now.getTime() - durationMins * 60 * 1000);

    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minsStr = minutes < 10 ? '0' + minutes : minutes;
      const hrsStr = hours < 10 ? '0' + hours : hours;
      return `${hrsStr}:${minsStr} ${ampm}`;
    };

    const startTime = formatTime(startTimeDate);
    const endTime = formatTime(now);

    if (sendNotification) {
      NotificationService.notifyAppSessionStarted(preset.name, durationMins);
    }

    return Database.addAppUsageFromPreset(preset, startTime, endTime, durationMins);
  },

  /**
   * Find matching preset for a given app name
   */
  getPresetByName(appName: string): AppPreset | undefined {
    return this.resolveAppPreset(appName);
  },
};

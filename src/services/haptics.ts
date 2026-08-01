import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerHaptic = {
  heavyImpact: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([30, 20, 30]);
    }
  },

  mediumImpact: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(20);
    }
  },

  lightImpact: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
  },

  notificationSuccess: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([40, 30, 50]);
    }
  }
};

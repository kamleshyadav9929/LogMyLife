import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

interface SpatialBackgroundContextType {
  sheetProgress: Animated.Value;
  openSheet: () => void;
  closeSheet: () => void;
  updateProgress: (value: number) => void;
}

const SpatialBackgroundContext = createContext<SpatialBackgroundContextType>({
  sheetProgress: new Animated.Value(0),
  openSheet: () => {},
  closeSheet: () => {},
  updateProgress: () => {},
});

export const SpatialBackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sheetProgress = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    Animated.spring(sheetProgress, {
      toValue: 1,
      stiffness: 260,
      damping: 24,
      mass: 0.9,
      useNativeDriver: false,
    }).start();
  };

  const closeSheet = () => {
    Animated.spring(sheetProgress, {
      toValue: 0,
      stiffness: 260,
      damping: 24,
      mass: 0.9,
      useNativeDriver: false,
    }).start();
  };

  const updateProgress = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    sheetProgress.setValue(clamped);
  };

  return (
    <SpatialBackgroundContext.Provider
      value={{
        sheetProgress,
        openSheet,
        closeSheet,
        updateProgress,
      }}
    >
      {children}
    </SpatialBackgroundContext.Provider>
  );
};

export const useSpatialBackground = () => useContext(SpatialBackgroundContext);

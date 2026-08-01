import React from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { useSpatialBackground } from './SpatialBackgroundContext';

interface Props {
  children: React.ReactNode;
}

export const SpatialBackgroundContainer: React.FC<Props> = ({ children }) => {
  const { sheetProgress } = useSpatialBackground();

  const scale = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.93],
    extrapolate: 'clamp',
  });

  const borderRadius = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
    extrapolate: 'clamp',
  });

  const overlayOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.outerWrapper}>
      <Animated.View
        style={[
          styles.recedingContainer,
          {
            borderRadius,
            transform: [{ scale }],
          },
        ]}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backdropTintOverlay,
            {
              opacity: overlayOpacity,
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any)
              : {},
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  recedingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  backdropTintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 999,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }
      : {}),
  } as any,
});

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps } from 'react-native';

interface Props extends ViewProps {
  active: boolean;
  children: React.ReactNode;
}

export const ShimmerBorder: React.FC<Props> = ({ active, children, style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [active]);

  const borderColor = rotateAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      '#6366F1', // Indigo
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#10B981', // Emerald
      '#6366F1', // Indigo
    ],
  });

  const borderWidth = active ? 2 : 1;

  return (
    <Animated.View
      style={[
        style,
        {
          borderWidth,
          borderColor: active ? borderColor : 'rgba(255, 255, 255, 0.08)',
          shadowColor: active ? '#6366F1' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active ? 0.8 : 0,
          shadowRadius: active ? 12 : 0,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

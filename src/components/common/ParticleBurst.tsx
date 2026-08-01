import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ParticleProps {
  color: string;
  trigger: boolean;
}

export const ParticleBurst: React.FC<ParticleProps> = ({ color, trigger }) => {
  const particles = useRef(
    Array.from({ length: 8 }).map(() => ({
      anim: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2,
      distance: 25 + Math.random() * 25,
      size: 4 + Math.random() * 4,
    }))
  ).current;

  useEffect(() => {
    if (trigger) {
      particles.forEach((p) => {
        p.anim.setValue(0);
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, index) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 0.8, 0],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.2],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: color,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});

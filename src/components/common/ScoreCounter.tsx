import React, { useEffect, useState, useRef } from 'react';
import { Text, Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';

interface Props {
  targetScore: number;
}

export const ScoreCounter: React.FC<Props> = ({ targetScore }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setDisplayScore(0);
    let current = 0;
    const increment = Math.max(1, Math.floor(targetScore / 30));
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(interval);
        
        // Pop animation + haptic
        triggerHaptic.notificationSuccess();
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.25,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setDisplayScore(current);
    }, 25);

    return () => clearInterval(interval);
  }, [targetScore]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.scoreText,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {displayScore}
      </Animated.Text>
      <Text style={styles.maxText}>/ 100</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: FONTS.displayBold,
    fontSize: 36,
    color: COLORS.primaryLight,
    letterSpacing: -1,
  },
  maxText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
});

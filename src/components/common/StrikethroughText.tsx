import React, { useEffect, useRef } from 'react';
import { Text, View, Animated, StyleSheet, TextStyle } from 'react-native';
import { COLORS } from '../../theme/colors';

interface Props {
  text: string;
  completed: boolean;
  style?: TextStyle;
  categoryColor?: string;
}

export const StrikethroughText: React.FC<Props> = ({
  text,
  completed,
  style,
  categoryColor = COLORS.primary,
}) => {
  const strikeWidth = useRef(new Animated.Value(completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(strikeWidth, {
      toValue: completed ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [completed]);

  const animatedLineWidth = strikeWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          style,
          completed && { color: COLORS.textMuted },
        ]}
      >
        {text}
      </Text>
      <Animated.View
        style={[
          styles.strikeLine,
          {
            width: animatedLineWidth,
            backgroundColor: categoryColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  strikeLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    top: '50%',
    left: 0,
  },
});

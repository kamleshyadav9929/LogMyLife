import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { ThemeConfig } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: string[];
  initialSnapIndex?: number;
  children:
    | React.ReactNode
    | ((props: {
        scrollEnabled: boolean;
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
        scrollEventThrottle: number;
        closeSheet: () => void;
      }) => React.ReactNode);
  theme?: ThemeConfig;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  snapPoints = ['88%'],
  children,
  theme,
  showHandle = true,
}) => {
  // Parse the first snap point as the sheet height
  const sheetHeight = (() => {
    const sp = snapPoints[0] || '88%';
    if (sp.endsWith('%')) return SCREEN_HEIGHT * (parseFloat(sp) / 100);
    return parseFloat(sp) || SCREEN_HEIGHT * 0.88;
  })();

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollTop = useRef(0);
  const lastY = useRef(SCREEN_HEIGHT - sheetHeight);

  // Open / close animation
  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT - sheetHeight,
          stiffness: 260,
          damping: 26,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        lastY.current = SCREEN_HEIGHT - sheetHeight;
      });
    }
  }, [visible]);

  const dismiss = (vy?: number) => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        stiffness: 260,
        damping: 26,
        mass: 0.9,
        velocity: vy ? vy * 1000 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // Simple swipe-down-to-dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        // Only capture downward drag when scroll is at top
        return gs.dy > 6 && scrollTop.current <= 0;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation((val) => {
          lastY.current = val;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newY = lastY.current + gs.dy;
        if (newY >= SCREEN_HEIGHT - sheetHeight) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const currentY = lastY.current + gs.dy;
        const topY = SCREEN_HEIGHT - sheetHeight;
        const dragFraction = (currentY - topY) / sheetHeight;

        if (gs.vy > 0.4 || dragFraction > 0.3) {
          dismiss(gs.vy);
        } else {
          // Snap back to open position
          Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT - sheetHeight,
            stiffness: 260,
            damping: 26,
            mass: 0.9,
            useNativeDriver: true,
          }).start(() => {
            lastY.current = SCREEN_HEIGHT - sheetHeight;
          });
        }
      },
    })
  ).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollTop.current = event.nativeEvent.contentOffset.y;
  };

  if (!visible) return null;

  const sheetBg = theme?.cardBg ?? '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => dismiss()}>
      <View style={styles.overlay}>

        {/* Blurred dark backdrop — tap to dismiss */}
        <TouchableWithoutFeedback onPress={() => dismiss()}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
              Platform.OS === 'web'
                ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as any)
                : {},
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet panel */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: sheetBg,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle area for swipe-down dismiss gesture */}
          {showHandle && (
            <View style={styles.handleWrap} {...panResponder.panHandlers}>
              <View style={styles.handleBar} />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {typeof children === 'function'
              ? children({
                  scrollEnabled: true,
                  onScroll: handleScroll,
                  scrollEventThrottle: 16,
                  closeSheet: () => dismiss(),
                })
              : children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 15, 30, 0.52)',
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {}),
  } as any,
  sheet: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  content: {
    flex: 1,
  },
});

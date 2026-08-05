import React, { useEffect, useRef } from 'react';
import {
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
import { BlurView } from 'expo-blur';
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
        expandToTop: () => void;
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
  const sheetHeight = (() => {
    const sp = snapPoints[0] || '88%';
    if (sp.endsWith('%')) {
      return SCREEN_HEIGHT * (parseFloat(sp) / 100);
    }
    return parseFloat(sp) || SCREEN_HEIGHT * 0.88;
  })();

  const topExpandedY = Math.max(48, SCREEN_HEIGHT * 0.07); // Keeps Add New Class header fully visible

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollTop = useRef(0);
  const lastY = useRef(SCREEN_HEIGHT - sheetHeight);

  const expandToTop = () => {
    Animated.spring(translateY, {
      toValue: topExpandedY,
      stiffness: 260,
      damping: 26,
      mass: 0.9,
      useNativeDriver: true,
    }).start(() => {
      lastY.current = topExpandedY;
    });
  };

  // Open / close animation
  useEffect(() => {
    if (visible) {
      const openTargetY = SCREEN_HEIGHT - sheetHeight;
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: openTargetY,
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
        lastY.current = openTargetY;
      });
    }
  }, [visible, sheetHeight]);

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

  // Fully Interactive Up & Down PanResponder Drag Handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (scrollTop.current <= 0) return true;
        return Math.abs(gs.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation((val) => {
          lastY.current = val;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newY = Math.max(topExpandedY, lastY.current + gs.dy);
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gs) => {
        const currentY = lastY.current + gs.dy;

        if (gs.vy > 0.45 || currentY > SCREEN_HEIGHT - sheetHeight * 0.45) {
          dismiss(gs.vy);
        } else if (gs.vy < -0.3 || currentY < SCREEN_HEIGHT - sheetHeight * 0.85) {
          expandToTop();
        } else {
          const targetOpenY = SCREEN_HEIGHT - sheetHeight;
          Animated.spring(translateY, {
            toValue: targetOpenY,
            stiffness: 260,
            damping: 26,
            mass: 0.9,
            useNativeDriver: true,
          }).start(() => {
            lastY.current = targetOpenY;
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
    <View style={styles.inTreeOverlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Apple-Style Glassmorphic Frosted Glass Backdrop */}
      <TouchableWithoutFeedback onPress={() => dismiss()}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                // M3 scrim: 32% black overlay
                backgroundColor: 'rgba(0,0,0,0.32)',
                ...(Platform.OS === 'web'
                  ? {
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }
                  : {}),
              } as any,
            ]}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Draggable Sheet Panel */}
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
        {showHandle && (
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>
        )}

        <View style={styles.content}>
          {typeof children === 'function'
            ? children({
                scrollEnabled: true,
                onScroll: handleScroll,
                scrollEventThrottle: 16,
                closeSheet: () => dismiss(),
                expandToTop: () => expandToTop(),
              })
            : children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  inTreeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  sheet: {
    width: '100%',
    // M3 extraLarge shape token: 28dp top corners
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // M3 level 2 elevation — soft top shadow only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    // M3 drag handle area: 22pt top, 18pt bottom padding
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: 'transparent',
  },
  handleBar: {
    // M3 drag handle spec: 32dp wide, 4dp tall, full border radius
    width: 32,
    height: 4,
    borderRadius: 2,
    // M3 outlineVariant color for drag handle
    backgroundColor: '#CAC4D0',
  },
  content: {
    flex: 1,
  },
});

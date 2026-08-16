import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isReady = true }) => {
  // Animations matching Apple emblem scale & Instagram bottom fade-up
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(14)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    triggerHaptic.lightImpact();

    // 1. Apple-Style Centered Icon Spring Entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Instagram-Style Bottom Branding Fade-Up
    Animated.parallel([
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 480,
        delay: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bottomTranslateY, {
        toValue: 0,
        duration: 480,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Smooth hold & exit transition into app
    const timer = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      {/* CENTER: Apple-Style Centered Iconic Emblem */}
      <Animated.View
        style={[
          styles.centerLogoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.appleStyleIcon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* BOTTOM: Instagram Rebranding Style "from" & Gradient App Name */}
      <Animated.View
        style={[
          styles.bottomBrandingContainer,
          {
            opacity: bottomOpacity,
            transform: [{ translateY: bottomTranslateY }],
          },
        ]}
      >
        <Text style={styles.fromLabel}>f r o m</Text>

        {/* Instagram Rebranding Gradient Title: LogMyLife */}
        <View style={styles.gradientTextWrapper}>
          <Svg height="36" width="220" viewBox="0 0 220 36">
            <Defs>
              <LinearGradient id="instaRebrandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#2563EB" />
                <Stop offset="30%" stopColor="#7C3AED" />
                <Stop offset="65%" stopColor="#D946EF" />
                <Stop offset="100%" stopColor="#FF007A" />
              </LinearGradient>
            </Defs>
            <SvgText
              fill="url(#instaRebrandGradient)"
              fontSize="24"
              fontWeight="800"
              fontFamily={FONTS.displayBold}
              x="110"
              y="26"
              textAnchor="middle"
              letterSpacing="-0.5"
            >
              LogMyLife
            </SvgText>
          </Svg>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  centerLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  appleStyleIcon: {
    width: 120,
    height: 120,
  },
  bottomBrandingContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'lowercase',
    letterSpacing: 3,
    marginBottom: 2,
  },
  gradientTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

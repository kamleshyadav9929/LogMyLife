import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Bell, AlertTriangle, CheckCircle, Smartphone, X, Zap } from 'lucide-react-native';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';

export interface NotificationBannerProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info';
  icon?: 'bell' | 'warning' | 'check' | 'smartphone' | 'zap';
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  title,
  message,
  type = 'info',
  icon = 'bell',
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      triggerHaptic.lightImpact();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getThemeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: '#FFFBEB',
          borderColor: '#FDE68A',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          titleColor: '#92400E',
        };
      case 'success':
        return {
          bg: '#F0FDF4',
          borderColor: '#BBF7D0',
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          titleColor: '#166534',
        };
      default:
        return {
          bg: '#EFF6FF',
          borderColor: '#BFDBFE',
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          titleColor: '#1E40AF',
        };
    }
  };

  const theme = getThemeStyles();

  const renderIcon = () => {
    switch (icon) {
      case 'warning':
        return <AlertTriangle size={18} color={theme.iconColor} />;
      case 'check':
        return <CheckCircle size={18} color={theme.iconColor} />;
      case 'smartphone':
        return <Smartphone size={18} color={theme.iconColor} />;
      case 'zap':
        return <Zap size={18} color={theme.iconColor} />;
      default:
        return <Bell size={18} color={theme.iconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          borderColor: theme.borderColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
        {renderIcon()}
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.titleText, { color: theme.titleColor }]}>{title}</Text>
        <Text style={styles.messageText} numberOfLines={2}>{message}</Text>
      </View>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleClose}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color="#64748B" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    marginBottom: 2,
  },
  messageText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

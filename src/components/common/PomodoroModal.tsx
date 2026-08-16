import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeConfig } from '../../theme/colors';
import { BottomSheet } from './BottomSheet';
import { PomodoroView } from '../pomodoro/PomodoroView';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onSessionComplete: (mins: number) => void;
}

export const PomodoroModal: React.FC<Props> = ({
  visible,
  onClose,
  theme,
  onSessionComplete,
}) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['90%', '96%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <View style={styles.container}>
          <View style={styles.topCloseRow}>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn} activeOpacity={0.8}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <PomodoroView
              theme={theme}
              onSessionComplete={onSessionComplete}
            />
          </ScrollView>
        </View>
      )}
    </BottomSheet>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCloseRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

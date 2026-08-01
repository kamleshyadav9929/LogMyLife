import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { JournalView } from '../journal/JournalView';
import { JournalEntry } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { X } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  theme: ThemeConfig;
  onSaveEntry: (updated: JournalEntry[]) => void;
}

export const PullToLogModal: React.FC<Props> = ({ visible, onClose, entries, theme, onSaveEntry }) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['90%']}>
      {({ closeSheet }) => (
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeHeaderBtn} onPress={closeSheet}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          <JournalView
            entries={entries}
            theme={theme}
            onSaveEntry={onSaveEntry}
            onCloseModal={closeSheet}
          />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeHeaderBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

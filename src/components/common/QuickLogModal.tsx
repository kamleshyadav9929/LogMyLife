import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ActivityLog, CategoryTag, UserCategory, CATEGORY_TAG_INFO } from '../../types';
import { ThemeConfig, getCategoryLightBg } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { X, Plus, Clock, Zap } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  categories: UserCategory[];
  onLogActivity: (log: Omit<ActivityLog, 'id'>) => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const QuickLogModal: React.FC<Props> = ({ visible, onClose, theme, categories, onLogActivity }) => {
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [durationMins, setDurationMins] = useState(30);
  const [notes, setNotes] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

  const handleSubmit = () => {
    if (!title.trim() || !selectedCategory) return;
    triggerHaptic.notificationSuccess();

    const now = new Date();
    onLogActivity({
      title: title.trim(),
      categoryId: selectedCategory.id,
      tag: selectedCategory.tag,
      durationMins,
      dateStr: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      source: 'manual',
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['75%', '85%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentPadding}
          scrollEnabled={scrollEnabled}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={20} color="#2563EB" />
              <Text style={styles.title}>Quick Life Log</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>What did you do?:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 30m Evening Run, Read Chapter 4, Coffee with Friend"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    isSelected
                      ? { backgroundColor: getCategoryLightBg(cat.color), borderColor: cat.color }
                      : styles.catChipInactive,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <CategoryIcon name={cat.icon} size={14} color={isSelected ? cat.color : '#64748B'} />
                  <Text style={[styles.catText, isSelected && { color: cat.color, fontFamily: FONTS.groteskBold }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Duration:</Text>
          <View style={styles.durGrid}>
            {DURATION_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.durPill, durationMins === m && styles.durPillActive]}
                onPress={() => setDurationMins(m)}
              >
                <Text style={[styles.durText, durationMins === m && styles.durTextActive]}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional):</Text>
          <TextInput
            style={[styles.input, { height: 50 }]}
            placeholder="Quick reflections or thoughts..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Zap size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Log Activity (+15 XP)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    marginTop: 12,
    marginBottom: 6,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderColor: '#E2E8F0',
  },
  catRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  catChipInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  catText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#475569',
  },
  durGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#475569',
  },
  durTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    backgroundColor: '#2563EB',
    gap: 6,
  },
  submitText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});

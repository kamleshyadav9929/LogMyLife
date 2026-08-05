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
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    marginTop: 14,
    marginBottom: 6,
    color: '#49454F',
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    // M3 Outlined Text Field: extraSmall radius (4dp), outline border
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    color: '#1C1B1F',
    borderColor: '#CAC4D0',
  },
  catRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    // M3 Filter Chip: small radius (8dp), outlined inactive
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
    height: 32,
  },
  catChipInactive: {
    // M3 Filter Chip inactive: surfaceVariant bg, outline border
    backgroundColor: '#F8FAFC',
    borderColor: '#CAC4D0',
  },
  catText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#49454F',
  },
  durGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    // M3 Suggestion Chip: full pill radius
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#CAC4D0',
  },
  durPillActive: {
    // M3 selected Suggestion Chip: primaryContainer bg, no border
    backgroundColor: '#E8EAF6',
    borderColor: '#E8EAF6',
  },
  durText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#49454F',
  },
  durTextActive: {
    fontFamily: FONTS.groteskBold,
    // M3 onPrimaryContainer for active suggestion chip text
    color: '#1A1B52',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // M3 Filled Button: full pill (20dp), primary bg, 40dp height
    borderRadius: 20,
    paddingVertical: 10,
    marginTop: 24,
    backgroundColor: '#2563EB',
    gap: 8,
    // M3 elevation level 0 (no shadow on filled buttons at rest)
    elevation: 0,
    shadowOpacity: 0,
  },
  submitText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    // M3 labelLarge: 14sp, medium weight, +0.1 tracking
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

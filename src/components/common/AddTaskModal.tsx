import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Task, TaskCategory, UserCategory, CATEGORY_TAG_INFO } from '../../types';
import { ThemeConfig, getCategoryLightBg } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { X, Plus, Clock } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { CategoryIcon } from './CategoryIcon';
import { TimePickerModal } from './TimePickerModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  categories: UserCategory[];
}

export const AddTaskModal: React.FC<Props> = ({ visible, onClose, theme, onAddTask, categories }) => {
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationMins, setDurationMins] = useState('60');
  const [notes, setNotes] = useState('');
  const [requiresTimer, setRequiresTimer] = useState(false);
  const [timerDurationMins, setTimerDurationMins] = useState(25);

  const handleSubmit = () => {
    if (!title.trim()) return;
    triggerHaptic.notificationSuccess();

    onAddTask({
      title: title.trim(),
      category: selectedCategoryId,
      startTime: startTime || '09:00 AM',
      endTime: '10:00 AM',
      durationMins: parseInt(durationMins) || 60,
      completed: false,
      snoozed: false,
      dateStr: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      requiresTimer,
      timerDurationMins: requiresTimer ? timerDurationMins : undefined,
    });

    setTitle('');
    setNotes('');
    setRequiresTimer(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['88%', '95%']}>
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
            <Text style={styles.title}>Schedule Time Block</Text>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Task / Session Title:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Deep focus coding session"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScrollContainer}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChipPill,
                    isSelected
                      ? { backgroundColor: getCategoryLightBg(cat.color), borderColor: cat.color }
                      : styles.catChipInactive,
                  ]}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setSelectedCategoryId(cat.id);
                  }}
                  activeOpacity={0.8}
                >
                  <CategoryIcon name={cat.icon} size={14} color={isSelected ? cat.color : '#64748B'} style={{ marginRight: 6 }} />
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text
                    style={[
                      styles.catChipText,
                      isSelected && { color: cat.color, fontFamily: FONTS.groteskBold },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Show category tag info */}
          {selectedCategoryId && (() => {
            const selectedCat = categories.find(c => c.id === selectedCategoryId);
            if (!selectedCat) return null;
            const tagInfo = CATEGORY_TAG_INFO[selectedCat.tag];
            return (
              <View style={styles.tagInfoRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CategoryIcon name={tagInfo.icon} size={12} color="#64748B" />
                  <Text style={styles.tagInfoText}>
                    Tagged as <Text style={styles.tagInfoBold}>{tagInfo.label}</Text>
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Timer Requirement Toggle */}
          <Text style={styles.label}>TIMER REQUIREMENT:</Text>
          <View style={styles.timerToggleRow}>
            <TouchableOpacity
              style={[
                styles.timerToggleOption,
                !requiresTimer && styles.timerToggleOptionActiveNo,
              ]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setRequiresTimer(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={!requiresTimer ? styles.timerToggleTextActive : styles.timerToggleTextInactive}>
                No Timer Required
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerToggleOption,
                requiresTimer && styles.timerToggleOptionActiveYes,
              ]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setRequiresTimer(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={requiresTimer ? styles.timerToggleTextActiveYes : styles.timerToggleTextInactive}>
                ⏱️ Requires Timer
              </Text>
            </TouchableOpacity>
          </View>

          {requiresTimer && (
            <View style={styles.timerDurSection}>
              <Text style={styles.subLabel}>TARGET TIMER DURATION:</Text>
              <View style={styles.timerDurRow}>
                {[15, 25, 45, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durPill,
                      timerDurationMins === mins && styles.durPillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setTimerDurationMins(mins);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.durPillText,
                        timerDurationMins === mins && styles.durPillTextActive,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.timeRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Start Time:</Text>
              <TouchableOpacity
                style={styles.timeCardTrigger}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setShowTimePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Clock size={16} color="#2563EB" />
                <Text style={styles.timeCardText}>{startTime || '09:00 AM'}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Duration (Mins):</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                value={durationMins}
                onChangeText={setDurationMins}
              />
            </View>
          </View>

          <TimePickerModal
            visible={showTimePicker}
            initialTimeStr={startTime}
            title="Select Start Time"
            onSelectTime={(timeStr) => setStartTime(timeStr)}
            onClose={() => setShowTimePicker(false)}
          />

          <Text style={styles.label}>Notes (Optional):</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            placeholder="Specific focus or details..."
            placeholderTextColor="#94A3B8"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={styles.submitBtn}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Add to Daily Schedule</Text>
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
  subLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    marginTop: 8,
    marginBottom: 6,
    color: '#64748B',
    letterSpacing: 0.5,
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
  catScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  catChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
  },
  catChipInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  catEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  catChipText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#475569',
  },
  tagInfoRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  tagInfoText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  tagInfoBold: {
    fontFamily: FONTS.groteskBold,
    color: '#475569',
  },

  // Timer Toggle Styles
  timerToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  timerToggleOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  timerToggleOptionActiveNo: {
    backgroundColor: '#FFFFFF',
  },
  timerToggleOptionActiveYes: {
    backgroundColor: '#2563EB',
  },
  timerToggleTextActive: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
  },
  timerToggleTextActiveYes: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  timerToggleTextInactive: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
  timerDurSection: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 10,
  },
  timerDurRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  durPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#2563EB',
  },
  durPillTextActive: {
    color: '#FFFFFF',
  },

  timeRow: {
    flexDirection: 'row',
  },
  timeCardTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeCardText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#2563EB',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 20,
    backgroundColor: '#0F172A',
  },
  submitText: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Easing, Modal, TextInput, Platform, Pressable, Dimensions,
  LayoutAnimation, UIManager, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus, Check, Flame, ArrowLeft, Sparkles, MoreHorizontal, Trash2,
  CheckCircle2, Calendar as CalendarIcon, Filter, Zap, Award, Target,
  X, ChevronRight, Clock, Activity, BarChart2, Info, TrendingUp,
} from 'lucide-react-native';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { Habit, HabitFrequencyType, UserCategory } from '../../types';
import { Database } from '../../storage/db';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HABIT_COLORS = [
  '#2563EB', '#7C3AED', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#0EA5E9', '#14B8A6',
  '#F97316', '#84CC16', '#6D28D9', '#DB2777',
];

function getSoftBgColor(colorHex: string): string {
  const colorMap: Record<string, string> = {
    '#2563EB': '#EFF6FF', // Soft Blue
    '#7C3AED': '#FAF5FF', // Soft Violet
    '#EC4899': '#FDF2F8', // Soft Pink
    '#EF4444': '#FEF2F2', // Soft Red
    '#F59E0B': '#FEF3C7', // Soft Amber
    '#10B981': '#ECFDF5', // Soft Emerald
    '#0EA5E9': '#F0F9FF', // Soft Sky Blue
    '#14B8A6': '#F0FDFA', // Soft Teal
    '#F97316': '#FFF7ED', // Soft Orange
    '#84CC16': '#F7FEE7', // Soft Lime
    '#6D28D9': '#F5F3FF', // Soft Purple
    '#DB2777': '#FDF2F8', // Soft Rose
  };
  return colorMap[colorHex] || colorHex + '20';
}

const DOW_SINGLE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dateStr(date: Date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function last7() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ dateStr: dateStr(d), label: DOW_SINGLE[d.getDay()], dayIdx: d.getDay() });
  }
  return days;
}

// Compute 30-day grid data for heatmap
function compute30DayGrid(completedDates: string[]) {
  const datesSet = new Set(completedDates);
  const now = new Date();
  const grid = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    grid.push({
      dateStr: ds,
      dayNum: d.getDate(),
      dayLetter: DOW_SINGLE[d.getDay()],
      monthName: d.toLocaleString('default', { month: 'short' }),
      isCompleted: datesSet.has(ds),
      isToday: ds === todayStr(),
    });
  }
  return grid;
}

// Calculate 30-day completion percentage
function compute30DayConsistency(completedDates: string[]): number {
  const grid = compute30DayGrid(completedDates);
  const completedCount = grid.filter(g => g.isCompleted).length;
  return Math.round((completedCount / 30) * 100);
}

// Calculate weekly completions count for current week (Mon-Sun or Sun-Sat)
function getWeeklyCompletedCount(completedDates: string[]): number {
  const datesSet = new Set(completedDates);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek); // start on Sunday

  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    if (datesSet.has(dateStr(d))) count++;
  }
  return count;
}

// Format Frequency Label for Habit Card
function formatFrequencyLabel(habit: Habit): string {
  if (habit.frequencyType === 'weekly_target') {
    return `${habit.weeklyTargetCount || 5}x / week`;
  }
  if (habit.frequencyType === 'specific_days' && habit.targetDays?.length) {
    if (habit.targetDays.length === 7) return 'Daily';
    return habit.targetDays.map(d => DOW_FULL[d]).join(', ');
  }
  return 'Daily';
}

// Completion Burst Animation Component
function Burst({ visible, color }: { visible: boolean; color: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(1);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.8, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: 52, height: 52, borderRadius: 26,
      backgroundColor: color + '25', transform: [{ scale }], opacity,
    }} />
  );
}

// Date Strip Component
function DateStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (ds: string) => void;
}) {
  const t = todayStr();
  const weekDays = [];
  const now = new Date();
  const dateScrollRef = useRef<ScrollView>(null);

  for (let i = -4; i <= 4; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const ds = dateStr(d);

    weekDays.push({
      dateStr: ds,
      dayNum: d.getDate(),
      dayLetter: DOW_SINGLE[d.getDay()],
      isToday: ds === t,
      index: i + 4,
    });
  }

  const handleDatePress = (ds: string, idx: number) => {
    triggerHaptic.lightImpact();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelectDate(ds);

    const itemWidth = 50;
    const scrollX = Math.max(0, idx * itemWidth - (SCREEN_WIDTH / 2) + (itemWidth / 2));
    dateScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  };

  return (
    <View style={styles.dateStripWrapper}>
      <ScrollView
        ref={dateScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStripScrollRow}
      >
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          if (isSelected) {
            return (
              <TouchableOpacity
                key={item.dateStr}
                style={styles.selectedCapsulePill}
                onPress={() => handleDatePress(item.dateStr, item.index)}
                activeOpacity={0.9}
              >
                <Text style={styles.selectedPillDayLetter}>{item.dayLetter}</Text>
                <View style={styles.selectedPillCircleBadge}>
                  <Text style={styles.selectedPillDateNum}>{item.dayNum}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.dateStr}
              style={styles.unselectedDateCell}
              onPress={() => handleDatePress(item.dateStr, item.index)}
              activeOpacity={0.75}
            >
              <Text style={styles.unselectedDayLetter}>{item.dayLetter}</Text>
              <Text style={styles.unselectedDateNum}>{item.dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Habit Detail Sheet with Interactive 30-Day Heatmap
function HabitDetailSheet({
  visible,
  habit,
  category,
  onClose,
  onToggleDate,
  onDelete,
}: {
  visible: boolean;
  habit: Habit | null;
  category?: UserCategory;
  onClose: () => void;
  onToggleDate: (habitId: string, ds: string) => void;
  onDelete: (habitId: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!habit) return null;

  const grid30 = compute30DayGrid(habit.completedDates);
  const consistency30 = compute30DayConsistency(habit.completedDates);
  const weeklyCount = getWeeklyCompletedCount(habit.completedDates);
  const softTint = getSoftBgColor(habit.color);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Animated.View
          style={[styles.detailSheetContent, { transform: [{ translateY: slideAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHandle} />

          {/* Header Badge & Title */}
          <View style={styles.detailSheetHeader}>
            <View style={styles.detailHeaderTitleBox}>
              <View style={[styles.detailIconCircle, { backgroundColor: habit.color + '20' }]}>
                <Flame size={22} color={habit.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailHabitName} numberOfLines={1}>{habit.name}</Text>
                {habit.goalDescription ? (
                  <Text style={styles.detailGoalSub}>{habit.goalDescription}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Category & Frequency Chips */}
          <View style={styles.detailBadgesRow}>
            {category && (
              <View style={[styles.detailBadgePill, { backgroundColor: category.color + '15' }]}>
                <Text style={[styles.detailBadgeTxt, { color: category.color }]}>{category.name}</Text>
              </View>
            )}
            <View style={[styles.detailBadgePill, { backgroundColor: '#F1F5F9' }]}>
              <Clock size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={[styles.detailBadgeTxt, { color: '#475569' }]}>{formatFrequencyLabel(habit)}</Text>
            </View>
          </View>

          {/* Analytics Stat Cards */}
          <View style={styles.detailStatsGrid}>
            <View style={styles.detailStatBox}>
              <Text style={styles.detailStatVal}>{consistency30}%</Text>
              <Text style={styles.detailStatLbl}>30-DAY RATE</Text>
            </View>

            <View style={styles.detailStatBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.detailStatVal}>{habit.streak || 0}</Text>
                <Text style={{ fontSize: 16 }}>🔥</Text>
              </View>
              <Text style={styles.detailStatLbl}>STREAK</Text>
            </View>

            <View style={styles.detailStatBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.detailStatVal}>{habit.bestStreak || 0}</Text>
                <Text style={{ fontSize: 16 }}>🏆</Text>
              </View>
              <Text style={styles.detailStatLbl}>BEST</Text>
            </View>

            <View style={styles.detailStatBox}>
              <Text style={styles.detailStatVal}>{habit.completedDates?.length || 0}</Text>
              <Text style={styles.detailStatLbl}>TOTAL DONE</Text>
            </View>
          </View>

          {/* 30-Day Heatmap Grid */}
          <Text style={styles.sectionHeaderTitle}>30-DAY HEATMAP & CONSISTENCY</Text>
          <Text style={styles.heatmapInstructionText}>Streak history (Only today's date can be marked/unmarked)</Text>

          <View style={styles.heatmapContainer}>
            <View style={styles.heatmapGridRow}>
              {grid30.map((item) => (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[
                    styles.heatmapSquare,
                    item.isCompleted && { backgroundColor: habit.color },
                    item.isToday && !item.isCompleted && styles.heatmapTodayBorder,
                  ]}
                  onPress={() => {
                    if (!item.isToday) {
                      triggerHaptic.notificationWarning();
                      Alert.alert(
                        'Past Record Locked',
                        'Past habit records are locked to preserve streak integrity. You can only log habits for today!',
                        [{ text: 'Got it' }]
                      );
                      return;
                    }
                    triggerHaptic.lightImpact();
                    onToggleDate(habit.id, item.dateStr);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.heatmapSquareTxt,
                    item.isCompleted && { color: '#FFFFFF', fontFamily: FONTS.groteskBold }
                  ]}>
                    {item.dayNum}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.heatmapLegendRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.legendTxt}>Missed</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.legendDot, { backgroundColor: habit.color }]} />
                <Text style={styles.legendTxt}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.detailDeleteBtn}
            onPress={() => {
              triggerHaptic.notificationWarning();
              onDelete(habit.id);
              onClose();
            }}
          >
            <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.detailDeleteTxt}>Delete Habit</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Habit Card Component
function HabitCard({
  habit,
  days7,
  selectedDate,
  category,
  onToggle,
  onOpenDetail,
}: {
  habit: Habit;
  days7: { dateStr: string; label: string }[];
  selectedDate: string;
  category?: UserCategory;
  onToggle: (id: string, ds: string) => void;
  onOpenDetail: (habit: Habit) => void;
}) {
  const done = habit.completedDates.includes(selectedDate);
  const [burst, setBurst] = useState(false);
  const cardScale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    triggerHaptic.mediumImpact();
    if (!done) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      ]).start();
    }
    onToggle(habit.id, selectedDate);
  };

  const softTint = getSoftBgColor(habit.color);
  const weeklyCount = getWeeklyCompletedCount(habit.completedDates);
  const targetWeekly = habit.weeklyTargetCount || 5;
  const isWeeklyTarget = habit.frequencyType === 'weekly_target';

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }], marginHorizontal: 12, marginBottom: 14 }}>
      <LinearGradient
        colors={[softTint, '#FFFFFF']}
        start={{ x: 0.5, y: 1.0 }}
        end={{ x: 0.5, y: 0.0 }}
        style={styles.habitCardGradientContainer}
      >
        <TouchableOpacity
          style={styles.habitCardInner}
          onPress={() => {
            triggerHaptic.lightImpact();
            onOpenDetail(habit);
          }}
          activeOpacity={0.88}
        >
          {/* Top Row: Habit Name & Category Tag */}
          <View style={styles.habitTopRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                {habit.streak > 0 && (
                  <View style={styles.streakSoftBadge}>
                    <Text style={{ fontSize: 10 }}>🔥</Text>
                    <Text style={styles.streakSoftText}>{habit.streak}d</Text>
                  </View>
                )}
              </View>

              {/* Sub-label: Frequency + Category */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {category && (
                  <Text style={[styles.habitCatSubTag, { color: category.color }]}>
                    {category.name}
                  </Text>
                )}
                <Text style={styles.habitFreqSubTag}>
                  • {formatFrequencyLabel(habit)}
                </Text>
                {habit.goalDescription ? (
                  <Text style={styles.habitGoalSubTag}>
                    • {habit.goalDescription}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Quick Toggle Checkmark */}
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.75}
              style={{ marginLeft: 10, alignItems: 'center', justifyContent: 'center', padding: 4 }}
            >
              <Burst visible={burst} color={habit.color} />
              <View style={[styles.checkBtn, {
                backgroundColor: done ? '#ECFDF5' : '#F8FAFC',
                borderWidth: 0,
              }]}>
                {done ? (
                  <Check size={18} color="#10B981" strokeWidth={3} />
                ) : (
                  <View style={[styles.emptyCheckCircle, { borderColor: '#CBD5E1' }]} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Weekly Progress Bar for Weekly Target Habits */}
          {isWeeklyTarget && (
            <View style={styles.weeklyProgressBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.weeklyProgressLbl}>THIS WEEK'S TARGET</Text>
                <Text style={styles.weeklyProgressVal}>{weeklyCount} / {targetWeekly} days</Text>
              </View>
              <View style={styles.weeklyProgressTrack}>
                <View
                  style={[
                    styles.weeklyProgressFill,
                    {
                      width: `${Math.min(100, (weeklyCount / targetWeekly) * 100)}%`,
                      backgroundColor: habit.color,
                    }
                  ]}
                />
              </View>
            </View>
          )}

          {/* 7-Day Pill Grid with Fire 🔥 for done and Crying 😭 for missed */}
          <View style={styles.weekRow}>
            {days7.map((day) => {
              const isDone = habit.completedDates.includes(day.dateStr);
              const isSelectedDay = day.dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={{ alignItems: 'center', gap: 4, padding: 2 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    triggerHaptic.mediumImpact();
                    onToggle(habit.id, day.dateStr);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayPillLabel, isSelectedDay && { color: habit.color, fontFamily: FONTS.groteskBold }]}>
                    {day.label}
                  </Text>
                  <View style={[styles.emojiDayDot, {
                    backgroundColor: isDone ? habit.color + '20' : '#F8FAFC',
                    borderWidth: 0,
                  }]}>
                    <Text style={{ fontSize: 13 }}>{isDone ? '🔥' : '😭'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

// Add Habit Bottom Sheet Modal
function AddHabitModal({
  visible,
  categories,
  onClose,
  onAdd,
}: {
  visible: boolean;
  categories: UserCategory[];
  onClose: () => void;
  onAdd: (h: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => void;
}) {
  const [name, setName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [weeklyTargetCount, setWeeklyTargetCount] = useState(5);
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const slideAnim = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const toggleTargetDay = (dayIdx: number) => {
    triggerHaptic.lightImpact();
    if (targetDays.includes(dayIdx)) {
      if (targetDays.length > 1) {
        setTargetDays(targetDays.filter(d => d !== dayIdx));
      }
    } else {
      setTargetDays([...targetDays, dayIdx].sort());
    }
  };

  const doAdd = () => {
    if (!name.trim()) return;
    triggerHaptic.notificationSuccess();
    onAdd({
      name: name.trim(),
      color,
      frequencyType,
      weeklyTargetCount: frequencyType === 'weekly_target' ? weeklyTargetCount : undefined,
      targetDays: frequencyType === 'specific_days' ? targetDays : [0, 1, 2, 3, 4, 5, 6],
      completedDates: [],
      categoryId: selectedCatId || undefined,
      goalDescription: goalDescription.trim() || undefined,
    });
    setName('');
    setGoalDescription('');
    setColor(HABIT_COLORS[0]);
    onClose();
  };

  const softPreviewBg = getSoftBgColor(color);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <Animated.View style={[styles.addModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Create New Habit</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_WIDTH * 1.3 }}>
            {/* Habit Title Input */}
            <Text style={styles.sectionLbl}>HABIT TITLE</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning Walk, Read 20 pages, Drink Water..."
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                maxLength={40}
              />
            </View>

            {/* Goal Unit Description */}
            <Text style={styles.sectionLbl}>TARGET GOAL (OPTIONAL)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15 pages, 2.5 Liters, 30 mins..."
                placeholderTextColor="#94A3B8"
                value={goalDescription}
                onChangeText={setGoalDescription}
                maxLength={30}
              />
            </View>

            {/* Category Selector */}
            {categories.length > 0 && (
              <>
                <Text style={styles.sectionLbl}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {categories.map((cat) => {
                    const isSel = selectedCatId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPickChip,
                          isSel ? { backgroundColor: cat.color, borderColor: cat.color } : { backgroundColor: '#F8FAFC' }
                        ]}
                        onPress={() => {
                          triggerHaptic.lightImpact();
                          setSelectedCatId(cat.id);
                        }}
                      >
                        <Text style={[styles.catPickChipTxt, isSel && { color: '#FFFFFF' }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Target Frequency Type */}
            <Text style={styles.sectionLbl}>FREQUENCY TYPE</Text>
            <View style={styles.freqTypeRow}>
              {[
                { type: 'daily', label: 'Every Day' },
                { type: 'weekly_target', label: 'Weekly Target' },
                { type: 'specific_days', label: 'Specific Days' },
              ].map((item) => {
                const isSel = frequencyType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.freqTypePill, isSel && styles.freqTypePillActive]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setFrequencyType(item.type as HabitFrequencyType);
                    }}
                  >
                    <Text style={[styles.freqTypeTxt, isSel && styles.freqTypeTxtActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Frequency Options Detail */}
            {frequencyType === 'weekly_target' && (
              <View style={styles.freqConfigBox}>
                <Text style={styles.freqConfigTitle}>DAYS PER WEEK TARGET: {weeklyTargetCount} DAYS</Text>
                <View style={styles.stepperRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.stepperNumBtn, weeklyTargetCount === num && styles.stepperNumBtnActive]}
                      onPress={() => {
                        triggerHaptic.lightImpact();
                        setWeeklyTargetCount(num);
                      }}
                    >
                      <Text style={[styles.stepperNumTxt, weeklyTargetCount === num && styles.stepperNumTxtActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {frequencyType === 'specific_days' && (
              <View style={styles.freqConfigBox}>
                <Text style={styles.freqConfigTitle}>SELECT TARGET DAYS</Text>
                <View style={styles.daysToggleRow}>
                  {DOW_FULL.map((dayName, idx) => {
                    const isSel = targetDays.includes(idx);
                    return (
                      <TouchableOpacity
                        key={dayName}
                        style={[styles.dayToggleChip, isSel && styles.dayToggleChipActive]}
                        onPress={() => toggleTargetDay(idx)}
                      >
                        <Text style={[styles.dayToggleTxt, isSel && styles.dayToggleTxtActive]}>
                          {DOW_SINGLE[idx]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Accent Color Palette */}
            <Text style={styles.sectionLbl}>ACCENT COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {HABIT_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { triggerHaptic.lightImpact(); setColor(c); }}
                  style={[styles.colorDot, { backgroundColor: c, transform: [{ scale: color === c ? 1.2 : 1 }] }]}
                >
                  {color === c && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Card Live Preview */}
            <Text style={styles.sectionLbl}>CARD PREVIEW</Text>
            <LinearGradient
              colors={[softPreviewBg, '#FFFFFF']}
              start={{ x: 0.5, y: 1.0 }}
              end={{ x: 0.5, y: 0.0 }}
              style={styles.previewCardGradient}
            >
              <Text style={[styles.previewName, { color: '#0F172A' }]}>{name || 'Your Habit Title'}</Text>
              <Text style={styles.previewSub}>
                {goalDescription ? `${goalDescription} • ` : ''}
                {frequencyType === 'weekly_target' ? `${weeklyTargetCount}x / week` : frequencyType === 'specific_days' ? `${targetDays.length} days / week` : 'Daily'}
              </Text>
            </LinearGradient>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doAddBtn, { opacity: name.trim() ? 1 : 0.5 }]}
              onPress={doAdd}
              disabled={!name.trim()}
            >
              <Text style={styles.doAddTxt}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Main HabitTrackerView
interface Props {
  theme: ThemeConfig;
  onBackToDashboard: () => void;
}

export const HabitTrackerView: React.FC<Props> = ({ theme, onBackToDashboard }) => {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  const days7 = last7();
  const hdrAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  // Load habits and categories from Database
  const loadHabitData = async () => {
    const loadedHabits = await Database.getHabits();
    const loadedCats = await Database.getCategories();
    setHabits(loadedHabits);
    setCategories(loadedCats);
  };

  useEffect(() => {
    loadHabitData();

    Animated.stagger(100, [
      Animated.timing(hdrAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(listAnim, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleToggle = useCallback(async (id: string, ds: string) => {
    const t = todayStr();
    if (ds !== t) {
      triggerHaptic.notificationWarning();
      Alert.alert(
        'Action Locked',
        'Past and future habit records are locked to prevent streak tampering. You can only log habits for today!',
        [{ text: 'OK' }]
      );
      return;
    }
    const updated = await Database.toggleHabitDate(id, ds);
    setHabits(updated);

    // Update detail sheet habit if currently open
    if (detailHabit && detailHabit.id === id) {
      const target = updated.find(h => h.id === id);
      if (target) setDetailHabit(target);
    }
  }, [detailHabit]);

  const handleDelete = useCallback(async (id: string) => {
    const updated = await Database.deleteHabit(id);
    setHabits(updated);
    if (detailHabit?.id === id) setDetailHabit(null);
  }, [detailHabit]);

  const handleAdd = useCallback(async (data: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => {
    const updated = await Database.addHabit(data);
    setHabits(updated);
  }, []);

  const handleSelectDate = (ds: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(ds);
  };

  // Filtered Habits
  const filteredHabits = habits.filter(h => {
    const isDoneOnSelected = h.completedDates.includes(selectedDate);
    if (filter === 'completed' && !isDoneOnSelected) return false;
    if (filter === 'pending' && isDoneOnSelected) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Animated.View style={[styles.header, { opacity: hdrAnim, transform: [{ translateY: hdrAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <TouchableOpacity
          style={styles.roundBackBtn}
          onPress={() => { triggerHaptic.lightImpact(); onBackToDashboard(); }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Habit Tracker</Text>
        </View>

        <TouchableOpacity
          style={styles.neutralChipAddBtn}
          onPress={() => { triggerHaptic.lightImpact(); setShowAdd(true); }}
          activeOpacity={0.8}
        >
          <Plus size={15} color="#0F172A" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.neutralChipAddBtnTxt}>Add Habit</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.headerHairline} />

      <Animated.ScrollView style={{ flex: 1, opacity: listAnim }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Date Strip */}
        <DateStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />

        {/* Status Filter Chips */}
        <View style={styles.filterChipRow}>
          {(['all', 'pending', 'completed'] as const).map((fKey) => {
            const labels = { all: 'All Habits', pending: 'Pending', completed: 'Completed' };
            const isActive = filter === fKey;
            return (
              <TouchableOpacity
                key={fKey}
                style={[styles.filterChipPill, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => { triggerHaptic.lightImpact(); setFilter(fKey); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipTxt, isActive ? styles.filterChipTxtActive : styles.filterChipTxtInactive]}>
                  {labels[fKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Habit Cards List */}
        {filteredHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBadge}>
              <Sparkles size={26} color="#0F172A" />
            </View>
            <Text style={styles.emptyTitle}>No habits found</Text>
            <Text style={styles.emptySub}>
              {filter === 'all' ? 'Tap "+ Add Habit" to build your daily routine.' : `No habits match the "${filter}" filter for this date.`}
            </Text>
          </View>
        ) : (
          filteredHabits.map((habit, idx) => {
            const cat = categories.find(c => c.id === habit.categoryId);
            return (
              <Animated.View key={habit.id} style={{ opacity: listAnim, transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + idx * 8, 0] }) }] }}>
                <HabitCard
                  habit={habit}
                  days7={days7}
                  selectedDate={selectedDate}
                  category={cat}
                  onToggle={handleToggle}
                  onOpenDetail={(h) => setDetailHabit(h)}
                />
              </Animated.View>
            );
          })
        )}
      </Animated.ScrollView>

      {/* Habit Details Modal */}
      <HabitDetailSheet
        visible={!!detailHabit}
        habit={detailHabit}
        category={categories.find(c => c.id === detailHabit?.categoryId)}
        onClose={() => setDetailHabit(null)}
        onToggleDate={handleToggle}
        onDelete={handleDelete}
      />

      {/* Add Habit Sheet */}
      <AddHabitModal
        visible={showAdd}
        categories={categories}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header & Buttons
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  roundBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
  },
  neutralChipAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  neutralChipAddBtnTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
  },

  // Summary Deck Row
  summaryDeckRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 14,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  summaryCardLbl: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  summaryCardVal: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
  },
  summaryCardSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  summaryTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },

  // Date Strip Component
  dateStripWrapper: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  dateStripScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  unselectedDateCell: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  unselectedDayLetter: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#94A3B8',
  },
  unselectedDateNum: {
    fontFamily: FONTS.groteskBold,
    fontSize: 15,
    color: '#1E293B',
  },
  selectedCapsulePill: {
    width: 44,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  selectedPillDayLetter: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  selectedPillCircleBadge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPillDateNum: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 14,
    color: '#1E293B',
  },

  // Filter Chips Row
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
  },
  filterChipPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: '#FCE7F3',
  },
  filterChipInactive: {
    backgroundColor: '#F8FAFC',
  },
  filterChipTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  filterChipTxtActive: {
    color: '#BE185D',
  },
  filterChipTxtInactive: {
    color: '#64748B',
  },

  // Category Filter Row
  categoryFilterRow: {
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  catFilterPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catFilterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catFilterTxt: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  catFilterTxtActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.groteskBold,
  },

  // Habit Card
  habitCardGradientContainer: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  habitCardInner: {
    padding: 16,
  },
  habitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  habitCatSubTag: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  habitFreqSubTag: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  habitGoalSubTag: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#94A3B8',
  },
  streakSoftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakSoftText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#92400E',
  },
  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },

  // Weekly Progress
  weeklyProgressBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 10,
    padding: 8,
  },
  weeklyProgressLbl: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9,
    color: '#64748B',
  },
  weeklyProgressVal: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#0F172A',
  },
  weeklyProgressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 7-day pill grid
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayPillLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#64748B',
  },
  emojiDayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Habit Detail Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  detailSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  detailSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHabitName: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
  },
  detailGoalSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  detailBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailBadgeTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  detailStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  detailStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatVal: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
  },
  detailStatLbl: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heatmapInstructionText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  heatmapContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  heatmapGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  heatmapSquare: {
    width: (SCREEN_WIDTH - 110) / 10,
    height: (SCREEN_WIDTH - 110) / 10,
    maxHeight: 32,
    maxWidth: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapTodayBorder: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  heatmapSquareTxt: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#64748B',
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTxt: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#64748B',
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 14,
  },
  detailDeleteTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#EF4444',
  },

  // Add Habit Sheet
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 16,
  },
  sectionLbl: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
  },
  catPickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  catPickChipTxt: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#475569',
  },
  freqTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  freqTypePill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  freqTypePillActive: {
    backgroundColor: '#0F172A',
  },
  freqTypeTxt: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  freqTypeTxtActive: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
  },
  freqConfigBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  freqConfigTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  stepperNumBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperNumBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  stepperNumTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#475569',
  },
  stepperNumTxtActive: {
    color: '#FFFFFF',
  },
  daysToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayToggleChip: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayToggleChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  dayToggleTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#64748B',
  },
  dayToggleTxtActive: {
    color: '#FFFFFF',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardGradient: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  previewName: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
  },
  previewSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#64748B',
  },
  doAddBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  doAddTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

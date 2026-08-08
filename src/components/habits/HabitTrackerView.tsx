import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Easing, Modal, TextInput, Platform, Pressable, Dimensions,
  LayoutAnimation, UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus, Check, Flame, ChevronLeft, ChevronRight,
  ArrowLeft, Sparkles, MoreHorizontal, Trash2, CheckCircle2,
  Calendar as CalendarIcon, Filter, Zap, Award, Target,
} from 'lucide-react-native';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Habit {
  id: string;
  name: string;
  color: string;
  targetDays: number[];
  completedDates: string[];
  createdAt: string;
  notes?: string;
  streak: number;
  bestStreak: number;
}

const HABIT_COLORS = [
  '#2563EB', '#7C3AED', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#0EA5E9', '#14B8A6',
  '#F97316', '#84CC16', '#6D28D9', '#DB2777',
];

// Helper to map vivid hex colors to soft bottom gradient tints
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
  return colorMap[colorHex] || colorHex + '25';
}

const DOW_SINGLE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const t = todayStr();
  const y = dateStr(new Date(Date.now() - 86400000));
  let current = (sorted[0] === t || sorted[0] === y) ? sorted[0] : null;
  if (!current) return 0;
  let streak = 0;
  for (const d of sorted) {
    if (d === current) {
      streak++;
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);
      current = dateStr(prev);
    } else break;
  }
  return streak;
}

// Completion Burst Animation
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

// Minimalist Date Strip with Harmonized Capsule Pill & Compact Spacing
function DateStrip({
  selectedDate,
  onSelectDate,
  habits,
}: {
  selectedDate: string;
  onSelectDate: (ds: string) => void;
  habits: Habit[];
}) {
  const t = todayStr();
  const weekDays = [];
  const now = new Date();
  const dateScrollRef = useRef<ScrollView>(null);
  
  // Build 9-day view centered around current date
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
            // Selected Pill: Compact Dark Capsule (`#1E293B`), close day letter & matching inner chip badge
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

          // Unselected Date Cell
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

// Habit Card Component with Bottom-Up Soft Gradient, Zero Shadows, and 🔥/😭 Emojis
function HabitCard({ habit, days7, selectedDate, onToggle, onDelete, theme }: {
  habit: Habit;
  days7: { dateStr: string; label: string }[];
  selectedDate: string;
  onToggle: (id: string, ds: string) => void;
  onDelete: (id: string) => void;
  theme: ThemeConfig;
}) {
  const done = habit.completedDates.includes(selectedDate);
  const [burst, setBurst] = useState(false);
  const [menu, setMenu] = useState(false);
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

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }], marginHorizontal: 20, marginBottom: 14 }}>
      {/* Bottom-Up Gradient (softTint at bottom fading up to #FFFFFF at top), Zero Shadows, Zero Borders */}
      <LinearGradient
        colors={[softTint, '#FFFFFF']}
        start={{ x: 0.5, y: 1.0 }}
        end={{ x: 0.5, y: 0.0 }}
        style={styles.habitCardGradientContainer}
      >
        <View style={styles.habitCardInner}>
          <View style={styles.habitTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
            </View>

            {/* Check Button (Soft Fill Pattern, BorderWidth: 0) */}
            <TouchableOpacity onPress={handleToggle} activeOpacity={0.75} style={{ marginLeft: 10, alignItems: 'center', justifyContent: 'center' }}>
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

            {/* 3-dot Menu */}
            <TouchableOpacity onPress={() => { triggerHaptic.lightImpact(); setMenu(true); }} style={{ padding: 4, marginLeft: 4 }}>
              <MoreHorizontal size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 7-Day Pill Grid with Fire 🔥 for done and Crying 😭 for missed */}
          <View style={styles.weekRow}>
            {days7.map((day) => {
              const isDone = habit.completedDates.includes(day.dateStr);
              const isSelectedDay = day.dateStr === selectedDate;
              return (
                <View key={day.dateStr} style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.dayPillLabel, isSelectedDay && { color: habit.color, fontFamily: FONTS.groteskBold }]}>
                    {day.label}
                  </Text>
                  <View style={[styles.emojiDayDot, {
                    backgroundColor: isDone ? habit.color + '20' : '#F8FAFC',
                    borderWidth: 0,
                  }]}>
                    <Text style={{ fontSize: 13 }}>{isDone ? '🔥' : '😭'}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Context Menu Modal */}
          <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
            <Pressable style={styles.menuOverlay} onPress={() => setMenu(false)}>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenu(false); triggerHaptic.mediumImpact(); onDelete(habit.id); }}>
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={styles.menuItemTxt}>Delete Habit</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Add Habit Bottom Sheet Modal (No Icons, No Blue color on buttons)
function AddHabitModal({ visible, onClose, onAdd, theme }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (h: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => void;
  theme: ThemeConfig;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const slideAnim = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const doAdd = () => {
    if (!name.trim()) return;
    triggerHaptic.notificationSuccess();
    onAdd({ name: name.trim(), color, targetDays: [], completedDates: [], notes: '' });
    setName(''); setColor(HABIT_COLORS[0]);
    onClose();
  };

  const softPreviewBg = getSoftBgColor(color);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <Animated.View style={[styles.addModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Habit</Text>

          {/* Soft Input Fill */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Read 15 pages, Drink Water, Morning Walk..."
              placeholderTextColor="#94A3B8"
              value={name} onChangeText={setName} maxLength={40}
            />
          </View>

          <Text style={styles.sectionLbl}>SELECT ACCENT COLOR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => { triggerHaptic.lightImpact(); setColor(c); }}
                style={[styles.colorDot, { backgroundColor: c, transform: [{ scale: color === c ? 1.2 : 1 }] }]}>
                {color === c && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Live Preview Card */}
          <Text style={styles.sectionLbl}>CARD PREVIEW</Text>
          <LinearGradient
            colors={[softPreviewBg, '#FFFFFF']}
            start={{ x: 0.5, y: 1.0 }}
            end={{ x: 0.5, y: 0.0 }}
            style={styles.previewCardGradient}
          >
            <Text style={[styles.previewName, { color: '#0F172A' }]}>{name || 'Your Habit Name'}</Text>
            <View style={[styles.previewBadge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.previewBadgeTxt, { color }]}>Preview</Text>
            </View>
          </LinearGradient>

          {/* Action Buttons (No Blue Color!) */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doAddBtn, { opacity: name.trim() ? 1 : 0.5 }]}
              onPress={doAdd} disabled={!name.trim()}>
              <Text style={styles.doAddTxt}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Main HabitTrackerView
interface Props { theme: ThemeConfig; onBackToDashboard: () => void; }

export const HabitTrackerView: React.FC<Props> = ({ theme, onBackToDashboard }) => {
  const now = Date.now();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [habits, setHabits] = useState<Habit[]>([
    { id: 'h1', name: 'Morning Meditation', color: '#F59E0B', targetDays: [], completedDates: [todayStr(), dateStr(new Date(now - 86400000)), dateStr(new Date(now - 2 * 86400000))], createdAt: new Date().toISOString(), streak: 3, bestStreak: 7 },
    { id: 'h2', name: 'Daily Reading', color: '#2563EB', targetDays: [], completedDates: [dateStr(new Date(now - 86400000)), dateStr(new Date(now - 2 * 86400000)), dateStr(new Date(now - 3 * 86400000))], createdAt: new Date().toISOString(), streak: 3, bestStreak: 14 },
    { id: 'h3', name: 'Workout & Fitness', color: '#10B981', targetDays: [], completedDates: [todayStr()], createdAt: new Date().toISOString(), streak: 1, bestStreak: 5 },
    { id: 'h4', name: 'Hydration Target', color: '#0EA5E9', targetDays: [], completedDates: [todayStr(), dateStr(new Date(now - 86400000)), dateStr(new Date(now - 2 * 86400000)), dateStr(new Date(now - 3 * 86400000)), dateStr(new Date(now - 4 * 86400000))], createdAt: new Date().toISOString(), streak: 5, bestStreak: 21 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const days7 = last7();
  const hdrAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(hdrAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(listAnim, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleToggle = useCallback((id: string, ds: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const wasDone = h.completedDates.includes(ds);
      const newDates = wasDone ? h.completedDates.filter(d => d !== ds) : [...h.completedDates, ds];
      const s = computeStreak(newDates);
      return { ...h, completedDates: newDates, streak: s, bestStreak: Math.max(h.bestStreak, s) };
    }));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  const handleAdd = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => {
    setHabits(prev => [{ ...data, id: 'h_' + Date.now(), createdAt: new Date().toISOString(), streak: 0, bestStreak: 0 }, ...prev]);
  }, []);

  const handleSelectDate = (ds: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(ds);
  };

  // Filtered habits for selected date
  const filteredHabits = habits.filter(h => {
    const isDoneOnSelected = h.completedDates.includes(selectedDate);
    if (filter === 'completed') return isDoneOnSelected;
    if (filter === 'pending') return !isDoneOnSelected;
    return true;
  });

  const completedCount = habits.filter(h => h.completedDates.includes(selectedDate)).length;
  const totalCount = habits.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header: Round Back Button & Neutral Add Habit Button */}
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

        {/* Add Habit Chip Button — Neutral Soft Fill, NO BLUE COLOR! */}
        <TouchableOpacity
          style={styles.neutralChipAddBtn}
          onPress={() => { triggerHaptic.lightImpact(); setShowAdd(true); }}
          activeOpacity={0.8}
        >
          <Plus size={15} color="#0F172A" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.neutralChipAddBtnTxt}>Add Habit</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Faint Hairline Divider below Header */}
      <View style={styles.headerHairline} />

      <Animated.ScrollView style={{ flex: 1, opacity: listAnim }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Date Strip with Compact Capsule Pill Spacing & Matching Inner Chip Badge */}
        <DateStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} habits={habits} />

        {/* Filter Chips (Only 3 chips: All Habits, Pending, Completed) */}
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

        {/* Habit Cards List (Bottom-Up Gradient, Zero Shadows, Zero Borders) */}
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
          filteredHabits.map((habit, idx) => (
            <Animated.View key={habit.id} style={{ opacity: listAnim, transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + idx * 8, 0] }) }] }}>
              <HabitCard habit={habit} days7={days7} selectedDate={selectedDate} onToggle={handleToggle} onDelete={handleDelete} theme={theme} />
            </Animated.View>
          ))
        )}
      </Animated.ScrollView>

      {/* Add Habit Sheet */}
      <AddHabitModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} theme={theme} />
    </View>
  );
};

// Unified Soft-Fill Design System Styles (Zero Shadows, Zero Borders)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header & Buttons
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  roundBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
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
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  neutralChipAddBtnTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#0F172A',
  },

  // Date Strip Component
  dateStripWrapper: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  dateStripScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  // Unselected Date Cell
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
  // Selected Pill: Compact Dark Capsule (`#1E293B`) with harmonized inner chip badge
  selectedCapsulePill: {
    width: 44,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    elevation: 0,
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
    backgroundColor: '#FCA5A5', // Soft coral pill matching outer shell geometry
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPillDateNum: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 14,
    color: '#1E293B',
  },

  // Top Minimalist Daily Summary
  topSummaryBar: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 0,
  },
  topSummaryTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#64748B',
  },
  topSummaryValue: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#0F172A',
  },
  topSummaryTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  topSummaryFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },

  // Filter Chips Row
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChipPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 0,
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

  // Habit Card (Bottom-Up Soft Gradient, Zero Shadows, Zero Borders)
  habitCardGradientContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 0,
  },
  habitCardInner: {
    padding: 16,
  },
  habitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  habitName: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  streakSoftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0,
  },
  streakSoftText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#92400E',
  },
  bestStreakChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0,
  },
  bestStreakText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 10,
    color: '#475569',
  },
  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  emptyCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },

  // 7-day pill grid with Fire 🔥 / Crying 😭 Emojis
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

  // Context Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    minWidth: 180,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuItemTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#EF4444',
  },

  // Add Habit Sheet Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 18,
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 0,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
  },
  sectionLbl: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 16,
    borderWidth: 0,
    marginBottom: 20,
  },
  previewName: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 15,
  },
  previewBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewBadgeTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#475569',
  },
  doAddBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doAddTxt: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

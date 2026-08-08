import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { Task, SubjectProgress, AISyncResult, UserGamification, TaskCategory, UserCategory } from '../../types';
import { ThemeConfig, getCategoryColor, getCategoryName } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { replanTomorrowSchedule, runNightlyAISync } from '../../services/gemini';
import { Database } from '../../storage/db';
import { ProductivityMeterGauge } from './ProductivityMeterGauge';
import { ProductivityGraph } from './ProductivityGraph';
import { calculateDetailedProductivityScore, generatePersonalizedInsights } from '../../services/productivityEngine';
import { triggerHaptic } from '../../services/haptics';
import { AnalyticsEmptyIllustration } from '../common/EmptyStateIllustrations';
import { CategoryIcon } from '../common/CategoryIcon';
import { TimePickerModal } from '../common/TimePickerModal';
import {
  Key,
  Edit3,
  Trash2,
  Plus,
  Send,
  Check,
  Calendar,
  RotateCcw,
  X,
  Clock,
  Sparkles
} from 'lucide-react-native';

const CARD_WIDTH = 280;
const CARD_MARGIN = 12;
const CARD_STEP = CARD_WIDTH + CARD_MARGIN; // 292px per card step

interface Props {
  tasks: Task[];
  syllabus: SubjectProgress[];
  aiSyncResults: AISyncResult[];
  theme: ThemeConfig;
  gamification: UserGamification;
  categories: UserCategory[];
  onSyncComplete: (result: AISyncResult) => void;
  onTasksUpdated?: (updated: Task[]) => void;
}

interface EditableScheduleItem {
  id: string;
  time: string;
  activity: string;
  category: TaskCategory;
}

export const AnalyticsDashboard: React.FC<Props> = ({
  tasks,
  syllabus,
  aiSyncResults,
  theme,
  gamification,
  categories,
  onSyncComplete,
  onTasksUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [latestResult, setLatestResult] = useState<AISyncResult | null>(aiSyncResults[0] || null);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  const handleRunAISync = async () => {
    triggerHaptic.mediumImpact();
    setIsSyncingAI(true);
    const savedKey = await Database.getGeminiApiKey();
    const result = await runNightlyAISync(savedKey, tasks, syllabus, categories);
    await Database.saveAISyncResult(result);
    setLatestResult(result);
    onSyncComplete(result);
    setIsSyncingAI(false);
    triggerHaptic.notificationSuccess();
    setImportSuccessMessage('AI Productivity Analysis Generated ✨');
    setTimeout(() => setImportSuccessMessage(null), 3500);
  };

  // Active swipable insight card index & exact centering calculation
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [insightScreenWidth, setInsightScreenWidth] = useState(Dimensions.get('window').width);
  const insightScrollRef = useRef<ScrollView>(null);

  const cardPaddingHorizontal = Math.max(16, (insightScreenWidth - CARD_WIDTH) / 2);

  const handleInsightScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / CARD_STEP);
    if (index !== activeInsightIndex && index >= 0 && index <= 2) {
      setActiveInsightIndex(index);
    }
  };

  const handleDotPress = (index: number) => {
    triggerHaptic.lightImpact();
    setActiveInsightIndex(index);
    insightScrollRef.current?.scrollTo({ x: index * CARD_STEP, animated: true });
  };

  // Re-Plan Section visibility state
  const [showReplanSection, setShowReplanSection] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [isGeneratingReplan, setIsGeneratingReplan] = useState(false);

  // Directly Editable Recommended Tomorrow Plan state
  const defaultRecommendedSlots: EditableScheduleItem[] = categories.slice(0, 4).map((cat, idx) => {
    const times = ['08:00 AM - 09:30 AM', '10:00 AM - 11:30 AM', '02:00 PM - 04:30 PM', '06:00 PM - 07:00 PM'];
    return {
      id: `rec-${idx + 1}`,
      time: times[idx] || '08:00 AM - 09:00 AM',
      activity: `${cat.name} Session`,
      category: cat.id,
    };
  });

  const [recommendedPlan, setRecommendedPlan] = useState<EditableScheduleItem[]>(
    latestResult?.suggestedSchedule?.map((s, i) => ({
      id: `rec-ai-${i}`,
      time: s.time,
      activity: s.activity,
      category: s.category,
    })) || defaultRecommendedSlots
  );

  // Edit Modal State for Recommended Plan
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editCategory, setEditCategory] = useState<TaskCategory>(categories[0]?.id || '');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Dynamic category stats
  const categoryStats: Record<string, number> = {};
  categories.forEach(cat => {
    categoryStats[cat.id] = tasks.filter(t => t.category === cat.id && t.completed).reduce((acc, t) => acc + t.durationMins, 0);
  });

  // Dynamic preset prompts based on user categories
  const presetPrompts = [
    ...categories.slice(0, 2).map(c => `Focus on ${c.name} all morning`),
    'Balanced light recovery day',
    'Deep work sprint, free evening',
  ];

  const handleSaveApiKey = async () => {
    triggerHaptic.lightImpact();
    await Database.saveGeminiApiKey(apiKey);
    setShowKeyInput(false);
  };

  const handleImportSchedule = async (listToImport?: EditableScheduleItem[]) => {
    const list = listToImport || recommendedPlan;
    if (!list || list.length === 0) return;

    triggerHaptic.notificationSuccess();
    const updated = await Database.importAIScheduleToPlanner(list);
    if (onTasksUpdated) onTasksUpdated(updated);

    setImportSuccessMessage(`Added ${list.length} tasks to Planner!`);
    setTimeout(() => setImportSuccessMessage(null), 3500);
  };

  const handleGenerateCustomPlan = async (promptOverride?: string) => {
    const textToUse = promptOverride || customPromptText;
    if (!textToUse.trim()) return;

    triggerHaptic.mediumImpact();
    setIsGeneratingReplan(true);

    const savedKey = await Database.getGeminiApiKey();
    const rawGenerated = await replanTomorrowSchedule(savedKey, textToUse, tasks, syllabus, categories);

    const formatted: EditableScheduleItem[] = rawGenerated.map((item, idx) => ({
      id: `replan-${Date.now()}-${idx}`,
      time: item.time,
      activity: item.activity,
      category: item.category,
    }));

    setRecommendedPlan(formatted);
    setIsGeneratingReplan(false);
    setShowReplanSection(false);
    triggerHaptic.notificationSuccess();
  };

  const handleOpenEditSlotModal = (item: EditableScheduleItem) => {
    triggerHaptic.lightImpact();
    setEditingSlotId(item.id);
    setEditTitle(item.activity);
    setEditTime(item.time);
    setEditCategory(item.category);
    setShowEditModal(true);
  };

  const handleSaveSlotModal = () => {
    if (!editingSlotId) return;
    triggerHaptic.notificationSuccess();
    setRecommendedPlan(prev =>
      prev.map(item =>
        item.id === editingSlotId
          ? { ...item, activity: editTitle.trim(), time: editTime.trim(), category: editCategory }
          : item
      )
    );
    setShowEditModal(false);
    setEditingSlotId(null);
  };

  const handleDeleteSlotModal = () => {
    if (!editingSlotId) return;
    triggerHaptic.mediumImpact();
    setRecommendedPlan(prev => prev.filter(item => item.id !== editingSlotId));
    setShowEditModal(false);
    setEditingSlotId(null);
  };

  const handleAddSlot = () => {
    triggerHaptic.lightImpact();
    const newItem: EditableScheduleItem = {
      id: `custom-add-${Date.now()}`,
      time: '04:00 PM - 05:00 PM',
      activity: 'New Planned Task',
      category: 'Personal',
    };
    setRecommendedPlan(prev => [...prev, newItem]);
    handleOpenEditSlotModal(newItem);
  };

  // Calculate dynamic multi-component productivity score
  const scoreBreakdown = calculateDetailedProductivityScore(
    tasks,
    [], // activity logs
    [], // pomodoros
    categories,
    gamification.streakDays
  );

  const dynamicInsights = generatePersonalizedInsights(
    tasks,
    [],
    [],
    categories,
    scoreBreakdown
  );

  const currentScore = latestResult?.productivityScore ?? scoreBreakdown.totalScore;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const totalFocusMins = tasks.filter(t => t.completed).reduce((acc, t) => acc + (t.durationMins || 60), 0);

  const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategory && topCategory[1] > 0 ? getCategoryName(categories, topCategory[0]) : null;

  const hasInsights = tasks.length > 0 || latestResult !== null;

  const timePresets = [
    '08:00 AM - 09:30 AM',
    '10:00 AM - 11:30 AM',
    '02:00 PM - 04:30 PM',
    '06:00 PM - 07:30 PM',
  ];

  return (
    <View style={styles.mainContainer}>
      {/* Top Header Bar matching Planner & Academic Hub */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={styles.headerTitle}>Analytics & AI</Text>
          <Text style={styles.headerSubtitle}>Productivity insights & custom re-planner</Text>
        </View>

        <TouchableOpacity
          style={styles.keyBtnPill}
          onPress={() => setShowKeyInput(!showKeyInput)}
          activeOpacity={0.8}
        >
          <Key size={14} color="#0F172A" />
          <Text style={styles.keyBtnPillText}>API Key</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* API Key Drawer */}
        {showKeyInput && (
          <View style={styles.keyContainer}>
            <Text style={styles.keyLabel}>Google Gemini API Key (Optional):</Text>
            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                placeholder="AIzaSy..."
                placeholderTextColor="#9CA3AF"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
              <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveApiKey}>
                <Text style={styles.saveKeyText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Success Notification Banner */}
        {importSuccessMessage && (
          <View style={styles.successBanner}>
            <Check size={14} color="#10B981" />
            <Text style={styles.successBannerText}>{importSuccessMessage}</Text>
          </View>
        )}

        {/* 1. PRODUCTIVITY SCORE METER */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionHeading}>Productivity Score Meter</Text>
          <ProductivityMeterGauge score={currentScore} size={260} />
        </View>

        {/* Faint Divider */}
        <View style={styles.sectionDivider} />

        {/* 2. PRODUCTIVITY GRAPH (New Vertical Pill-Bar Design, Zero Borders) */}
        <View style={styles.sectionSpacing}>
          <ProductivityGraph tasks={tasks} />
        </View>

        {/* Faint Divider */}
        <View style={styles.sectionDivider} />

        {/* 3. AI PRODUCTIVITY INSIGHTS (Modern Soft Deck Swiper) */}
        <View style={styles.sectionSpacing}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.sectionHeadingLeft}>AI Productivity Insights</Text>
            <TouchableOpacity
              style={styles.runAiAnalysisBtn}
              onPress={handleRunAISync}
              disabled={isSyncingAI}
              activeOpacity={0.8}
            >
              {isSyncingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.runAiAnalysisText}>Run AI Analysis</Text>
              )}
            </TouchableOpacity>
          </View>

          {!hasInsights ? (
            <View style={styles.emptyInsightsCard}>
              <AnalyticsEmptyIllustration size={130} />
              <Text style={styles.emptyInsightsTitle}>No AI Insights Available Yet</Text>
              <Text style={styles.emptyInsightsBody}>
                Add tasks to your daily planner or tap "Run AI Analysis" to generate your personalized productivity evaluation.
              </Text>
            </View>
          ) : (
            <View
              style={styles.swipableStage}
              onLayout={(e) => setInsightScreenWidth(e.nativeEvent.layout.width)}
            >
              {/* Horizontally Swipable Modern Deck with Exact Centering Snap */}
              <ScrollView
                ref={insightScrollRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={CARD_STEP}
                snapToAlignment="center"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={handleInsightScroll}
                scrollEventThrottle={16}
                contentContainerStyle={[
                  styles.swipableInsightScroll,
                  { paddingHorizontal: cardPaddingHorizontal }
                ]}
              >
                {/* CARD 1: Key Takeaway (Soft Indigo Deck) */}
                <View style={[styles.swipableInsightCard, { backgroundColor: '#EEF2FF' }]}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={[styles.cardTagHeader, { color: '#1E40AF' }]}>✦ KEY TAKEAWAY</Text>
                    <View style={[styles.cardInnerPill, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[styles.cardInnerPillText, { color: '#3730A3' }]}>
                        {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}% Complete` : '0% Complete'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardBigMetric, { color: '#1E1B4B' }]}>Daily Momentum</Text>
                  <Text style={[styles.cardBodyText, { color: '#374151' }]}>
                    {latestResult
                      ? latestResult.keyTakeaway
                      : tasks.length > 0
                      ? `Completed ${completedCount} out of ${tasks.length} planned tasks. Keep up the momentum!`
                      : 'No activity logged today. Add tasks to your planner to generate personalized insights.'}
                  </Text>
                </View>

                {/* CARD 2: Peak Focus Window (Soft Violet Deck) */}
                <View style={[styles.swipableInsightCard, { backgroundColor: '#F5F3FF' }]}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={[styles.cardTagHeader, { color: '#6D28D9' }]}>⚡ PEAK FOCUS WINDOW</Text>
                    <View style={[styles.cardInnerPill, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[styles.cardInnerPillText, { color: '#5B21B6' }]}>
                        {topCategoryName ? `${topCategory[1]}m Focus` : 'Standby'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardBigMetric, { color: '#2E1065' }]}>Concentration Peak</Text>
                  <Text style={[styles.cardBodyText, { color: '#374151' }]}>
                    {topCategoryName
                      ? `Highest focus concentration achieved in ${topCategoryName} category.`
                      : 'No focus sessions completed yet. Mark tasks as completed to track peak focus.'}
                  </Text>
                </View>

                {/* CARD 3: Bottleneck Risk (Soft Amber Deck) */}
                <View style={[styles.swipableInsightCard, { backgroundColor: '#FFFBEB' }]}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={[styles.cardTagHeader, { color: '#B45309' }]}>⚠️ BOTTLENECK ANALYSIS</Text>
                    <View style={[styles.cardInnerPill, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.cardInnerPillText, { color: '#92400E' }]}>
                        {pendingCount > 0 ? `${pendingCount} Backlog` : 'Optimal'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardBigMetric, { color: '#451A03' }]}>Workload Evaluation</Text>
                  <Text style={[styles.cardBodyText, { color: '#374151' }]}>
                    {pendingCount > 0
                      ? `${pendingCount} pending task(s) remaining today. Consider breaking them into 25m Pomodoro blocks.`
                      : 'Zero bottleneck risks detected. All planned items are on track!'}
                  </Text>
                </View>
              </ScrollView>

              {/* Tappable Modern Pagination Dots */}
              <View style={styles.paginationDotsRow}>
                {[0, 1, 2].map((idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleDotPress(idx)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.dot, activeInsightIndex === idx && styles.dotActive]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Faint Divider */}
        <View style={styles.sectionDivider} />

        {/* 4. RECOMMENDED TOMORROW PLAN (Directly Editable Slots) */}
        <View style={styles.sectionSpacing}>
          <View style={styles.planHeaderRow}>
            <View>
              <Text style={styles.sectionHeadingLeft}>Recommended Tomorrow Plan</Text>
              <Text style={styles.focusSubtitleLeft}>
                Focus: {latestResult ? latestResult.nextDayFocus : 'Graph algorithms & video editing assembly'}
              </Text>
            </View>

            <TouchableOpacity style={styles.addSlotPillBtn} onPress={handleAddSlot}>
              <Plus size={14} color="#2563EB" />
              <Text style={styles.addSlotPillText}>Add Slot</Text>
            </TouchableOpacity>
          </View>

          {/* Editable Plan Slots List */}
          <View style={styles.suggestedContainer}>
            {recommendedPlan.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={styles.planSlotCard}
                onPress={() => handleOpenEditSlotModal(slot)}
                activeOpacity={0.8}
              >
                <View style={styles.slotDisplayRow}>
                  <View style={styles.slotLeftBar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTime}>{slot.time}</Text>
                    <Text style={styles.slotActivity}>{slot.activity}</Text>
                  </View>

                  <View style={styles.slotCategoryTag}>
                    <Text style={styles.slotCategoryTagText}>{slot.category}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => handleOpenEditSlotModal(slot)}
                  >
                    <Edit3 size={15} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons: Add to Planner & Re-Plan */}
          <View style={styles.planActionRow}>
            <TouchableOpacity
              style={styles.addToPlannerBtn}
              onPress={() => handleImportSchedule()}
              activeOpacity={0.85}
            >
              <Calendar size={15} color="#FFFFFF" />
              <Text style={styles.addToPlannerBtnText}>Add to Planner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.replanActionBtn}
              onPress={() => {
                triggerHaptic.mediumImpact();
                setShowReplanSection(!showReplanSection);
              }}
              activeOpacity={0.85}
            >
              <RotateCcw size={15} color="#2563EB" />
              <Text style={styles.replanActionBtnText}>Re-Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. RE-PLAN SECTION */}
        {showReplanSection && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.replanSection}>
              <Text style={styles.sectionHeadingLeft}>Custom AI Re-Plan</Text>
              <Text style={styles.replanSub}>
                Type your specific schedule preferences for tomorrow:
              </Text>

              <View style={styles.promptInputWrapper}>
                <TextInput
                  style={styles.promptTextInput}
                  placeholder="e.g., 3 hours on core work projects, 2 hours on skill learning, and keep evening free after 6 PM..."
                  placeholderTextColor="#9CA3AF"
                  value={customPromptText}
                  onChangeText={setCustomPromptText}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Text style={styles.presetHeading}>Quick Presets:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {presetPrompts.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setCustomPromptText(preset);
                    }}
                  >
                    <Text style={styles.presetChipText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.generateBtn, isGeneratingReplan && styles.generateBtnDisabled]}
                onPress={() => handleGenerateCustomPlan()}
                disabled={isGeneratingReplan || !customPromptText.trim()}
                activeOpacity={0.85}
              >
                {isGeneratingReplan ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={15} color="#FFFFFF" />
                )}
                <Text style={styles.generateBtnText}>
                  {isGeneratingReplan ? 'AI Building Plan...' : 'Build Custom Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* RICH EDIT SLOT MODAL SHEET */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />

          <View style={styles.modalSheetContainer}>
            {/* Sheet Handle & Header */}
            <View style={styles.sheetDragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Schedule Slot</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowEditModal(false)}
              >
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Input Form Fields */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.modalLabel}>Activity Title</Text>
              <TextInput
                style={styles.modalTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="e.g., Deep Focus & Project Sprint"
                placeholderTextColor="#94A3B8"
              />

              {/* Time Range Selector */}
              <Text style={styles.modalLabel}>Scheduled Start Time</Text>
              <TouchableOpacity
                style={styles.timeCardTrigger}
                onPress={() => {
                  triggerHaptic.lightImpact();
                  setShowTimePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Clock size={16} color="#2563EB" />
                <Text style={styles.timeCardText}>{editTime || '08:00 AM'}</Text>
              </TouchableOpacity>

              {/* Quick Time Presets */}
              <View style={styles.timePresetsRow}>
                {timePresets.map((tPreset) => (
                  <TouchableOpacity
                    key={tPreset}
                    style={[
                      styles.timePresetChip,
                      editTime === tPreset && styles.timePresetChipActive,
                    ]}
                    onPress={() => {
                      triggerHaptic.lightImpact();
                      setEditTime(tPreset);
                    }}
                  >
                    <Text
                      style={[
                        styles.timePresetText,
                        editTime === tPreset && styles.timePresetTextActive,
                      ]}
                    >
                      {tPreset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Choice Pills */}
              <Text style={styles.modalLabel}>Category Tag</Text>
              <View style={styles.categoryPillsRow}>
                {categories.map((cat) => {
                  const isCatSelected = editCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChoicePill,
                        isCatSelected && styles.categoryChoicePillActive,
                      ]}
                      onPress={() => {
                        triggerHaptic.lightImpact();
                        setEditCategory(cat.id);
                      }}
                    >
                      {isCatSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                      <CategoryIcon name={cat.icon} size={14} color={isCatSelected ? '#FFFFFF' : '#475569'} style={{ marginRight: 4 }} />
                      <Text
                        style={[
                          styles.categoryChoiceText,
                          isCatSelected && styles.categoryChoiceTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={handleDeleteSlotModal}
                >
                  <Trash2 size={16} color="#DC2626" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveSlotModal}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.modalSaveText}>Save Slot</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Native Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        initialTimeStr={editTime}
        title="Select Scheduled Time"
        onSelectTime={(timeStr) => setEditTime(timeStr)}
        onClose={() => setShowTimePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    // M3 Top App Bar: surfaceContainer bg
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    // M3 outlineVariant divider
    borderBottomColor: '#E7E0EC',
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  keyBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    // M3 Tonal Button (assist chip style)
    backgroundColor: '#E7E0EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  keyBtnPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    letterSpacing: 0.1,
    color: '#1C1B1F',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  keyContainer: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  keyLabel: {
    fontSize: 11,
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    marginBottom: 6,
  },
  keyInputRow: {
    flexDirection: 'row',
  },
  keyInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  saveKeyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: 'center',
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#2563EB',
  },
  saveKeyText: {
    color: '#FFFFFF',
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  successBannerText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#065F46',
    marginLeft: 6,
  },
  sectionSpacing: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionHeadingLeft: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runAiAnalysisBtn: {
    // M3 Filled Button: primary bg, 20dp radius
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
    minHeight: 40,
  },
  runAiAnalysisText: {
    fontFamily: FONTS.groteskBold,
    // M3 labelLarge: 14sp, +0.1 tracking
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#FFFFFF',
  },
  emptyInsightsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyInsightsTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyInsightsBody: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Swipable Insights Deck
  swipableStage: {
    marginVertical: 4,
  },
  swipableInsightScroll: {
    paddingVertical: 4,
  },
  swipableInsightCard: {
    width: 280,
    // M3 Filled Card: extraLarge radius (28dp), outlineVariant border
    borderRadius: 28,
    padding: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E7E0EC',
    // M3 level 1 elevation (subtle tonal shadow)
    shadowColor: '#49454F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTagHeader: {
    fontFamily: FONTS.groteskBold,
    // M3 labelSmall: 11sp, +0.5 tracking
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardInnerPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    // M3 suggestion chip pill radius
    borderRadius: 20,
  },
  cardInnerPillText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardBigMetric: {
    fontFamily: FONTS.displayBold,
    // M3 titleLarge: 22sp
    fontSize: 20,
    marginBottom: 8,
    letterSpacing: 0,
  },
  cardBodyText: {
    fontFamily: FONTS.groteskRegular,
    // M3 bodyMedium: 14sp, +0.25 tracking
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // M3 outlineVariant color for inactive dots
    backgroundColor: '#CAC4D0',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#2563EB',
  },

  // Recommended Plan Styles
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  focusSubtitleLeft: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addSlotPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    // M3 Tonal button (secondary container)
    backgroundColor: '#E8DEF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  addSlotPillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    letterSpacing: 0.1,
    // M3 onSecondaryContainer
    color: '#1D192B',
  },
  suggestedContainer: {
    marginVertical: 6,
  },
  planSlotCard: {
    // M3 List item: surfaceContainerLow bg, medium radius (12dp)
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E7E0EC',
  },
  slotDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotLeftBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginRight: 12,
  },
  slotTime: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  slotActivity: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 1,
  },
  slotCategoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  slotCategoryTagText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#2563EB',
  },
  actionIconButton: {
    padding: 6,
    marginLeft: 2,
  },
  planActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addToPlannerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // M3 Filled Button: primary, 20dp pill, 40dp min height
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  addToPlannerBtnText: {
    fontFamily: FONTS.groteskBold,
    // M3 labelLarge: 14sp, +0.1 tracking
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  replanActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // M3 Outlined Button: transparent bg, outline border, primary text
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CAC4D0',
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 6,
  },
  replanActionBtnText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#2563EB',
    marginLeft: 6,
  },
  replanSection: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  replanSub: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    marginTop: 2,
  },
  promptInputWrapper: {
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginBottom: 10,
  },
  promptTextInput: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 52,
    textAlignVertical: 'top',
  },
  presetHeading: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
    marginBottom: 6,
  },
  presetScroll: {
    marginBottom: 14,
  },
  presetChip: {
    // M3 Suggestion chip: pill radius, surfaceVariant bg
    backgroundColor: '#E7E0EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
  },
  presetChipText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    // M3 onSurfaceVariant
    color: '#49454F',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // M3 Filled Button: primary, 20dp pill
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  generateBtnDisabled: {
    opacity: 0.38,
  },
  generateBtnText: {
    fontFamily: FONTS.groteskBold,
    // M3 labelLarge
    fontSize: 14,
    letterSpacing: 0.1,
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // RICH EDIT MODAL SHEET STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  sheetDragHandle: {
    // M3 drag handle: 32×4dp, outlineVariant color
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CAC4D0',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    // M3 Icon Button: surfaceVariant bg
    backgroundColor: '#E7E0EC',
  },
  modalLabel: {
    fontFamily: FONTS.groteskMedium,
    // M3 labelMedium: 12sp, +0.5 tracking
    fontSize: 12,
    color: '#49454F',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalTitleInput: {
    // M3 Outlined Text Field: 4dp radius, outline border
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CAC4D0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 15,
    color: '#1C1B1F',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.groteskMedium,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  timePresetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timePresetChipActive: {
    backgroundColor: '#EFF6FF',
  },
  timePresetText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#475569',
  },
  timePresetTextActive: {
    fontFamily: FONTS.groteskBold,
    color: '#2563EB',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    marginTop: 2,
  },
  categoryChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryChoicePillActive: {
    backgroundColor: '#2563EB',
  },
  categoryChoiceText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#475569',
  },
  categoryChoiceTextActive: {
    fontFamily: FONTS.groteskBold,
    color: '#FFFFFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  modalDeleteText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#DC2626',
  },
  modalSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  modalSaveText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  timeCardText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#2563EB',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
    width: '100%',
  },
});

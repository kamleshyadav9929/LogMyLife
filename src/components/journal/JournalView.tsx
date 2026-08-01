import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { JournalEntry, MoodType, TaskCategory } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { triggerHaptic } from '../../services/haptics';
import { JournalEmptyIllustration } from '../common/EmptyStateIllustrations';
import {
  Flame,
  Brain,
  Smile,
  Coffee,
  Plus,
  Check,
  Search,
  Trash2,
  Filter,
  AlertCircle,
  BookOpen,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';

interface Props {
  entries: JournalEntry[];
  theme: ThemeConfig;
  onSaveEntry: (updated: JournalEntry[]) => void;
  onCloseModal?: () => void;
}

interface CategorizedWin {
  text: string;
  category: TaskCategory;
}

const getEntryScore = (entry: JournalEntry): number => {
  if ((entry as any).productivityScore !== undefined) {
    return (entry as any).productivityScore;
  }
  let baseScore = 75;
  if (entry.mood === 'deep_work') baseScore = 88;
  else if (entry.mood === 'energized') baseScore = 85;
  else if (entry.mood === 'content') baseScore = 78;
  else if (entry.mood === 'tired') baseScore = 65;

  const winBonus = (entry.wins?.length || 0) * 5;
  const blockerPenalty = (entry.blockers?.length || 0) * 4;
  const reflectionBonus = entry.reflections && entry.reflections.length > 40 ? 5 : 0;

  return Math.min(100, Math.max(35, baseScore + winBonus - blockerPenalty + reflectionBonus));
};

const formatLogDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  ) {
    return 'Today, ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (
    dateObj.getFullYear() === yesterday.getFullYear() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday, ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const JournalView: React.FC<Props> = ({ entries, theme, onSaveEntry, onCloseModal }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('deep_work');
  const [reflectionText, setReflectionText] = useState('');
  const [winInput, setWinInput] = useState('');
  const [selectedWinCategory, setSelectedWinCategory] = useState<TaskCategory>('DSA');
  const [winsList, setWinsList] = useState<CategorizedWin[]>([]);
  const [blockerInput, setBlockerInput] = useState('');
  const [blockersList, setBlockersList] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | MoodType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // NO PURPLE COLORS anywhere - Clean Slate & Vibrant Non-Purple Palette
  const moods: {
    type: MoodType;
    label: string;
    icon: any;
    accentColor: string;
    activeText: string;
  }[] = [
    {
      type: 'energized',
      label: 'Energized',
      icon: Flame,
      accentColor: '#D97706',
      activeText: '#B45309',
    },
    {
      type: 'deep_work',
      label: 'Deep Work',
      icon: Brain,
      accentColor: '#2563EB',
      activeText: '#1D4ED8',
    },
    {
      type: 'content',
      label: 'Content',
      icon: Smile,
      accentColor: '#059669',
      activeText: '#047857',
    },
    {
      type: 'tired',
      label: 'Tired',
      icon: Coffee,
      accentColor: '#64748B',
      activeText: '#475569',
    },
  ];

  const categories: TaskCategory[] = ['DSA', 'College', 'Documentary', 'Personal'];

  // NO PURPLE - DSA uses Slate Blue / Cyan
  const categoryColors: Record<TaskCategory, { bg: string; text: string }> = {
    DSA: { bg: '#E0F2FE', text: '#0284C7' },
    College: { bg: '#F1F5F9', text: '#0F172A' },
    Documentary: { bg: '#E0E7FF', text: '#3730A3' },
    Personal: { bg: '#ECFDF5', text: '#059669' },
  };

  const reflectionTemplates = [
    'Completed all high-priority work tasks efficiently',
    'Maintained 3+ hours of uninterrupted deep focus',
    'Learned a new skill concept and took structured notes',
    'Finished key project milestones ahead of schedule',
    'Balanced work sprints with refreshing rest breaks',
    'Achieved daily focus target and maintained positive momentum',
  ];

  const handleAddWin = () => {
    if (winInput.trim()) {
      triggerHaptic.lightImpact();
      setWinsList([...winsList, { text: winInput.trim(), category: selectedWinCategory }]);
      setWinInput('');
    }
  };

  const handleRemoveWin = (index: number) => {
    triggerHaptic.lightImpact();
    setWinsList(winsList.filter((_, i) => i !== index));
  };

  const handleAddBlocker = () => {
    if (blockerInput.trim()) {
      triggerHaptic.lightImpact();
      setBlockersList([...blockersList, blockerInput.trim()]);
      setBlockerInput('');
    }
  };

  const handleRemoveBlocker = (index: number) => {
    triggerHaptic.lightImpact();
    setBlockersList(blockersList.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = (template: string) => {
    triggerHaptic.lightImpact();
    if (reflectionText.length > 0) {
      setReflectionText((prev) => `${prev}\n• ${template}`);
    } else {
      setReflectionText(`• ${template}`);
    }
  };

  const handleSubmitJournal = async () => {
    if (!reflectionText.trim() && winsList.length === 0) {
      Alert.alert('Empty Entry', 'Please write a reflection or add at least one win before saving.');
      return;
    }
    triggerHaptic.notificationSuccess();

    const winsFormatted = winsList.map((w) => `[${w.category}] ${w.text}`);

    const newEntry = {
      dateStr: new Date().toISOString().split('T')[0],
      mood: selectedMood,
      reflections: reflectionText || 'Logged daily reflections & mindset notes.',
      wins: winsFormatted,
      blockers: blockersList,
    };

    const updated = await Database.saveJournalEntry(newEntry);
    onSaveEntry(updated);
    setReflectionText('');
    setWinsList([]);
    setBlockersList([]);
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
      if (onCloseModal) onCloseModal();
    }, 1800);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to remove this reflection log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic.mediumImpact();
            const updated = await Database.deleteJournalEntry(entryId);
            onSaveEntry(updated);
          },
        },
      ]
    );
  };

  const filteredEntries = entries.filter((e) => {
    const matchesFilter = historyFilter === 'all' || e.mood === historyFilter;
    const matchesSearch =
      searchQuery === '' ||
      e.reflections.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.wins && e.wins.some((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (e.blockers && e.blockers.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Banner */}
      {showSuccessToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>Reflection Saved Successfully!</Text>
        </View>
      )}

      {/* Clean Minimal Section Header with Faint Header Underline */}
      <View style={styles.topTitleHeader}>
        <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>Life Log</Text>
        <Text style={[styles.mainSubheading, { color: theme.textMuted }]}>
          Document wins and track your mindset
        </Text>
      </View>

      {/* 1. Primary Mood Today - UNBOXED (NO CARD BOXES COVERING THEM) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Primary Mood Today</Text>
      </View>

      {/* Unboxed Horizontal Row of Mood Options */}
      <View style={styles.unboxedMoodRow}>
        {moods.map((m) => {
          const IconComp = m.icon;
          const isSelected = selectedMood === m.type;

          return (
            <TouchableOpacity
              key={m.type}
              style={styles.unboxedMoodItem}
              onPress={() => {
                triggerHaptic.lightImpact();
                setSelectedMood(m.type);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.unboxedIconDot,
                  {
                    backgroundColor: isSelected ? m.accentColor : '#F1F5F9',
                  },
                ]}
              >
                <IconComp size={16} color={isSelected ? '#FFFFFF' : '#64748B'} />
              </View>
              <Text
                style={[
                  styles.unboxedMoodLabel,
                  {
                    color: isSelected ? m.activeText : theme.textMuted,
                    fontFamily: isSelected ? FONTS.groteskBold : FONTS.groteskMedium,
                  },
                ]}
              >
                {m.label}
              </Text>
              {isSelected && <View style={[styles.activeUnderline, { backgroundColor: m.accentColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Daily Notes & Reflections with Quick Templates */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Notes & Reflections</Text>
        <TouchableOpacity
          style={styles.templateToggleInline}
          onPress={() => {
            triggerHaptic.lightImpact();
            setShowTemplates(!showTemplates);
          }}
        >
          <BookOpen size={12} color="#64748B" />
          <Text style={styles.templateToggleText}>Quick Prompts</Text>
          {showTemplates ? <ChevronUp size={12} color="#64748B" /> : <ChevronDown size={12} color="#64748B" />}
        </TouchableOpacity>
      </View>

      {/* Collapsible 1-Tap Quick Reflection Chips */}
      {showTemplates && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {reflectionTemplates.map((t, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.templateChip}
              onPress={() => handleApplyTemplate(t)}
              activeOpacity={0.7}
            >
              <Text style={styles.templateChipText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TextInput
        style={[
          styles.textArea,
          {
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
            borderColor: theme.cardBorder,
          },
        ]}
        placeholder="What went well today? What challenges did you solve?"
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={4}
        value={reflectionText}
        onChangeText={setReflectionText}
      />

      {/* 3. Today's Wins & Accomplishment (NO PURPLE, NO OUTER BORDER TO CHIPS) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Wins & Accomplishments</Text>
      </View>

      {/* Category Pills (No Purple) */}
      <View style={styles.categoryPillRow}>
        {categories.map((cat) => {
          const isSelected = selectedWinCategory === cat;
          const catStyle = categoryColors[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChipBorderless,
                {
                  backgroundColor: isSelected ? catStyle.bg : '#F1F5F9',
                },
              ]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setSelectedWinCategory(cat);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: isSelected ? catStyle.text : '#64748B',
                    fontFamily: isSelected ? FONTS.groteskBold : FONTS.groteskMedium,
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add Win Input */}
      <View style={styles.inputAddRow}>
        <TextInput
          style={[
            styles.singleInput,
            {
              backgroundColor: theme.cardBg,
              color: theme.textPrimary,
              borderColor: theme.cardBorder,
            },
          ]}
          placeholder={`Add win in ${selectedWinCategory}...`}
          placeholderTextColor={theme.textMuted}
          value={winInput}
          onChangeText={setWinInput}
          onSubmitEditing={handleAddWin}
        />
        <TouchableOpacity
          style={[styles.addSmallBtn, { backgroundColor: '#0F172A' }]}
          onPress={handleAddWin}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Wins Chips - NO OUTER BORDER, NO PURPLE */}
      {winsList.map((win, idx) => {
        const catStyle = categoryColors[win.category];
        return (
          <View key={idx} style={[styles.winChipRowBorderless, { backgroundColor: '#F8FAFC' }]}>
            <View style={[styles.miniCategoryBadgeBorderless, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.miniCategoryText, { color: catStyle.text }]}>{win.category}</Text>
            </View>
            <Text style={[styles.winChipText, { color: theme.textPrimary }]}>{win.text}</Text>
            <TouchableOpacity onPress={() => handleRemoveWin(idx)} style={styles.chipRemoveBtn}>
              <Trash2 size={13} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* 4. Blockers & Areas to Improve - NO OUTER BORDER TO CHIPS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Blockers & Areas to Improve</Text>
      </View>

      <View style={styles.inputAddRow}>
        <TextInput
          style={[
            styles.singleInput,
            {
              backgroundColor: theme.cardBg,
              color: theme.textPrimary,
              borderColor: theme.cardBorder,
            },
          ]}
          placeholder="e.g. Lost focus during afternoon revision..."
          placeholderTextColor={theme.textMuted}
          value={blockerInput}
          onChangeText={setBlockerInput}
          onSubmitEditing={handleAddBlocker}
        />
        <TouchableOpacity
          style={[styles.addSmallBtn, { backgroundColor: '#EF4444' }]}
          onPress={handleAddBlocker}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Blockers Chips - NO OUTER BORDER */}
      {blockersList.map((blocker, idx) => (
        <View key={idx} style={[styles.blockerChipRowBorderless, { backgroundColor: '#FEF2F2' }]}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.blockerChipText}>{blocker}</Text>
          <TouchableOpacity onPress={() => handleRemoveBlocker(idx)} style={styles.chipRemoveBtn}>
            <Trash2 size={13} color="#F87171" />
          </TouchableOpacity>
        </View>
      ))}

      {/* 5. Save Reflection Button */}
      <TouchableOpacity
        onPress={handleSubmitJournal}
        activeOpacity={0.85}
        style={[styles.submitBtnClean, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.submitBtnCleanText}>Save Reflection</Text>
      </TouchableOpacity>

      {/* 6. Completely Redesigned Previous Daily Logs Section */}
      <View style={styles.redesignedHistorySection}>
        <View style={styles.historyTopRow}>
          <Text style={[styles.historyHeading, { color: theme.textPrimary }]}>Previous Daily Logs</Text>
          <Text style={[styles.historyCountText, { color: theme.textMuted }]}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {/* Minimal Search & Filter Bar */}
        <View style={styles.filterSearchContainer}>
          <View style={[styles.searchBoxMinimal, { backgroundColor: '#F8FAFC' }]}>
            <Search size={13} color="#94A3B8" />
            <TextInput
              style={styles.searchInputMinimal}
              placeholder="Search logs..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollMinimal}>
            <TouchableOpacity
              style={[
                styles.filterPillMinimal,
                { backgroundColor: historyFilter === 'all' ? '#0F172A' : '#F1F5F9' },
              ]}
              onPress={() => {
                triggerHaptic.lightImpact();
                setHistoryFilter('all');
              }}
            >
              <Text style={{ color: historyFilter === 'all' ? '#FFFFFF' : '#64748B', fontFamily: FONTS.groteskBold, fontSize: 10 }}>
                All
              </Text>
            </TouchableOpacity>

            {moods.map((m) => {
              const isSelected = historyFilter === m.type;
              return (
                <TouchableOpacity
                  key={m.type}
                  style={[
                    styles.filterPillMinimal,
                    { backgroundColor: isSelected ? m.accentColor : '#F1F5F9' },
                  ]}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setHistoryFilter(m.type);
                  }}
                >
                  <Text style={{ color: isSelected ? '#FFFFFF' : '#64748B', fontFamily: FONTS.groteskBold, fontSize: 10 }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Redesigned Log Cards showing date & score, expanding on click */}
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyLogsView}>
            <JournalEmptyIllustration size={120} />
            <Text style={styles.emptyLogsText}>No reflections logged yet</Text>
            <Text style={{ fontFamily: FONTS.groteskRegular, fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
              Write your first daily reflection log above to record your wins and mindset.
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const score = getEntryScore(entry);
            const isExpanded = expandedEntryId === entry.id;
            const moodObj = moods.find((m) => m.type === entry.mood) || moods[1];
            const IconComp = moodObj.icon;
            const formattedDateStr = formatLogDate(entry.dateStr);

            let scoreColor = '#059669';
            let scoreBg = '#ECFDF5';
            let scoreLabel = 'Great';

            if (score >= 90) {
              scoreColor = '#059669';
              scoreBg = '#ECFDF5';
              scoreLabel = 'Excellent';
            } else if (score >= 75) {
              scoreColor = '#2563EB';
              scoreBg = '#EFF6FF';
              scoreLabel = 'Good';
            } else if (score >= 60) {
              scoreColor = '#D97706';
              scoreBg = '#FFFBEB';
              scoreLabel = 'Average';
            } else {
              scoreColor = '#DC2626';
              scoreBg = '#FEF2F2';
              scoreLabel = 'Low';
            }

            return (
              <View key={entry.id} style={styles.historyLogCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.dateScoreRowCard,
                    isExpanded && styles.dateScoreRowCardActive,
                    { backgroundColor: theme.cardBg, borderColor: isExpanded ? theme.textPrimary : theme.cardBorder },
                  ]}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    setExpandedEntryId(isExpanded ? null : entry.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.dateRowLeft}>
                    <View style={[styles.sleekMoodDot, { backgroundColor: moodObj.accentColor }]} />
                    <Text style={[styles.dateRowTitle, { color: theme.textPrimary }]}>{formattedDateStr}</Text>
                  </View>

                  <View style={styles.dateRowRight}>
                    <View style={[styles.scorePillBadge, { backgroundColor: scoreBg }]}>
                      <Text style={[styles.scorePillText, { color: scoreColor }]}>{score} / 100</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color={theme.textPrimary} />
                    ) : (
                      <ChevronDown size={16} color="#94A3B8" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Beautiful Expanded Log Details */}
                {isExpanded && (
                  <View style={[styles.expandedDetailCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.detailHeaderBar}>
                      <View style={styles.detailMoodBadge}>
                        <IconComp size={14} color={moodObj.accentColor} />
                        <Text style={[styles.detailMoodText, { color: moodObj.activeText }]}>
                          {moodObj.label} Mood
                        </Text>
                      </View>

                      <View style={styles.detailRightActions}>
                        <View style={[styles.detailStatusBadge, { backgroundColor: scoreBg }]}>
                          <Text style={[styles.detailStatusText, { color: scoreColor }]}>{scoreLabel}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={styles.sleekDeleteBtn}
                        >
                          <Trash2 size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Reflection */}
                    {entry.reflections ? (
                      <View style={styles.detailSectionBlock}>
                        <Text style={styles.detailSectionLabel}>DAILY REFLECTION</Text>
                        <Text style={[styles.detailReflectionContent, { color: theme.textPrimary }]}>
                          {entry.reflections}
                        </Text>
                      </View>
                    ) : null}

                    {/* Wins */}
                    {entry.wins && entry.wins.length > 0 && (
                      <View style={styles.detailSectionBlock}>
                        <Text style={styles.detailSectionLabel}>WINS & ACCOMPLISHMENTS</Text>
                        {entry.wins.map((w, i) => (
                          <View key={i} style={styles.detailWinRow}>
                            <Check size={12} color="#059669" />
                            <Text style={[styles.detailWinText, { color: theme.textPrimary }]}>{w}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Blockers */}
                    {entry.blockers && entry.blockers.length > 0 && (
                      <View style={styles.detailSectionBlock}>
                        <Text style={styles.detailSectionLabel}>BLOCKERS & CHALLENGES</Text>
                        {entry.blockers.map((b, i) => (
                          <View key={i} style={styles.detailBlockerRow}>
                            <AlertCircle size={12} color="#EF4444" />
                            <Text style={styles.detailBlockerText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  toastBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  toastText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#059669',
  },
  topTitleHeader: {
    marginTop: 4,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mainHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  mainSubheading: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
  },
  unboxedMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
  },
  unboxedMoodItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  unboxedIconDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  unboxedMoodLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  activeUnderline: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  templateToggleInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateToggleText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
    color: '#64748B',
    marginHorizontal: 3,
  },
  templateScroll: {
    marginBottom: 8,
    maxHeight: 34,
  },
  templateChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
  },
  templateChipText: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    fontSize: 10,
  },
  textArea: {
    fontFamily: FONTS.groteskRegular,
    borderRadius: 14,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 90,
  },
  categoryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChipBorderless: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 10,
  },
  inputAddRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  singleInput: {
    fontFamily: FONTS.groteskRegular,
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
  },
  addSmallBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 6,
  },
  winChipRowBorderless: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 6,
  },
  miniCategoryBadgeBorderless: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  miniCategoryText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9,
  },
  winChipText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    flex: 1,
  },
  blockerChipRowBorderless: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 6,
  },
  blockerChipText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#991B1B',
    marginLeft: 6,
    flex: 1,
  },
  chipRemoveBtn: {
    padding: 4,
  },
  submitBtnClean: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 14,
  },
  submitBtnCleanText: {
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  redesignedHistorySection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
  },
  historyCountText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
  },
  filterSearchContainer: {
    marginBottom: 14,
  },
  searchBoxMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  searchInputMinimal: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    flex: 1,
    marginLeft: 6,
    padding: 0,
    color: '#0F172A',
  },
  filterScrollMinimal: {
    maxHeight: 28,
  },
  filterPillMinimal: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  emptyLogsView: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyLogsText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  historyLogCardWrapper: {
    marginBottom: 8,
  },
  dateScoreRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateScoreRowCardActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dateRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRowTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    marginLeft: 8,
  },
  dateRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  scorePillText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
  expandedDetailCard: {
    padding: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailMoodText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    marginLeft: 5,
  },
  detailRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  detailStatusText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 10,
  },
  detailSectionBlock: {
    marginTop: 8,
  },
  detailSectionLabel: {
    fontFamily: FONTS.groteskBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#64748B',
    marginBottom: 4,
  },
  detailReflectionContent: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  detailWinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailWinText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },
  detailBlockerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailBlockerText: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#991B1B',
    marginLeft: 6,
    flex: 1,
  },
  sleekMoodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sleekDeleteBtn: {
    padding: 3,
  },
});

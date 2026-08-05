import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Task, TimetableSlot, SubjectProgress, JournalEntry, SearchResultItem } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';
import { Search, X, CheckSquare, BookOpen, Clock, FileText } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { SearchEmptyIllustration } from './EmptyStateIllustrations';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectProgress[];
  journalEntries: JournalEntry[];
  onNavigate?: (tab: 'planner' | 'settings' | 'ai' | 'journal') => void;
}

export const GlobalSearchModal: React.FC<Props> = ({
  visible,
  onClose,
  theme,
  tasks,
  timetable,
  syllabus,
  journalEntries,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  const searchResults: SearchResultItem[] = [];

  if (query.trim().length > 0) {
    const q = query.toLowerCase().trim();

    // Search Tasks
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) {
        searchResults.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `Time Block • ${t.startTime} (${t.category})`,
          category: t.category,
          dateStr: t.dateStr,
        });
      }
    });

    // Search Classes
    timetable.forEach((slot) => {
      if (slot.subject.toLowerCase().includes(q) || slot.code.toLowerCase().includes(q) || slot.instructor.toLowerCase().includes(q)) {
        searchResults.push({
          id: slot.id,
          type: 'class',
          title: slot.subject,
          subtitle: `Class • ${slot.code} | ${slot.timeStr} (${slot.room})`,
          category: slot.category,
        });
      }
    });

    // Search Syllabus Topics
    syllabus.forEach((subject) => {
      subject.topicsList.forEach((t, idx) => {
        if (t.title.toLowerCase().includes(q) || subject.subject.toLowerCase().includes(q)) {
          searchResults.push({
            id: `${subject.id}-${idx}`,
            type: 'topic',
            title: t.title,
            subtitle: `Syllabus Topic • ${subject.subject} (${t.completed ? 'Completed' : 'Pending'})`,
            category: subject.category,
          });
        }
      });
    });

    // Search Journal Entries
    journalEntries.forEach((entry) => {
      if (entry.reflections.toLowerCase().includes(q) || entry.wins.some((w) => w.toLowerCase().includes(q))) {
        searchResults.push({
          id: entry.id,
          type: 'journal',
          title: entry.reflections.slice(0, 50) + '...',
          subtitle: `Journal Log • ${entry.dateStr} [Mood: ${entry.mood}]`,
          dateStr: entry.dateStr,
        });
      }
    });
  }

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'task':
        return <CheckSquare size={16} color="#FFFFFF" />;
      case 'class':
        return <Clock size={16} color="#FFFFFF" />;
      case 'topic':
        return <BookOpen size={16} color="#FFFFFF" />;
      case 'journal':
        return <FileText size={16} color="#FFFFFF" />;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['85%', '92%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <View style={styles.container}>
          {/* Header Search Input */}
          <View style={styles.searchHeader}>
            <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks, classes, syllabus, reflections..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text.length === 1) triggerHaptic.lightImpact();
              }}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={{ marginRight: 8 }}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Results List */}
          <ScrollView
            style={styles.resultsList}
            contentContainerStyle={styles.scrollPadding}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
          >
            {query.trim().length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <SearchEmptyIllustration size={120} />
                <Text style={styles.emptyTitle}>Quick Global Search</Text>
                <Text style={styles.emptySubtitle}>
                  Search across your time blocks, tasks, goals, and journal reflections in real-time.
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyTitle}>No matching logs found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching with keywords like "Coding", "Project", "Workout", or "Journal".
                </Text>
              </View>
            ) : (
              searchResults.map((item) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  style={styles.resultItemCard}
                  onPress={() => {
                    triggerHaptic.lightImpact();
                    onClose();
                    // Navigate to the correct tab based on result type
                    if (onNavigate) {
                      if (item.type === 'task') onNavigate('planner');
                      else if (item.type === 'class' || item.type === 'topic') onNavigate('ai');
                      else if (item.type === 'journal') onNavigate('journal');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.resultTypeIconBox}>{getTypeIcon(item.type)}</View>
                  <View style={styles.resultTextContent}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.groteskMedium,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 4,
  },
  closeBtn: {
    paddingLeft: 8,
  },
  cancelText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#2563EB',
  },
  resultsList: {
    flex: 1,
    marginTop: 12,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  resultTypeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultTextContent: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 12,
    color: '#64748B',
  },
});

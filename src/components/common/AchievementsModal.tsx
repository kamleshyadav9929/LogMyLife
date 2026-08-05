import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { UserGamification, Achievement } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { getLevelProgress } from '../../services/gamificationEngine';
import { X, Award, Zap, Lock, CheckCircle2, Flame, Brain, Clock, BookOpen } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gamification: UserGamification;
}

export const AchievementsModal: React.FC<Props> = ({ visible, onClose, theme, gamification }) => {
  const levelInfo = getLevelProgress(gamification.xp);
  const pct = levelInfo.progressPct;

  const achievements: Achievement[] = [
    {
      id: 'skill_master',
      title: 'Skill Master',
      description: 'Logged and completed 5+ skill development blocks',
      iconName: 'brain',
      unlocked: true,
      reqCount: 5,
      currentCount: 5,
    },
    {
      id: 'pomodoro_beast',
      title: 'Pomodoro Beast',
      description: 'Completed 10+ Deep Work Pomodoro sessions',
      iconName: 'clock',
      unlocked: gamification.completedPomodoros >= 10,
      reqCount: 10,
      currentCount: Math.min(10, gamification.completedPomodoros),
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Maintained a 7-day consecutive streak',
      iconName: 'flame',
      unlocked: gamification.streakDays >= 7,
      reqCount: 7,
      currentCount: Math.min(7, gamification.streakDays),
    },
    {
      id: 'syllabus_conqueror',
      title: 'Syllabus Conqueror',
      description: 'Completed 15+ academic syllabus topics',
      iconName: 'book',
      unlocked: true,
      reqCount: 15,
      currentCount: 15,
    },
    {
      id: 'nightly_logger',
      title: 'Nightly Logger',
      description: 'Saved 5+ pull-to-log journal entries',
      iconName: 'award',
      unlocked: true,
      reqCount: 5,
      currentCount: 5,
    },
  ];

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'brain':
        return <Brain size={22} color="#FFFFFF" />;
      case 'clock':
        return <Clock size={22} color="#FFFFFF" />;
      case 'flame':
        return <Flame size={22} color="#FFFFFF" />;
      case 'book':
        return <BookOpen size={22} color="#FFFFFF" />;
      default:
        return <Award size={22} color="#FFFFFF" />;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme} snapPoints={['85%', '92%']}>
      {({ scrollEnabled, onScroll, closeSheet }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Award size={22} color="#0F172A" />
              <Text style={styles.title}>Gamification & Achievements</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {/* Level Card */}
            <View style={styles.levelCard}>
              <View style={styles.levelCardTop}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>LEVEL {gamification.level}</Text>
                </View>
                <View style={styles.xpRow}>
                  <Zap size={16} color="#EAB308" />
                  <Text style={styles.xpText}>{gamification.xp} Total XP</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressSubtext}>
                {pct}% to Level {gamification.level + 1} ({levelInfo.currentXP}/{levelInfo.nextLevelXP} XP)
              </Text>
            </View>

            {/* Achievements Section */}
            <Text style={styles.sectionHeading}>BADGES & MILESTONES</Text>
            {achievements.map((ach) => (
              <View
                key={ach.id}
                style={[
                  styles.badgeCard,
                  ach.unlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconBox,
                    ach.unlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked,
                  ]}
                >
                  {getBadgeIcon(ach.iconName)}
                </View>

                <View style={styles.badgeInfo}>
                  <View style={styles.badgeTitleRow}>
                    <Text style={styles.badgeTitle}>{ach.title}</Text>
                    {ach.unlocked ? (
                      <CheckCircle2 size={16} color="#10B981" />
                    ) : (
                      <Lock size={16} color="#64748B" />
                    )}
                  </View>
                  <Text style={styles.badgeDesc}>{ach.description}</Text>
                  <View style={styles.reqRow}>
                    <Text style={styles.reqText}>
                      Progress: {ach.currentCount}/{ach.reqCount}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  levelCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelBadge: {
    backgroundColor: '#2563EB',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 13,
    color: '#F8FAFC',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressSubtext: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionHeading: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeCardUnlocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  badgeCardLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeIconUnlocked: {
    backgroundColor: '#2563EB',
  },
  badgeIconLocked: {
    backgroundColor: '#64748B',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeTitle: {
    fontFamily: FONTS.groteskBold,
    fontSize: 14,
    color: '#0F172A',
  },
  badgeDesc: {
    fontFamily: FONTS.groteskRegular,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#94A3B8',
  },
});

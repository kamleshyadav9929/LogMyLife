import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, UserGamification } from '../../types';
import { ThemeConfig } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Clock, Sparkles, Palette, Search } from 'lucide-react-native';

interface Props {
  profile: UserProfile;
  gamification: UserGamification;
  onOpenJournal: () => void;
  theme: ThemeConfig;
  onCycleTheme: () => void;
  onOpenPomodoro: () => void;
  onOpenSearch: () => void;
  onOpenAchievements: () => void;
}

export const HeaderBar: React.FC<Props> = ({
  profile,
  gamification,
  onOpenJournal,
  theme,
  onCycleTheme,
  onOpenPomodoro,
  onOpenSearch,
  onOpenAchievements,
}) => {
  // Extract last name or default to Rao / user's name
  const displayName = profile.name.split(' ').length > 1 ? profile.name.split(' ').slice(-1)[0] : profile.name;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onOpenAchievements} activeOpacity={0.8} style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0)}</Text>
          </View>

          <View style={styles.userText}>
            <Text style={styles.greetingTitle}>Hello, {displayName} 👋</Text>
            <Text style={styles.userLevelSub}>
              Level {gamification.level} • {profile.role}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenSearch}
            activeOpacity={0.7}
          >
            <Search size={15} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenPomodoro}
            activeOpacity={0.7}
          >
            <Clock size={15} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onCycleTheme}
            activeOpacity={0.7}
          >
            <Palette size={15} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.journalButton} onPress={onOpenJournal} activeOpacity={0.8}>
            <Sparkles size={14} color="#0F172A" />
            <Text style={styles.journalBtnText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
  },
  userText: {
    marginLeft: 10,
    flex: 1,
  },
  greetingTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  userLevelSub: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  journalBtnText: {
    fontFamily: FONTS.groteskBold,
    color: '#0F172A',
    fontSize: 12,
    marginLeft: 4,
  },
});

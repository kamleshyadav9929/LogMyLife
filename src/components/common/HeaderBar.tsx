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
            {/* M3 onSurfaceVariant icon color */}
            <Search size={18} color="#49454F" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenPomodoro}
            activeOpacity={0.7}
          >
            <Clock size={18} color="#49454F" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onCycleTheme}
            activeOpacity={0.7}
          >
            <Palette size={18} color="#49454F" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.journalButton} onPress={onOpenJournal} activeOpacity={0.8}>
            {/* M3 onSecondaryContainer icon color */}
            <Sparkles size={14} color="#1D192B" />
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
    // M3 Top App Bar: surfaceContainer background
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    // M3 outlineVariant for subtle divider
    borderBottomColor: '#E7E0EC',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    // M3 primaryContainer tonal surface for avatar
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    // M3 onPrimaryContainer text
    color: '#1A1B52',
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
    // M3 onSurfaceVariant
    color: '#49454F',
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    // M3 Icon Button: 40x40dp, 20dp radius, surfaceVariant bg
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7E0EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // M3 Filled Tonal Button: secondaryContainer bg, 20dp pill
    backgroundColor: '#E8DEF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  journalBtnText: {
    fontFamily: FONTS.groteskBold,
    // M3 onSecondaryContainer text
    color: '#1D192B',
    fontSize: 14,
    letterSpacing: 0.1,
    marginLeft: 4,
  },
});


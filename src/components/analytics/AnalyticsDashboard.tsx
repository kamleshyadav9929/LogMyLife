import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Task, SubjectProgress, UserCategory, AppUsageLog, AppPreset, POPULAR_APP_PRESETS } from '../../types';
import { SEED_APP_USAGE_LOGS } from '../../seed/defaultData';
import { ThemeConfig, getCategoryName } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { Database } from '../../storage/db';
import { AppUsageTracker } from '../../services/appUsageTracker';
import { triggerHaptic } from '../../services/haptics';
import { ProductivityMeterGauge } from './ProductivityMeterGauge';
import { ProductivityGraph } from './ProductivityGraph';
import { calculateDetailedProductivityScore } from '../../services/productivityEngine';
import {
  Smartphone,
  Camera,
  Code,
  MessageSquare,
  Music,
  Globe,
  Tv,
  Play,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react-native';

interface Props {
  tasks: Task[];
  syllabus: SubjectProgress[];
  theme: ThemeConfig;
  categories: UserCategory[];
  onTasksUpdated?: (updated: Task[]) => void;
}

function renderAppIcon(iconName: string, color: string, size: number = 18) {
  switch (iconName) {
    case 'camera':
      return <Camera size={size} color={color} />;
    case 'youtube':
      return <Play size={size} color={color} />;
    case 'code':
      return <Code size={size} color={color} />;
    case 'message-square':
      return <MessageSquare size={size} color={color} />;
    case 'music':
      return <Music size={size} color={color} />;
    case 'tv':
      return <Tv size={size} color={color} />;
    case 'globe':
      return <Globe size={size} color={color} />;
    case 'twitter':
      return <Sparkles size={size} color={color} />;
    default:
      return <Smartphone size={size} color={color} />;
  }
}

export const AnalyticsDashboard: React.FC<Props> = ({
  tasks,
  syllabus,
  theme,
  categories,
  onTasksUpdated,
}) => {
  const [appUsageLogs, setAppUsageLogs] = useState<AppUsageLog[]>([]);

  useEffect(() => {
    async function loadAppLogs() {
      const logs = await Database.getAppUsageLogs();
      setAppUsageLogs(logs);
    }
    loadAppLogs();
  }, []);

  const handleQuickLogApp = async (preset: AppPreset) => {
    triggerHaptic.mediumImpact();
    const updated = await AppUsageTracker.quickLogAppSession(preset, 35);
    setAppUsageLogs(updated);
  };

  const handleDeleteLog = async (logId: string) => {
    triggerHaptic.mediumImpact();
    const updated = await Database.deleteAppUsageLog(logId);
    setAppUsageLogs(updated);
  };

  const effectiveLogs = appUsageLogs;

  const appAggregatesMap: Record<string, { appName: string; iconName: string; iconColor: string; bgTint: string; categoryTag: string; durationMins: number; sessionCount: number }> = {};
  
  let productiveMins = 0;
  let funMins = 0;

  effectiveLogs.forEach(log => {
    if (!appAggregatesMap[log.appName]) {
      appAggregatesMap[log.appName] = {
        appName: log.appName,
        iconName: log.iconName,
        iconColor: log.iconColor,
        bgTint: log.bgTint,
        categoryTag: log.categoryTag || 'fun',
        durationMins: 0,
        sessionCount: 0,
      };
    }
    appAggregatesMap[log.appName].durationMins += log.durationMins;
    appAggregatesMap[log.appName].sessionCount += 1;

    if (log.categoryTag === 'work' || log.categoryTag === 'productive' || log.categoryTag === 'new_skill') {
      productiveMins += log.durationMins;
    } else {
      funMins += log.durationMins;
    }
  });

  const appAggregatesList = Object.values(appAggregatesMap).sort((a, b) => b.durationMins - a.durationMins);
  const totalScreenTimeMins = effectiveLogs.reduce((acc, a) => acc + a.durationMins, 0);
  const maxAppMins = appAggregatesList[0]?.durationMins || 1;

  // Calculate dynamic multi-component productivity score
  const scoreBreakdown = calculateDetailedProductivityScore(
    tasks,
    [],
    [],
    categories,
    0
  );


  const currentScore = scoreBreakdown.totalScore;

  return (
    <View style={styles.mainContainer}>
      {/* Top Header Bar */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Productivity insights & app usage statistics</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. PRODUCTIVITY SCORE METER */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionHeading}>Productivity Score Meter</Text>
          <ProductivityMeterGauge score={currentScore} size={260} />
        </View>

        {/* Faint Divider */}
        <View style={styles.sectionDivider} />

        {/* 2. PRODUCTIVITY GRAPH */}
        <View style={styles.sectionSpacing}>
          <ProductivityGraph tasks={tasks} />
        </View>

        {/* Faint Divider */}
        <View style={styles.sectionDivider} />

        {/* 3. SCREEN TIME & APP USAGE ANALYTICS SECTION */}
        <View style={styles.sectionSpacing}>
          {/* Header Row */}
          <View style={styles.appUsageHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.appUsageHeaderIconBox}>
                <Smartphone size={14} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.sectionHeadingLeft}>Screen Time & App Usage</Text>
                <Text style={styles.appUsageSubText}>App activity sessions & timeline logs</Text>
              </View>
            </View>

            <View style={styles.totalScreenTimeBadge}>
              <Text style={styles.totalScreenTimeText}>
                {Math.floor(totalScreenTimeMins / 60)}h {totalScreenTimeMins % 60}m Total
              </Text>
            </View>
          </View>

          {/* App Usage Aggregates Breakdown Card */}
          <Text style={styles.breakdownSectionTitle}>TOP APP USAGE</Text>
          <View style={styles.appAnalyticsCard}>
            {appAggregatesList.length === 0 ? (
              <Text style={styles.noAppUsageText}>No actual app usage tracked for today yet.</Text>
            ) : (
              appAggregatesList.map((appItem) => {
                const percentage = Math.round((appItem.durationMins / maxAppMins) * 100);
                const hrs = Math.floor(appItem.durationMins / 60);
                const mins = appItem.durationMins % 60;
                const timeLabel = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                return (
                  <View key={appItem.appName} style={styles.appAnalyticRow}>
                    <View style={[styles.appIconCircle, { backgroundColor: appItem.bgTint }]}>
                      {renderAppIcon(appItem.iconName, appItem.iconColor, 18)}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.appAnalyticRowTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.appAnalyticName}>{appItem.appName}</Text>
                          <View style={styles.sessionCountTag}>
                            <Text style={styles.sessionCountTagText}>{appItem.sessionCount} session{appItem.sessionCount > 1 ? 's' : ''}</Text>
                          </View>
                        </View>
                        <Text style={[styles.appAnalyticTime, { color: appItem.iconColor }]}>{timeLabel}</Text>
                      </View>

                      {/* Usage Progress Bar */}
                      <View style={styles.appTrackBarBg}>
                        <View
                          style={[
                            styles.appTrackBarFill,
                            { width: `${Math.max(8, percentage)}%`, backgroundColor: appItem.iconColor },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Timeline Activity Logs Section */}
          <Text style={styles.breakdownSectionTitle}>ACTIVITY SESSION LOGS</Text>
          <View style={styles.logsListCard}>
            {effectiveLogs.length === 0 ? (
              <Text style={styles.noAppUsageText}>No app activity sessions logged yet.</Text>
            ) : (
              effectiveLogs.map((log) => (
                <View key={log.id} style={styles.logItemRow}>
                  <View style={[styles.logIconCircle, { backgroundColor: log.bgTint }]}>
                    {renderAppIcon(log.iconName, log.iconColor, 16)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.logAppName}>{log.appName}</Text>
                    <Text style={styles.logTimeSlot}>
                      {log.startTime} - {log.endTime} • {log.durationMins} mins
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteLogBtn}
                    onPress={() => handleDeleteLog(log.id)}
                    activeOpacity={0.7}
                  >
                    <X size={14} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionSpacing: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionHeadingLeft: {
    fontFamily: FONTS.displayBold,
    fontSize: 13.5,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
    width: '100%',
  },

  // App Usage & Screen Time Styles
  appUsageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appUsageHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appUsageSubText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  totalScreenTimeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  totalScreenTimeText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: '#2563EB',
  },
  appAnalyticsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  noAppUsageText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  appAnalyticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAnalyticRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  appAnalyticName: {
    fontFamily: FONTS.jakartaSemibold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  appAnalyticTime: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12.5,
  },
  appTrackBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  appTrackBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Split Ratio Card
  splitRatioCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  splitRatioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  splitRatioTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: '#0F172A',
  },
  splitRatioSubText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
  },
  ratioBarTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratioBarFillProductive: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  ratioBarFillFun: {
    height: '100%',
    backgroundColor: '#E4405F',
  },
  ratioLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratioLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#475569',
  },

  // Quick Log Section
  quickLogPresetsSection: {
    marginBottom: 16,
  },
  quickLogSectionTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  presetChipText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 12,
  },

  // Section titles & Tags
  breakdownSectionTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 6,
  },
  sessionCountTag: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sessionCountTagText: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 9.5,
    color: '#475569',
  },

  // Log session timeline list
  logsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  logIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logAppName: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: '#0F172A',
  },
  logTimeSlot: {
    fontFamily: FONTS.groteskMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deleteLogBtn: {
    padding: 6,
  },
});

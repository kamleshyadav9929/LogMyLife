import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  size?: number;
}

// 1. Planner / Task Schedule Vector Illustration
export const PlannerEmptyIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="plannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2563EB" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
          </LinearGradient>
          <LinearGradient id="bgCircle" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EFF6FF" />
            <Stop offset="100%" stopColor="#F3E8FF" />
          </LinearGradient>
        </Defs>

        {/* Soft Backdrop Aura */}
        <Circle cx="80" cy="80" r="70" fill="url(#bgCircle)" />

        {/* Calendar Board Base */}
        <Rect x="35" y="40" width="90" height="90" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
        <Rect x="35" y="40" width="90" height="28" rx="16" fill="url(#plannerGrad)" />

        {/* Calendar Binder Rings */}
        <Rect x="55" y="32" width="6" height="14" rx="3" fill="#64748B" />
        <Rect x="99" y="32" width="6" height="14" rx="3" fill="#64748B" />

        {/* Checkbox Rows */}
        <Rect x="48" y="78" width="14" height="14" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
        <Path d="M 52 85 L 56 89 L 66 79" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Rect x="70" y="81" width="44" height="8" rx="4" fill="#CBD5E1" />

        <Rect x="48" y="100" width="14" height="14" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
        <Rect x="70" y="103" width="34" height="8" rx="4" fill="#E2E8F0" />

        {/* Floating Sparkle Nodes */}
        <Circle cx="128" cy="46" r="5" fill="#F59E0B" />
        <Path d="M 28 90 L 32 84 L 36 90 L 42 94 L 36 98 L 32 104 L 28 98 L 22 94 Z" fill="#7C3AED" opacity={0.7} />
      </Svg>
    </View>
  );
};

// 2. Academic Hub / Timetable Vector Illustration
export const AcademicEmptyIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="academicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E40AF" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </LinearGradient>
          <LinearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#60A5FA" />
          </LinearGradient>
        </Defs>

        <Circle cx="80" cy="80" r="70" fill="#F0F9FF" />

        {/* Stacked Academic Books */}
        <Rect x="30" y="105" width="100" height="20" rx="4" fill="#0F172A" />
        <Rect x="35" y="108" width="90" height="14" rx="2" fill="#F8FAFC" />

        <Rect x="36" y="85" width="88" height="20" rx="4" fill="url(#academicGrad)" />
        <Rect x="41" y="88" width="78" height="14" rx="2" fill="#F8FAFC" />

        {/* Open Main Book */}
        <Path d="M 40 75 Q 80 85 80 48 Q 80 85 120 75 L 120 50 Q 80 60 80 28 Q 80 60 40 50 Z" fill="url(#bookGrad)" stroke="#1D4ED8" strokeWidth="2" />
        <Path d="M 80 28 L 80 85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

        {/* Graduation Cap Floating */}
        <Path d="M 80 20 L 115 32 L 80 44 L 45 32 Z" fill="#0F172A" />
        <Path d="M 60 38 L 60 52 Q 80 60 100 52 L 100 38" fill="#1E293B" />
        <Line x1="110" y1="34" x2="114" y2="48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="114" cy="50" r="3" fill="#F59E0B" />
      </Svg>
    </View>
  );
};

// 3. Analytics Insights Vector Illustration
export const AnalyticsEmptyIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#C084FC" />
          </LinearGradient>
          <LinearGradient id="chartGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#10B981" stopOpacity={0.8} />
          </LinearGradient>
        </Defs>

        <Circle cx="80" cy="80" r="70" fill="#FAF5FF" />

        {/* Analytics Card Base */}
        <Rect x="32" y="38" width="96" height="94" rx="18" fill="#FFFFFF" stroke="#E9D5FF" strokeWidth="2.5" />

        {/* Bar Chart Graphics */}
        <Rect x="48" y="85" width="14" height="32" rx="4" fill="#E2E8F0" />
        <Rect x="68" y="70" width="14" height="47" rx="4" fill="#A78BFA" />
        <Rect x="88" y="55" width="14" height="62" rx="4" fill="url(#chartGrad)" />

        {/* Dynamic Growth Trend Curve */}
        <Path d="M 45 92 Q 68 75 88 58 T 115 42" fill="none" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" />
        <Circle cx="115" cy="42" r="5" fill="#7C3AED" />

        {/* AI Sparkles Ring */}
        <G transform="translate(100, 26)">
          <Path d="M 12 0 L 15 9 L 24 12 L 15 15 L 12 24 L 9 15 L 0 12 L 9 9 Z" fill="#F59E0B" />
        </G>
        <G transform="translate(24, 48)">
          <Path d="M 8 0 L 10 6 L 16 8 L 10 10 L 8 16 L 6 10 L 0 8 L 6 6 Z" fill="#7C3AED" opacity={0.8} />
        </G>
      </Svg>
    </View>
  );
};

// 4. Life Log / Journal Vector Illustration
export const JournalEmptyIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="journalCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>

        <Circle cx="80" cy="80" r="70" fill="#ECFDF5" />

        {/* Open Journal Pages */}
        <Rect x="30" y="42" width="100" height="84" rx="10" fill="#047857" />
        <Rect x="36" y="46" width="43" height="76" rx="4" fill="#FFFFFF" />
        <Rect x="81" y="46" width="43" height="76" rx="4" fill="#FAFAFA" />

        {/* Journal Lines */}
        <Line x1="44" y1="60" x2="72" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <Line x1="44" y1="72" x2="70" y2="72" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <Line x1="44" y1="84" x2="65" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        <Line x1="89" y1="60" x2="117" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <Line x1="89" y1="72" x2="114" y2="72" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        {/* Fountain Pen & Mindset Flame */}
        <G transform="translate(100, 75) rotate(-35)">
          <Rect x="0" y="0" width="8" height="42" rx="4" fill="#0F172A" />
          <Path d="M 0 42 L 4 52 L 8 42 Z" fill="#F59E0B" />
        </G>

        {/* Floating Heart / Mood Spark */}
        <Path d="M 125 36 C 125 32 121 28 116 28 C 112 28 109 31 108 34 C 107 31 104 28 100 28 C 95 28 91 32 91 36 C 91 44 108 52 108 52 C 108 52 125 44 125 36 Z" fill="#EF4444" opacity={0.85} />
      </Svg>
    </View>
  );
};

// 5. Search / Global Modal Empty Search Illustration
export const SearchEmptyIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="searchLens" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#60A5FA" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity={0.1} />
          </LinearGradient>
        </Defs>

        <Circle cx="80" cy="80" r="70" fill="#F1F5F9" />

        {/* Document Sheet */}
        <Rect x="42" y="38" width="76" height="92" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
        <Line x1="56" y1="56" x2="90" y2="56" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <Line x1="56" y1="70" x2="100" y2="70" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <Line x1="56" y1="84" x2="82" y2="84" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

        {/* Magnifying Glass Lens & Handle */}
        <Circle cx="95" cy="95" r="28" fill="url(#searchLens)" stroke="#2563EB" strokeWidth="4" />
        <Line x1="115" y1="115" x2="135" y2="135" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});

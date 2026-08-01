import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { FONTS } from '../../theme/typography';
import { triggerHaptic } from '../../services/haptics';

interface Props {
  score: number; // 0 - 100
  size?: number;
}

export const ProductivityMeterGauge: React.FC<Props> = ({ score, size = 260 }) => {
  const [displayScore, setDisplayScore] = useState(0);

  const center = size / 2;
  const outerRadius = size * 0.44;
  const innerTickRadius = outerRadius - 18;
  const innerArcRadius = outerRadius - 28;

  // 180-degree arc: from 180° (left) to 360° / 0° (right)
  const startAngle = 180;
  const totalAngle = 180;
  const totalTicks = 45;

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  useEffect(() => {
    setDisplayScore(0);
    let currentVal = 0;
    const target = Math.min(100, Math.max(0, score));
    const step = Math.max(1, Math.ceil(target / 40));

    const timer = setInterval(() => {
      currentVal += step;
      if (currentVal >= target) {
        currentVal = target;
        clearInterval(timer);
        triggerHaptic.notificationSuccess();
      }
      setDisplayScore(currentVal);
    }, 22);

    return () => clearInterval(timer);
  }, [score]);

  // Color calculation for active tick mark based on its percentage
  const getTickColor = (pct: number) => {
    if (pct <= 0.35) return '#EF4444'; // Red (Low)
    if (pct <= 0.60) return '#F97316'; // Orange / Amber
    if (pct <= 0.80) return '#2563EB'; // Ocean Blue
    return '#10B981'; // Emerald Green
  };

  const currentRatio = Math.min(100, Math.max(0, displayScore)) / 100;

  // Status badge info
  const getBadgeInfo = () => {
    if (score >= 85) return { label: 'Excellent', color: '#10B981', bg: '#ECFDF5' };
    if (score >= 70) return { label: 'Good', color: '#2563EB', bg: '#EFF6FF' };
    if (score >= 50) return { label: 'Average', color: '#F59E0B', bg: '#FEF3C7' };
    return { label: 'Needs Push', color: '#EF4444', bg: '#FEF2F2' };
  };

  const badge = getBadgeInfo();

  return (
    <View style={[styles.container, { width: size, height: size * 0.58 }]}>
      <Svg width={size} height={size * 0.65}>
        {/* Radial Tick Lines: Colored from 0 to score, empty/gray for rest */}
        {Array.from({ length: totalTicks + 1 }).map((_, i) => {
          const pct = i / totalTicks;
          const angle = startAngle + pct * totalAngle;
          const p1 = polarToCartesian(center, center + 20, innerTickRadius, angle);
          const p2 = polarToCartesian(center, center + 20, outerRadius, angle);

          const isActive = pct <= currentRatio;
          const tickColor = isActive ? getTickColor(pct) : '#E2E8F0';

          return (
            <Line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={tickColor}
              strokeWidth={isActive ? (i % 5 === 0 ? 3 : 2) : 1.2}
              strokeLinecap="round"
              opacity={isActive ? 1 : 0.4}
            />
          );
        })}

        {/* Inner Arc Track Dots */}
        {Array.from({ length: 30 }).map((_, i) => {
          const pct = i / 29;
          const angle = startAngle + pct * totalAngle;
          const pt = polarToCartesian(center, center + 20, innerArcRadius, angle);
          const isActive = pct <= currentRatio;

          return (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={isActive ? 1.5 : 1}
              fill={isActive ? getTickColor(pct) : '#E2E8F0'}
              opacity={isActive ? 1 : 0.4}
            />
          );
        })}

        {/* Scale labels: 0, 50, 100 */}
        {(() => {
          const p0 = polarToCartesian(center, center + 20, innerArcRadius - 12, 185);
          const p50 = polarToCartesian(center, center + 20, innerArcRadius - 12, 270);
          const p100 = polarToCartesian(center, center + 20, innerArcRadius - 12, 355);
          return (
            <>
              <SvgText x={p0.x} y={p0.y} fill="#9CA3AF" fontSize="10" fontWeight="600" textAnchor="middle">
                0
              </SvgText>
              <SvgText x={p50.x} y={p50.y} fill="#9CA3AF" fontSize="10" fontWeight="600" textAnchor="middle">
                50
              </SvgText>
              <SvgText x={p100.x} y={p100.y} fill="#9CA3AF" fontSize="10" fontWeight="600" textAnchor="middle">
                100
              </SvgText>
            </>
          );
        })()}
      </Svg>

      {/* Center Score & Badge Display */}
      <View style={[styles.centerOverlay, { top: size * 0.26 }]}>
        <Text style={styles.scoreText}>{displayScore}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: FONTS.displayBold,
    fontSize: 44,
    color: '#111827',
    letterSpacing: -1,
    lineHeight: 46,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 16,
    marginTop: 4,
  },
  badgeText: {
    fontFamily: FONTS.groteskBold,
    fontSize: 11,
  },
});

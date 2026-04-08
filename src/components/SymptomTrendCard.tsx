import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {SymptomTrendPoint} from '../utils/symptomTrends';

interface Props {
  title: string;
  subtitle?: string;
  points: SymptomTrendPoint[];
  trendDirection: 'improving' | 'worsening' | 'stable' | 'no_data';
}

const getTrendLabel = (trendDirection: Props['trendDirection']) => {
  switch (trendDirection) {
    case 'improving':
      return 'Improving';
    case 'worsening':
      return 'Worsening';
    case 'stable':
      return 'Stable';
    default:
      return 'Not enough data';
  }
};

const getBarHeight = (value: number) => {
  if (value <= 0) {
    return 8;
  }

  return Math.max(10, Math.min(72, value * 7));
};

const getBarStyle = (trendDirection: Props['trendDirection']) => {
  switch (trendDirection) {
    case 'improving':
      return styles.barImproving;
    case 'worsening':
      return styles.barWorsening;
    default:
      return styles.barNeutral;
  }
};

const SymptomTrendCard: React.FC<Props> = ({
                                             title,
                                             subtitle,
                                             points,
                                             trendDirection,
                                           }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TREND</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.trendPillRow}>
        <View style={styles.trendPill}>
          <Text style={styles.trendPillText}>{getTrendLabel(trendDirection)}</Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        {points.map(point => (
          <View key={point.dateKey} style={styles.barGroup}>
            <Text style={styles.barValue}>
              {point.count > 0 ? point.averageSeverity : '—'}
            </Text>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  getBarStyle(trendDirection),
                  {height: getBarHeight(point.averageSeverity)},
                ]}
              />
            </View>

            <Text style={styles.barLabel}>{point.label}</Text>
            <Text style={styles.barMeta}>{point.count}x</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerText}>
        Bars show average daily symptom severity. Count shows how many entries were logged each day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
    lineHeight: 20,
  },
  trendPillRow: {
    marginTop: 12,
    marginBottom: 12,
  },
  trendPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 6,
    minHeight: 14,
  },
  barTrack: {
    width: 18,
    height: 76,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 18,
    borderRadius: 8,
  },
  barNeutral: {
    backgroundColor: '#98A2B3',
  },
  barImproving: {
    backgroundColor: '#12B76A',
  },
  barWorsening: {
    backgroundColor: '#F04438',
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    color: '#667085',
  },
  barMeta: {
    marginTop: 2,
    fontSize: 10,
    color: '#98A2B3',
  },
  footerText: {
    marginTop: 14,
    fontSize: 13,
    color: '#667085',
    lineHeight: 18,
  },
});

export default SymptomTrendCard;

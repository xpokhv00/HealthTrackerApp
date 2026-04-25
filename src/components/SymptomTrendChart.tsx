import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SymptomTrendPoint} from '../utils/symptomTrends';

interface Props {
  points: SymptomTrendPoint[];
  trendDirection: 'improving' | 'worsening' | 'stable' | 'no_data';
}

const BAR_COLOR: Record<string, string> = {
  improving: '#12B76A',
  worsening: '#F04438',
  stable: '#98A2B3',
  no_data: '#98A2B3',
};

const getBarHeight = (value: number) =>
  value <= 0 ? 4 : Math.max(6, Math.min(56, value * 5.6));

const SymptomTrendChart: React.FC<Props> = ({points, trendDirection}) => {
  const isCompact = points.length > 14;
  const labelEvery = points.length > 20 ? 5 : isCompact ? 3 : 1;
  const barColor = BAR_COLOR[trendDirection];

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartRow}>
        {points.map((point, index) => {
          const showLabel =
            index === 0 ||
            index === points.length - 1 ||
            index % labelEvery === 0;
          return (
            <View key={point.dateKey} style={styles.barGroup}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {height: getBarHeight(point.averageSeverity), backgroundColor: barColor},
                    point.count === 0 && styles.barEmpty,
                  ]}
                />
              </View>
              <Text
                style={[styles.barLabel, !showLabel && styles.barLabelHidden]}
                numberOfLines={1}>
                {point.label.replace(/\s+\d+$/, '')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 72,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '70%',
    height: 56,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barEmpty: {
    opacity: 0.2,
  },
  barLabel: {
    marginTop: 5,
    fontSize: 9,
    color: '#98A2B3',
    textAlign: 'center',
  },
  barLabelHidden: {
    opacity: 0,
  },
});

export default SymptomTrendChart;

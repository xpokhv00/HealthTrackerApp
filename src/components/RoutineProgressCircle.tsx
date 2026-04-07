import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../theme/colors';

interface Props {
  percent: number;
  taken: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

const RoutineProgressCircle: React.FC<Props> = ({
                                                  percent,
                                                  taken,
                                                  total,
                                                  size = 116,
                                                  strokeWidth = 10,
                                                }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * clamped) / 100;

  return (
    <View style={[styles.wrapper, {width: size, height: size}]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E9EEF6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text style={styles.count}>
          {taken} / {total}
        </Text>
        <Text style={styles.label}>Completed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default RoutineProgressCircle;

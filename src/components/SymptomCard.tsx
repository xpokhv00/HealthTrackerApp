import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SymptomEntry} from '../types/symptom';
import {formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';

interface Props {
  symptom: SymptomEntry;
  onPress?: () => void;
}

const SymptomCard: React.FC<Props> = ({symptom, onPress}) => {
  const content = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.name}>{symptom.symptom}</Text>
          <Text style={styles.meta}>
            Severity {symptom.severity}/10 • {getSeverityLabel(symptom.severity)}
          </Text>
          <Text style={styles.date}>{formatSymptomDateTime(symptom.createdAt)}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{symptom.severity}/10</Text>
        </View>
      </View>

      {symptom.note ? <Text style={styles.note}>{symptom.note}</Text> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: '#475467',
  },
  date: {
    marginTop: 6,
    fontSize: 13,
    color: '#667085',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF4FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#3538CD',
    fontWeight: '700',
    fontSize: 12,
  },
  note: {
    marginTop: 12,
    fontSize: 14,
    color: '#344054',
  },
});

export default SymptomCard;

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SymptomEntry} from '../types/symptom';
import {formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';

interface Props {
  symptom: SymptomEntry;
  onPress?: () => void;
}

// Returns bg/text colors for severity 1–10
function severityColors(severity: number): {bg: string; text: string; bar: string} {
  if (severity <= 3) {return {bg: '#ECFDF5', text: '#027A48', bar: '#12B76A'};}
  if (severity <= 6) {return {bg: '#FFFAEB', text: '#B54708', bar: '#F79009'};}
  return {bg: '#FEF3F2', text: '#B42318', bar: '#F04438'};
}

const CATEGORY_COLORS: Record<string, string> = {
  Pain:        '#FEE4E2',
  Respiratory: '#E0F2FE',
  Digestive:   '#FEF9C3',
  Mood:        '#F3E8FF',
  Energy:      '#FFF7ED',
  Skin:        '#FCE7F3',
  Other:       '#F2F4F7',
};

const CATEGORY_TEXT: Record<string, string> = {
  Pain:        '#912018',
  Respiratory: '#0369A1',
  Digestive:   '#854D0E',
  Mood:        '#6B21A8',
  Energy:      '#9A3412',
  Skin:        '#9D174D',
  Other:       '#344054',
};

const SymptomCard: React.FC<Props> = ({symptom, onPress}) => {
  const visibleTriggers = symptom.triggers?.slice(0, 3) ?? [];
  const sev = severityColors(symptom.severity);

  const content = (
    <View style={styles.card}>
      {/* Severity bar on left */}
      <View style={[styles.severityBar, {backgroundColor: sev.bar}]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.info}>
            <Text style={styles.name}>{symptom.symptom}</Text>
            {symptom.patientName ? (
              <Text style={styles.patientName}>👤 {symptom.patientName}</Text>
            ) : null}
            <Text style={styles.date}>🗓 {formatSymptomDateTime(symptom.createdAt)}</Text>
          </View>

          {/* Severity badge */}
          <View style={[styles.badge, {backgroundColor: sev.bg}]}>
            <Text style={[styles.badgeNumber, {color: sev.text}]}>{symptom.severity}</Text>
            <Text style={[styles.badgeLabel, {color: sev.text}]}>/10</Text>
            <Text style={[styles.badgeSeverityLabel, {color: sev.text}]}>
              {getSeverityLabel(symptom.severity)}
            </Text>
          </View>
        </View>

        {/* Category pill + triggers on same row */}
        {(symptom.category || visibleTriggers.length > 0) ? (
          <View style={styles.pillRow}>
            {symptom.category ? (
              <View style={[styles.categoryPill, {
                backgroundColor: CATEGORY_COLORS[symptom.category] ?? '#F2F4F7',
              }]}>
                <Text style={[styles.categoryPillText, {
                  color: CATEGORY_TEXT[symptom.category] ?? '#344054',
                }]}>
                  {symptom.category}
                </Text>
              </View>
            ) : null}

            {visibleTriggers.map(item => (
              <View key={item} style={styles.triggerChip}>
                <Text style={styles.triggerChipText}>⚡ {item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {symptom.note ? (
          <Text style={styles.note}>💬 {symptom.note}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {return content;}
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  severityBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  body: {
    flex: 1,
    padding: 14,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  patientName: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },
  date: {
    marginTop: 5,
    fontSize: 12,
    color: '#667085',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 52,
  },
  badgeNumber: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeSeverityLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  triggerChip: {
    backgroundColor: '#F2F4F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerChipText: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: '#475467',
    lineHeight: 18,
  },
});

export default SymptomCard;

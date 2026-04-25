import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SymptomEntry} from '../types/symptom';
import {formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';
import {colors, severityColors, CATEGORY_COLORS, CATEGORY_TEXT} from '../theme/colors';

interface Props {
  symptom: SymptomEntry;
  onPress?: () => void;
}

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
                backgroundColor: CATEGORY_COLORS[symptom.category] ?? colors.neutral,
              }]}>
                <Text style={[styles.categoryPillText, {
                  color: CATEGORY_TEXT[symptom.category] ?? colors.neutralText,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  },
  patientName: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  date: {
    marginTop: 5,
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.neutral,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerChipText: {
    fontSize: 12,
    color: colors.neutralText,
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: colors.neutralText,
    lineHeight: 18,
  },
});

export default SymptomCard;

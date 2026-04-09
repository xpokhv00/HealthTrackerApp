import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import {Medication} from '../types/medication';
import {
  getAvailabilityLabel,
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';
import {getRoutineScheduleLabel} from '../utils/routineSchedule';

interface Props {
  medication: Medication;
  onPress: (event: GestureResponderEvent) => void;
  onTakePress: (event: GestureResponderEvent) => void;
  allDoneToday?: boolean;
}

// Routine: blue. As-needed: teal.
const ROUTINE_COLOR = '#4C7EFF';
const AS_NEEDED_COLOR = '#0BA5A4';

const MedicationCard: React.FC<Props> = ({
  medication,
  onPress,
  onTakePress,
  allDoneToday = false,
}) => {
  const isRoutine = medication.type === 'routine';
  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const accentColor = isRoutine ? ROUTINE_COLOR : AS_NEEDED_COLOR;

  const takeDisabled =
    allDoneToday ||
    (medication.type === 'as_needed' && (!availableNow || dailyLimitReached));

  return (
    <TouchableOpacity
      style={[styles.card, allDoneToday && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.85}>
      {/* Colored left accent bar */}
      <View style={[styles.accent, {backgroundColor: allDoneToday ? '#D0D5DD' : accentColor}]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.info}>
            {/* Type badge + name row */}
            <View style={styles.nameRow}>
              <View style={[styles.typeBadge, {backgroundColor: allDoneToday ? '#F2F4F7' : accentColor + '1A'}]}>
                <Text style={[styles.typeBadgeText, {color: allDoneToday ? '#9BA8B4' : accentColor}]}>
                  {isRoutine ? 'Daily' : 'As needed'}
                </Text>
              </View>
            </View>

            <Text style={[styles.name, allDoneToday && styles.textDone]}>
              {medication.name}
            </Text>

            <Text style={styles.meta}>
              {medication.dosage}
              {medication.form ? ` · ${medication.form}` : ''}
            </Text>

            {medication.patientName ? (
              <Text style={styles.patientName}>👤 {medication.patientName}</Text>
            ) : null}
          </View>

          {/* Take button */}
          <TouchableOpacity
            style={[
              styles.takeButton,
              {backgroundColor: allDoneToday ? '#F2F4F7' : takeDisabled ? '#F2F4F7' : accentColor},
            ]}
            onPress={onTakePress}
            disabled={takeDisabled}>
            <Text style={[styles.takeButtonText, {color: allDoneToday || takeDisabled ? '#9BA8B4' : '#FFFFFF'}]}>
              ✓
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status line */}
        {allDoneToday ? (
          <Text style={styles.completedBadge}>✓ All doses completed today</Text>
        ) : (
          <View style={styles.statusRow}>
            {isRoutine ? (
              <Text style={styles.statusText}>
                🕐 {getRoutineScheduleLabel(medication)}
              </Text>
            ) : (
              <Text style={[styles.statusText, dailyLimitReached && styles.statusWarning]}>
                {dailyLimitReached ? '⚠ Daily limit reached' : `⏱ ${getAvailabilityLabel(medication)}`}
              </Text>
            )}
          </View>
        )}
      </View>
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
  cardDone: {
    backgroundColor: '#F8FAFC',
    opacity: 0.75,
  },
  accent: {
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
  },
  textDone: {
    color: '#9BA8B4',
  },
  meta: {
    marginTop: 3,
    fontSize: 13,
    color: '#5F6B7A',
  },
  patientName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },
  takeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 10,
  },
  statusText: {
    fontSize: 13,
    color: '#667085',
  },
  statusWarning: {
    color: '#C2410C',
    fontWeight: '600',
  },
  completedBadge: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#12B76A',
  },
});

export default MedicationCard;

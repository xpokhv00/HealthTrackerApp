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

const MedicationCard: React.FC<Props> = ({
                                           medication,
                                           onPress,
                                           onTakePress,
                                           allDoneToday = false,
                                         }) => {
  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);

  const takeDisabled =
    allDoneToday ||
    (medication.type === 'as_needed' && (!availableNow || dailyLimitReached));

  return (
    <TouchableOpacity
      style={[styles.card, allDoneToday && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={[styles.name, allDoneToday && styles.textDone]}>
            {medication.name}
          </Text>
          {medication.patientName ? (
            <Text style={styles.patientName}>For: {medication.patientName}</Text>
          ) : null}
          <Text style={styles.meta}>
            {medication.dosage}
            {medication.form ? ` • ${medication.form}` : ''}
          </Text>
          <Text style={styles.type}>
            {medication.type === 'routine'
              ? `Routine • ${getRoutineScheduleLabel(medication)}`
              : 'As needed'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.takeButton, takeDisabled && styles.takeButtonDisabled]}
          onPress={onTakePress}
          disabled={takeDisabled}>
          <Text style={styles.takeButtonText}>Taken</Text>
        </TouchableOpacity>
      </View>

      {allDoneToday ? (
        <Text style={styles.completedBadge}>All doses completed today</Text>
      ) : (
        <>
          <Text style={styles.status}>{getAvailabilityLabel(medication)}</Text>
          {dailyLimitReached && (
            <Text style={styles.warning}>Daily limit reached</Text>
          )}
        </>
      )}
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
  cardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E7ECF3',
    opacity: 0.75,
  },
  textDone: {
    color: '#9BA8B4',
  },
  completedBadge: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#12B76A',
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
    fontWeight: '700',
    color: '#1A1F36',
  },
  patientName: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#4C7EFF',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: '#5F6B7A',
  },
  type: {
    marginTop: 6,
    fontSize: 13,
    color: '#4C7EFF',
    fontWeight: '600',
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: '#344054',
  },
  warning: {
    marginTop: 8,
    fontSize: 13,
    color: '#C2410C',
    fontWeight: '600',
  },
  takeButton: {
    backgroundColor: '#4C7EFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  takeButtonDisabled: {
    backgroundColor: '#B8C4D6',
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MedicationCard;

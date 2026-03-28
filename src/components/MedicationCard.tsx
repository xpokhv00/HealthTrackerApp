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

interface Props {
  medication: Medication;
  onPress: (event: GestureResponderEvent) => void;
  onTakePress: (event: GestureResponderEvent) => void;
}

const MedicationCard: React.FC<Props> = ({
                                           medication,
                                           onPress,
                                           onTakePress,
                                         }) => {
  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);

  const takeDisabled =
    medication.type === 'as_needed' && (!availableNow || dailyLimitReached);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.meta}>
            {medication.dosage}
            {medication.form ? ` • ${medication.form}` : ''}
          </Text>
          <Text style={styles.type}>
            {medication.type === 'routine' ? 'Routine' : 'As needed'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.takeButton, takeDisabled && styles.takeButtonDisabled]}
          onPress={onTakePress}
          disabled={takeDisabled}>
          <Text style={styles.takeButtonText}>Taken</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{getAvailabilityLabel(medication)}</Text>

      {dailyLimitReached && (
        <Text style={styles.warning}>Daily limit reached</Text>
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

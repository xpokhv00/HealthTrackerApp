import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Medication} from '../types/medication';
import {
  getNextAllowedTime,
  getTodayDoseCount,
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';
import {getRoutineScheduleLabel} from '../utils/routineSchedule';

export type CardVariant = 'urgent' | 'upcoming' | 'resting';

interface Props {
  medication: Medication;
  variant: CardVariant;
  nextSlotTime?: string;   // HH:MM of the next pending routine slot
  takenToday?: number;
  totalToday?: number;
  onPress: () => void;
  onTakePress: () => void;
}

const formatAvailableAt = (med: Medication): string => {
  const next = getNextAllowedTime(med);
  if (!next) {return 'Available now';}
  const now = new Date();
  if (now >= next) {return 'Available now';}
  return `Available at ${next.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
};

const MedicationCard: React.FC<Props> = ({
  medication,
  variant,
  nextSlotTime,
  takenToday = 0,
  totalToday = 0,
  onPress,
  onTakePress,
}) => {
  const isRoutine = medication.type === 'routine';
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const availableNow = isMedicationAvailableNow(medication);
  const isUrgent = variant === 'urgent';
  const isResting = variant === 'resting';
  const takeDisabled = isResting || (medication.type === 'as_needed' && (!availableNow || dailyLimitReached));

  // Sub-label: what's most useful to show right now
  let subLabel: string;
  let subLabelUrgent = false;
  if (isRoutine) {
    if (variant === 'urgent' && nextSlotTime) {
      subLabel = `Overdue · ${nextSlotTime}`;
      subLabelUrgent = true;
    } else if (variant === 'upcoming' && nextSlotTime) {
      subLabel = `Next at ${nextSlotTime}`;
    } else if (isResting) {
      subLabel = totalToday > 0 ? `${takenToday}/${totalToday} done today` : 'All done today';
    } else {
      subLabel = getRoutineScheduleLabel(medication);
    }
  } else {
    if (dailyLimitReached) {
      subLabel = 'Daily limit reached';
      subLabelUrgent = false;
    } else {
      subLabel = formatAvailableAt(medication);
      subLabelUrgent = availableNow && !isResting;
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.card,
        isUrgent && styles.cardUrgent,
        isResting && styles.cardResting,
      ]}>

      {/* Left urgency stripe */}
      <View style={[
        styles.stripe,
        isUrgent && styles.stripeUrgent,
        variant === 'upcoming' && styles.stripeUpcoming,
        isResting && styles.stripeResting,
      ]} />

      <View style={styles.body}>
        <View style={styles.mainRow}>
          {/* Text block */}
          <View style={styles.textBlock}>
            <Text style={[styles.name, isResting && styles.nameResting]} numberOfLines={1}>
              {medication.name}
            </Text>
            <Text style={[styles.dosage, isResting && styles.dosageResting]}>
              {medication.dosage}{medication.form ? ` · ${medication.form}` : ''}
            </Text>
            {medication.patientName ? (
              <View style={styles.patientRow}>
                <Ionicons name="person-outline" size={11} color="#94A3B8" />
                <Text style={styles.patientText}>{medication.patientName}</Text>
              </View>
            ) : null}
          </View>

          {/* Take button */}
          <TouchableOpacity
            onPress={onTakePress}
            disabled={takeDisabled}
            activeOpacity={0.8}
            style={[
              styles.takeBtn,
              isUrgent && styles.takeBtnUrgent,
              variant === 'upcoming' && styles.takeBtnUpcoming,
              takeDisabled && styles.takeBtnDisabled,
            ]}>
            <Ionicons
              name={isResting ? 'checkmark' : 'checkmark'}
              size={isUrgent ? 20 : 17}
              color={
                isResting
                  ? '#94A3B8'
                  : isUrgent
                    ? '#FFFFFF'
                    : takeDisabled
                      ? '#CBD5E1'
                      : '#64748B'
              }
            />
          </TouchableOpacity>
        </View>

        {/* Sub-label row */}
        <View style={styles.subRow}>
          {isUrgent && !isRoutine && availableNow ? (
            <View style={styles.availableDot} />
          ) : null}
          <Text style={[
            styles.subLabel,
            subLabelUrgent && styles.subLabelUrgent,
            isResting && styles.subLabelResting,
          ]}>
            {subLabel}
          </Text>

          {/* Routine progress dots */}
          {isRoutine && totalToday > 0 && !isResting ? (
            <View style={styles.dotRow}>
              {Array.from({length: totalToday}).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < takenToday ? styles.dotTaken : styles.dotEmpty,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardUrgent: {
    backgroundColor: '#FAFBFF',
    borderColor: '#C7D7FE',
    shadowColor: '#4C7EFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardResting: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.72,
  },
  stripe: {
    width: 4,
  },
  stripeUrgent: {
    backgroundColor: '#4C7EFF',
  },
  stripeUpcoming: {
    backgroundColor: '#94A3B8',
  },
  stripeResting: {
    backgroundColor: '#E2E8F0',
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  nameResting: {
    color: '#94A3B8',
  },
  dosage: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  dosageResting: {
    color: '#CBD5E1',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  patientText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  takeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  takeBtnUrgent: {
    backgroundColor: '#4C7EFF',
    borderColor: '#4C7EFF',
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  takeBtnUpcoming: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  takeBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#12B76A',
  },
  subLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  subLabelUrgent: {
    color: '#4C7EFF',
    fontWeight: '600',
  },
  subLabelResting: {
    color: '#CBD5E1',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  dotTaken: {
    backgroundColor: '#4C7EFF',
  },
  dotEmpty: {
    backgroundColor: '#E2E8F0',
  },
});

export default MedicationCard;

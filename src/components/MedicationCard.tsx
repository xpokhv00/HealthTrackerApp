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

  const typeLabel = isRoutine ? 'Routine' : 'As needed';

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
        isResting && styles.stripeResting,
        !isResting && (isRoutine ? styles.stripeRoutine : styles.stripeAsNeeded),
        isUrgent && (isRoutine ? styles.stripeRoutineUrgent : styles.stripeAsNeededUrgent),
      ]} />

      <View style={styles.body}>
        <View style={styles.mainRow}>
          {/* Text block */}
          <View style={styles.textBlock}>
            <Text style={[styles.name, isResting && styles.nameResting]} numberOfLines={1}>
              {medication.name}
            </Text>
            <View style={styles.typeRow}>
              <View style={[styles.typePill, isRoutine ? styles.typePillRoutine : styles.typePillAsNeeded, isResting && styles.typePillResting]}>
                <Text style={[styles.typePillText, isRoutine ? styles.typePillTextRoutine : styles.typePillTextAsNeeded, isResting && styles.typePillTextResting]}>
                  {typeLabel}
                </Text>
              </View>
              <Text style={[styles.dosage, isResting && styles.dosageResting]}>
                {medication.dosage}{medication.form ? ` · ${medication.form}` : ''}
              </Text>
            </View>
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
              isUrgent && (isRoutine ? styles.takeBtnUrgentRoutine : styles.takeBtnUrgentAsNeeded),
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
                      : isRoutine ? '#4C7EFF' : '#0BA5A4'
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
            subLabelUrgent && (isRoutine ? styles.subLabelUrgentRoutine : styles.subLabelUrgentAsNeeded),
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
  stripeRoutine: {
    backgroundColor: '#B8CBFF',
  },
  stripeRoutineUrgent: {
    backgroundColor: '#4C7EFF',
  },
  stripeAsNeeded: {
    backgroundColor: '#99E6E5',
  },
  stripeAsNeededUrgent: {
    backgroundColor: '#0BA5A4',
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  typePill: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typePillRoutine: {
    backgroundColor: '#EEF4FF',
  },
  typePillAsNeeded: {
    backgroundColor: '#ECFDF9',
  },
  typePillResting: {
    backgroundColor: '#F1F5F9',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  typePillTextRoutine: {
    color: '#4C7EFF',
  },
  typePillTextAsNeeded: {
    color: '#0BA5A4',
  },
  typePillTextResting: {
    color: '#CBD5E1',
  },
  dosage: {
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
  takeBtnUrgentRoutine: {
    backgroundColor: '#4C7EFF',
    borderColor: '#4C7EFF',
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  takeBtnUrgentAsNeeded: {
    backgroundColor: '#0BA5A4',
    borderColor: '#0BA5A4',
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
  subLabelUrgentRoutine: {
    color: '#4C7EFF',
    fontWeight: '600',
  },
  subLabelUrgentAsNeeded: {
    color: '#0BA5A4',
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

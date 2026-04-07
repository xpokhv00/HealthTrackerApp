import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import {
  formatDateTime,
  getAvailabilityLabel,
  getTodayDoseCount,
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';
import {notificationService} from '../services/notificationService';
import {getMedicationSnoozeNotificationId} from '../utils/medicationNotifications';
import {colors} from '../theme/colors.ts';
import Screen from '../components/Screen.tsx';
import {syncAllWidgets} from '../services/widgetSync';
import {getRoutineScheduleLabel} from '../utils/routineSchedule';
import {markNextRoutineDoseTaken} from '../services/markNextRoutineDoseTaken';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetail'>;

const MedicationDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {medicationId} = route.params;

  const medication = useMedicationStore(state =>
    state.medications.find(item => item.id === medicationId),
  );
  const markMedicationTaken = useMedicationStore(state => state.markMedicationTaken);
  const removeMedication = useMedicationStore(state => state.removeMedication);

  if (!medication) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Medication not found</Text>
          <Text style={styles.errorText}>
            This item may have been deleted or is no longer available.
          </Text>
        </View>
      </Screen>
    );
  }

  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const takenToday = getTodayDoseCount(medication);

  const takeDisabled =
    medication.type === 'as_needed' && (!availableNow || dailyLimitReached);

  const typeLabel =
    medication.type === 'routine' ? 'Routine medication' : 'As-needed medication';

  const statusLabel =
    medication.type === 'routine'
      ? 'Schedule active'
      : dailyLimitReached
        ? 'Daily limit reached'
        : availableNow
          ? 'Available now'
          : 'Not available yet';

  const statusStyle =
    medication.type === 'routine'
      ? styles.statusPillNeutral
      : dailyLimitReached
        ? styles.statusPillWarning
        : availableNow
          ? styles.statusPillSuccess
          : styles.statusPillNeutral;

  const lastTakenLabel = medication.lastTakenAt
    ? formatDateTime(medication.lastTakenAt)
    : 'Not taken yet';

  const availabilityText =
    medication.type === 'routine'
      ? `${getRoutineScheduleLabel(medication)}${
        medication.scheduledTimes?.length
          ? ` • ${medication.scheduledTimes.join(', ')}`
          : ''
      }`
      : getAvailabilityLabel(medication);

  const takeButtonLabel =
    medication.type === 'routine'
      ? 'Mark next dose taken'
      : dailyLimitReached
        ? 'Daily limit reached'
        : availableNow
          ? 'Mark as taken'
          : 'Not available yet';

  const history = [...medication.takenHistory].reverse();

  const handleTake = async () => {
    if (medication.type === 'routine') {
      await Promise.resolve(markNextRoutineDoseTaken(medication.id));
    } else {
      markMedicationTaken(medication.id);
    }

    await syncAllWidgets();
  };

  const handleDelete = async () => {
    await notificationService.cancelMedicationRemindersByMedicationId(
      medication.id,
    );
    await notificationService.cancelMedicationReminder(
      getMedicationSnoozeNotificationId(medication.id),
    );

    removeMedication(medication.id);
    await syncAllWidgets();
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.name}>{medication.name}</Text>
              <Text style={styles.meta}>
                {medication.dosage}
                {medication.form ? ` • ${medication.form}` : ''}
              </Text>
              <Text style={styles.type}>{typeLabel}</Text>
            </View>

            <View style={[styles.statusPill, statusStyle]}>
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroInfo}>{availabilityText}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipLabel}>Taken today</Text>
              <Text style={styles.statChipValue}>{takenToday}</Text>
            </View>

            <View style={styles.statChip}>
              <Text style={styles.statChipLabel}>Last taken</Text>
              <Text
                style={styles.statChipValueSmall}
                numberOfLines={1}>
                {medication.lastTakenAt ? formatDateTime(medication.lastTakenAt) : '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current status</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text style={styles.infoValue}>{getAvailabilityLabel(medication)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last taken</Text>
            <Text style={styles.infoValue}>{lastTakenLabel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taken today</Text>
            <Text style={styles.infoValue}>{takenToday}</Text>
          </View>

          {dailyLimitReached ? (
            <Text style={styles.warningText}>
              You have already reached the daily limit for this medication.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          {medication.type === 'routine' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Frequency</Text>
                <Text style={styles.infoValue}>
                  {getRoutineScheduleLabel(medication)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Times per day</Text>
                <Text style={styles.infoValue}>
                  {medication.timesPerDay ?? '-'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled times</Text>
                <Text style={styles.infoValue}>
                  {medication.scheduledTimes?.join(', ') || '-'}
                </Text>
              </View>

              {medication.frequencyType === 'interval_days' ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Interval days</Text>
                  <Text style={styles.infoValue}>
                    {medication.intervalDays ?? '-'}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Min hours between doses</Text>
                <Text style={styles.infoValue}>
                  {medication.minHoursBetweenDoses ?? '-'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max daily doses</Text>
                <Text style={styles.infoValue}>
                  {medication.maxDailyDoses ?? '-'}
                </Text>
              </View>
            </>
          )}
        </View>

        {medication.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{medication.notes}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dose history</Text>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>No doses recorded yet.</Text>
          ) : (
            history.map(entry => (
              <View key={entry} style={styles.historyRow}>
                <Text style={styles.historyBullet}>•</Text>
                <Text style={styles.historyText}>{formatDateTime(entry)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.takeButton, takeDisabled && styles.takeButtonDisabled]}
          onPress={handleTake}
          disabled={takeDisabled}>
          <Text style={styles.takeButtonText}>{takeButtonLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('AddMedication', {
              medicationId: medication.id,
            })
          }>
          <Text style={styles.editButtonText}>Edit medication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete medication</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 160,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    marginTop: 6,
    fontSize: 16,
    color: '#667085',
  },
  type: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillNeutral: {
    backgroundColor: '#EEF2FF',
  },
  statusPillSuccess: {
    backgroundColor: '#ECFDF3',
  },
  statusPillWarning: {
    backgroundColor: '#FEF3F2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  heroInfo: {
    fontSize: 15,
    color: '#475467',
    lineHeight: 22,
    marginTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  statChipLabel: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 4,
  },
  statChipValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statChipValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#344054',
    lineHeight: 22,
  },
  warningText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#B42318',
  },
  notesText: {
    fontSize: 15,
    color: '#344054',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: '#667085',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyBullet: {
    width: 14,
    fontSize: 16,
    color: '#344054',
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#344054',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  takeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  takeButtonDisabled: {
    backgroundColor: '#B8C4D6',
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  editButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  deleteButtonText: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default MedicationDetailScreen;

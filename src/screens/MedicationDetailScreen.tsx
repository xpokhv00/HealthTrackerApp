import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {
  formatDateTime,
  getAvailabilityLabel,
  getNextAllowedTime,
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
import {toDateKey} from '../utils/dateHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetail'>;

const formatTimeOnly = (value?: string) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MedicationDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {medicationId} = route.params;
  const insets = useSafeAreaInsets();

  const medication = useMedicationStore(state =>
    state.medications.find(item => item.id === medicationId),
  );
  const markMedicationTaken = useMedicationStore(state => state.markMedicationTaken);
  const removeMedication = useMedicationStore(state => state.removeMedication);
  const routineSlots = useRoutineDoseStore(state => state.slots);

  if (!medication) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Medication not found</Text>
          <Text style={styles.errorText}>
            It may have been deleted or is no longer available.
          </Text>
        </View>
      </Screen>
    );
  }

  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const takenToday = getTodayDoseCount(medication);
  const nextAllowedTime = getNextAllowedTime(medication);

  const todayKey = toDateKey(new Date());
  const todayRoutineSlots = routineSlots
    .filter(slot => slot.medicationId === medication.id && slot.date === todayKey)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const overdueRoutineSlot =
    todayRoutineSlots.find(slot => slot.status === 'missed') ?? null;
  const pendingRoutineSlot =
    todayRoutineSlots.find(slot => slot.status === 'pending') ?? null;
  const nextRoutineAction = overdueRoutineSlot ?? pendingRoutineSlot ?? null;

  const routineTakenToday = todayRoutineSlots.filter(
    slot => slot.status === 'taken_on_time' || slot.status === 'taken_late',
  ).length;

  const routineTakeDisabled =
    medication.type === 'routine' && !nextRoutineAction;
  const asNeededTakeDisabled =
    medication.type === 'as_needed' && (!availableNow || dailyLimitReached);

  const takeDisabled = routineTakeDisabled || asNeededTakeDisabled;

  const statusLabel =
    medication.type === 'routine'
      ? overdueRoutineSlot
        ? 'Overdue dose'
        : pendingRoutineSlot
          ? 'Next routine dose'
          : todayRoutineSlots.length === 0
            ? 'No dose scheduled today'
            : 'All routine doses completed'
      : dailyLimitReached
        ? 'Daily limit reached'
        : availableNow
          ? 'Available now'
          : 'Available later';

  const statusPillStyle =
    medication.type === 'routine'
      ? overdueRoutineSlot
        ? styles.statusPillWarning
        : nextRoutineAction
          ? styles.statusPillNeutral
          : styles.statusPillSuccess
      : dailyLimitReached
        ? styles.statusPillWarning
        : availableNow
          ? styles.statusPillSuccess
          : styles.statusPillNeutral;

  const statusDetail =
    medication.type === 'routine'
      ? overdueRoutineSlot
        ? `${overdueRoutineSlot.medicationName} was scheduled for ${overdueRoutineSlot.scheduledTime}.`
        : pendingRoutineSlot
          ? `${pendingRoutineSlot.medicationName} is scheduled for ${pendingRoutineSlot.scheduledTime}.`
          : todayRoutineSlots.length === 0
            ? 'This medication does not have a routine slot for today.'
            : 'All scheduled routine doses for today are already logged.'
      : dailyLimitReached
        ? `You already logged ${takenToday} dose${takenToday === 1 ? '' : 's'} today.`
        : availableNow
          ? 'You can log this medication now.'
          : `Available again at ${formatTimeOnly(
            nextAllowedTime?.toISOString(),
          )}.`;

  const takeButtonLabel =
    medication.type === 'routine'
      ? nextRoutineAction
        ? overdueRoutineSlot
          ? `Mark ${overdueRoutineSlot.scheduledTime} dose taken`
          : `Mark ${pendingRoutineSlot?.scheduledTime} dose taken`
        : 'No routine dose to log'
      : dailyLimitReached
        ? 'Daily limit reached'
        : availableNow
          ? 'Mark as taken'
          : `Available at ${formatTimeOnly(nextAllowedTime?.toISOString())}`;

  const handleRefreshWidgets = async () => {
    await syncAllWidgets();
  };

  const handleTake = async () => {
    if (medication.type === 'routine') {
      if (!nextRoutineAction) {
        return;
      }
      markNextRoutineDoseTaken(medication.id);
    } else {
      markMedicationTaken(medication.id);
    }

    await handleRefreshWidgets();
  };

  const handleDelete = async () => {
    await notificationService.cancelMedicationRemindersByMedicationId(
      medication.id,
    );

    await notificationService.cancelMedicationReminder(
      getMedicationSnoozeNotificationId(medication.id),
    );

    removeMedication(medication.id);
    await handleRefreshWidgets();
    navigation.goBack();
  };

  return (
    <Screen>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.name}>{medication.name}</Text>
                <Text style={styles.meta}>
                  {medication.dosage}
                  {medication.form ? ` • ${medication.form}` : ''}
                </Text>
                {medication.patientName ? (
                  <Text style={styles.patientName}>For: {medication.patientName}</Text>
                ) : null}
                <Text style={styles.type}>
                  {medication.type === 'routine'
                    ? 'Routine medication'
                    : 'As-needed medication'}
                </Text>
              </View>

              <View style={[styles.statusPill, statusPillStyle]}>
                <Text style={styles.statusPillText}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.heroDetail}>{statusDetail}</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipLabel}>Taken today</Text>
                <Text style={styles.heroChipValue}>
                  {medication.type === 'routine' ? routineTakenToday : takenToday}
                </Text>
              </View>

              <View style={styles.heroChip}>
                <Text style={styles.heroChipLabel}>Last taken</Text>
                <Text style={styles.heroChipValueSmall}>
                  {medication.lastTakenAt
                    ? formatTimeOnly(medication.lastTakenAt)
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current status</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>
                {getAvailabilityLabel(medication)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last taken</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(medication.lastTakenAt)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Taken today</Text>
              <Text style={styles.infoValue}>
                {medication.type === 'routine' ? routineTakenToday : takenToday}
              </Text>
            </View>

            {medication.type === 'routine' ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {overdueRoutineSlot ? 'Overdue dose' : 'Next scheduled dose'}
                </Text>
                <Text style={styles.infoValue}>
                  {nextRoutineAction ? nextRoutineAction.scheduledTime : 'None'}
                </Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Available again</Text>
                <Text style={styles.infoValue}>
                  {dailyLimitReached
                    ? 'Tomorrow'
                    : availableNow
                      ? 'Now'
                      : nextAllowedTime
                        ? formatDateTime(nextAllowedTime.toISOString())
                        : '—'}
                </Text>
              </View>
            )}

            {dailyLimitReached ? (
              <Text style={styles.warning}>
                You have reached the daily limit for this medication.
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
                  <Text style={styles.infoLabel}>Minimum hours between doses</Text>
                  <Text style={styles.infoValue}>
                    {medication.minHoursBetweenDoses ?? '-'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Maximum daily doses</Text>
                  <Text style={styles.infoValue}>
                    {medication.maxDailyDoses ?? '-'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {medication.purpose || medication.usageInstructions ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usage</Text>
              {medication.purpose ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Purpose</Text>
                  <Text style={styles.infoValue}>{medication.purpose}</Text>
                </View>
              ) : null}
              {medication.usageInstructions ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Usage instructions</Text>
                  <Text style={styles.infoValue}>{medication.usageInstructions}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            {medication.takenHistory.length === 0 ? (
              <Text style={styles.value}>No doses recorded yet.</Text>
            ) : (
              [...medication.takenHistory].reverse().map(entry => (
                <Text key={entry} style={styles.historyItem}>
                  • {formatDateTime(entry)}
                </Text>
              ))
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {paddingBottom: Math.max(insets.bottom, 12)},
          ]}>
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
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
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
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
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
  patientName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#4C7EFF',
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
  heroDetail: {
    marginTop: 14,
    fontSize: 15,
    color: '#475467',
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  heroChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  heroChipLabel: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 4,
  },
  heroChipValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  heroChipValueSmall: {
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
  value: {
    fontSize: 15,
    color: '#344054',
    lineHeight: 22,
  },
  historyItem: {
    fontSize: 15,
    color: '#344054',
    marginBottom: 8,
  },
  warning: {
    color: '#B42318',
    fontWeight: '700',
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F6F8FB',
    borderTopWidth: 1,
    borderTopColor: '#E7ECF3',
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

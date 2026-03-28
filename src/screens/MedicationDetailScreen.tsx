import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
import { colors } from '../theme/colors.ts';
import Screen from '../components/Screen.tsx';
import {syncMedicationWidget} from '../services/widgetSync';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Medication not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const takeDisabled =
    medication.type === 'as_needed' && (!availableNow || dailyLimitReached);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.meta}>
            {medication.dosage}
            {medication.form ? ` • ${medication.form}` : ''}
          </Text>
          <Text style={styles.type}>
            {medication.type === 'routine'
              ? 'Routine medication'
              : 'As-needed medication'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current status</Text>
          <Text style={styles.value}>{getAvailabilityLabel(medication)}</Text>
          <Text style={styles.value}>
            Last taken: {formatDateTime(medication.lastTakenAt)}
          </Text>
          <Text style={styles.value}>
            Taken today: {getTodayDoseCount(medication)}
          </Text>
          {dailyLimitReached && (
            <Text style={styles.warning}>Daily limit reached</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {medication.type === 'routine' ? (
            <>
              <Text style={styles.value}>
                Times per day: {medication.timesPerDay ?? '-'}
              </Text>
              <Text style={styles.value}>
                Scheduled times: {medication.scheduledTimes?.join(', ') || '-'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.value}>
                Min hours between doses:{' '}
                {medication.minHoursBetweenDoses ?? '-'}
              </Text>
              <Text style={styles.value}>
                Max daily doses: {medication.maxDailyDoses ?? '-'}
              </Text>
            </>
          )}
        </View>

        {medication.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{medication.notes}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {medication.takenHistory.length === 0 ? (
            <Text style={styles.value}>No doses recorded yet.</Text>
          ) : (
            medication.takenHistory.map(entry => (
              <Text key={entry} style={styles.historyItem}>
                • {formatDateTime(entry)}
              </Text>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.takeButton, takeDisabled && styles.takeButtonDisabled]}
          onPress={async () => {
            markMedicationTaken(medication.id);
            await syncMedicationWidget(
              useMedicationStore.getState().medications,
            );
          }}
          disabled={takeDisabled}
        >
          <Text style={styles.takeButtonText}>Mark as taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('AddMedication', {
              medicationId: medication.id,
            })
          }
        >
          <Text style={styles.editButtonText}>Edit medication</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            await notificationService.cancelMedicationRemindersByMedicationId(
              medication.id,
            );

            await notificationService.cancelMedicationReminder(
              getMedicationSnoozeNotificationId(medication.id),
            );

            removeMedication(medication.id);
            await syncMedicationWidget(
              useMedicationStore.getState().medications,
            );
            navigation.goBack();
          }}
        >
          <Text style={styles.deleteButtonText}>Delete medication</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#344054',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
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
    color: '#4C7EFF',
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
    marginBottom: 10,
  },
  value: {
    fontSize: 15,
    color: '#344054',
    marginBottom: 8,
  },
  historyItem: {
    fontSize: 15,
    color: '#344054',
    marginBottom: 8,
  },
  warning: {
    color: '#C2410C',
    fontWeight: '700',
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  takeButton: {
    backgroundColor: '#4C7EFF',
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
});

export default MedicationDetailScreen;

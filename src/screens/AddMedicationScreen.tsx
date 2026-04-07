import React, {useMemo, useState} from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useMedicationStore} from '../store/medicationStore';
import DateTimeField from '../components/DateTimeField';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {notificationService} from '../services/notificationService';
import {syncMedicationWidget} from '../services/widgetSync';
import {Medication, MedicationType, RoutineFrequencyType} from '../types/medication';

import {
  getRoutineReminderDates,
  getRoutineReminderNotificationId,
} from '../utils/medicationNotifications';

const AddMedicationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const medicationId = route.params?.medicationId as string | undefined;

  const addMedication = useMedicationStore(state => state.addMedication);
  const updateMedication = useMedicationStore(state => state.updateMedication);
  const medications = useMedicationStore(state => state.medications);

  const existingMedication = useMemo(
    () => medications.find(item => item.id === medicationId),
    [medications, medicationId],
  );

  const isEditMode = !!existingMedication;

  const [name, setName] = useState(existingMedication?.name ?? '');
  const [dosage, setDosage] = useState(existingMedication?.dosage ?? '');
  const [form, setForm] = useState(existingMedication?.form ?? '');
  const [type, setType] = useState<MedicationType>(
    existingMedication?.type ?? 'routine',
  );
  const [timesPerDay, setTimesPerDay] = useState(
    String(existingMedication?.timesPerDay ?? 1),
  );
  const [scheduledTimes, setScheduledTimes] = useState(
    existingMedication?.scheduledTimes?.join(', ') ?? '08:00',
  );
  const [minHoursBetweenDoses, setMinHoursBetweenDoses] = useState(
    String(existingMedication?.minHoursBetweenDoses ?? 4),
  );
  const [maxDailyDoses, setMaxDailyDoses] = useState(
    String(existingMedication?.maxDailyDoses ?? 4),
  );
  const [notes, setNotes] = useState(existingMedication?.notes ?? '');
  const [startDate, setStartDate] = useState<Date | null>(
    existingMedication?.startDate ? new Date(existingMedication.startDate) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    existingMedication?.endDate ? new Date(existingMedication.endDate) : null,
  );
  const [frequencyType, setFrequencyType] = useState<RoutineFrequencyType>(
    existingMedication?.frequencyType ?? 'daily',
  );
  const [intervalDays, setIntervalDays] = useState(
    String(existingMedication?.intervalDays ?? 2),
  );

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Missing information', 'Please fill in name and dosage.');
      return;
    }

    const medication: Medication = {
      id: existingMedication?.id ?? Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      form: form.trim() || undefined,
      type,

      frequencyType: type === 'routine' ? frequencyType : undefined,

      timesPerDay:
        type === 'routine'
          ? frequencyType === 'daily'
            ? Number(timesPerDay) || 1
            : 1
          : undefined,

      scheduledTimes:
        type === 'routine'
          ? scheduledTimes
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
          : undefined,

      intervalDays:
        type === 'routine' && frequencyType === 'interval_days'
          ? Number(intervalDays) || 2
          : undefined,

      minHoursBetweenDoses:
        type === 'as_needed' ? Number(minHoursBetweenDoses) || 4 : undefined,
      maxDailyDoses:
        type === 'as_needed' ? Number(maxDailyDoses) || 4 : undefined,
      notes: notes.trim() || undefined,
      startDate: (startDate || new Date()).toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
      lastTakenAt: existingMedication?.lastTakenAt,
      takenHistory: existingMedication?.takenHistory ?? [],
      isActive: existingMedication?.isActive ?? true,
    };

    if (isEditMode) {
      await notificationService.cancelMedicationRemindersByMedicationId(medication.id);
      updateMedication(medication);
    } else {
      addMedication(medication);
    }

    if (medication.type === 'routine' && medication.scheduledTimes?.length) {
      const validTimes = medication.scheduledTimes;

      await Promise.all(
        validTimes.map(async time => {
          const reminderDate = getRoutineReminderDates({
            ...medication,
            scheduledTimes: [time],
          })[0];

          if (!reminderDate) {
            return;
          }

          await notificationService.scheduleRepeatingMedicationReminder({
            notificationId: getRoutineReminderNotificationId(medication.id, time),
            title: `Medication reminder: ${medication.name}`,
            body: `Time to take ${medication.dosage}${medication.form ? ` (${medication.form})` : ''}.`,
            timestamp: reminderDate.getTime(),
            medicationId: medication.id,
          });
        }),
      );
    }

    await syncMedicationWidget(useMedicationStore.getState().medications);

    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Magnesium"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Dosage</Text>
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 250 mg"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Form</Text>
        <TextInput
          value={form}
          onChangeText={setForm}
          placeholder="e.g. Tablet, spray, drops"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Type</Text>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'routine' && styles.typeButtonActive,
          ]}
          onPress={() => setType('routine')}>
          <Text
            style={[
              styles.typeButtonText,
              type === 'routine' && styles.typeButtonTextActive,
            ]}>
            Routine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'as_needed' && styles.typeButtonActive,
          ]}
          onPress={() => setType('as_needed')}>
          <Text
            style={[
              styles.typeButtonText,
              type === 'as_needed' && styles.typeButtonTextActive,
            ]}>
            As needed
          </Text>
        </TouchableOpacity>

        {type === 'routine' ? (
          <>
            <Text style={styles.label}>Routine frequency</Text>

            <TouchableOpacity
              style={[
                styles.typeButton,
                frequencyType === 'daily' && styles.typeButtonActive,
              ]}
              onPress={() => setFrequencyType('daily')}>
              <Text
                style={[
                  styles.typeButtonText,
                  frequencyType === 'daily' && styles.typeButtonTextActive,
                ]}>
                Daily
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                frequencyType === 'interval_days' && styles.typeButtonActive,
              ]}
              onPress={() => setFrequencyType('interval_days')}>
              <Text
                style={[
                  styles.typeButtonText,
                  frequencyType === 'interval_days' && styles.typeButtonTextActive,
                ]}>
                Every X days
              </Text>
            </TouchableOpacity>

            {frequencyType === 'daily' ? (
              <>
                <Text style={styles.label}>Times per day</Text>
                <TextInput
                  value={timesPerDay}
                  onChangeText={setTimesPerDay}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Interval in days</Text>
                <TextInput
                  value={intervalDays}
                  onChangeText={setIntervalDays}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </>
            )}

            <Text style={styles.label}>Scheduled times</Text>
            <TextInput
              value={scheduledTimes}
              onChangeText={setScheduledTimes}
              placeholder="08:00, 20:00"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Minimum hours between doses</Text>
            <TextInput
              value={minHoursBetweenDoses}
              onChangeText={setMinHoursBetweenDoses}
              keyboardType="numeric"
              placeholder="4"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />

            <Text style={styles.label}>Maximum daily doses</Text>
            <TextInput
              value={maxDailyDoses}
              onChangeText={setMaxDailyDoses}
              keyboardType="numeric"
              placeholder="4"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </>
        )}

        <DateTimeField
          label="Start date"
          mode="date"
          value={startDate}
          onChange={setStartDate}
        />

        <DateTimeField
          label="End date"
          mode="date"
          value={endDate}
          onChange={setEndDate}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multilineInput]}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Save changes' : 'Save medication'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default AddMedicationScreen;

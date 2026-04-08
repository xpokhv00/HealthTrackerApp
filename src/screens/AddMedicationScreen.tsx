import React, {useMemo, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';

import Screen from '../components/Screen';
import DateTimeField from '../components/DateTimeField';
import {colors} from '../theme/colors';
import {useMedicationStore} from '../store/medicationStore';
import {notificationService} from '../services/notificationService';
import {syncAllWidgets} from '../services/widgetSync';
import {
  Medication,
  MedicationType,
  RoutineFrequencyType,
} from '../types/medication';
import {
  getRoutineReminderDates,
  getRoutineReminderNotificationId,
} from '../utils/medicationNotifications';

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseScheduledTimes = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

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
    existingMedication?.startDate
      ? new Date(existingMedication.startDate)
      : new Date(),
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

  const parsedTimes = useMemo(
    () => parseScheduledTimes(scheduledTimes),
    [scheduledTimes],
  );

  const applyQuickPreset = (
    preset: 'once_daily' | 'twice_daily' | 'every_8_hours' | 'as_needed',
  ) => {
    switch (preset) {
      case 'once_daily':
        setType('routine');
        setFrequencyType('daily');
        setTimesPerDay('1');
        setScheduledTimes('08:00');
        break;
      case 'twice_daily':
        setType('routine');
        setFrequencyType('daily');
        setTimesPerDay('2');
        setScheduledTimes('08:00, 20:00');
        break;
      case 'every_8_hours':
        setType('routine');
        setFrequencyType('daily');
        setTimesPerDay('3');
        setScheduledTimes('06:00, 14:00, 22:00');
        break;
      case 'as_needed':
        setType('as_needed');
        setMinHoursBetweenDoses('4');
        setMaxDailyDoses('4');
        break;
    }
  };

  const applySuggestedTimes = () => {
    const count = Number(timesPerDay) || 1;

    if (count <= 1) {
      setScheduledTimes('08:00');
      return;
    }

    if (count === 2) {
      setScheduledTimes('08:00, 20:00');
      return;
    }

    if (count === 3) {
      setScheduledTimes('06:00, 14:00, 22:00');
      return;
    }

    if (count === 4) {
      setScheduledTimes('06:00, 12:00, 18:00, 22:00');
      return;
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Missing information', 'Please fill in name and dosage.');
      return;
    }

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      Alert.alert(
        'Invalid dates',
        'End date cannot be earlier than the start date.',
      );
      return;
    }

    let normalizedScheduledTimes: string[] | undefined;
    let normalizedTimesPerDay: number | undefined;
    let normalizedIntervalDays: number | undefined;
    let normalizedMinHoursBetweenDoses: number | undefined;
    let normalizedMaxDailyDoses: number | undefined;

    if (type === 'routine') {
      normalizedScheduledTimes = parsedTimes;

      if (normalizedScheduledTimes.length === 0) {
        Alert.alert(
          'Missing schedule',
          'Please enter at least one scheduled time in HH:MM format.',
        );
        return;
      }

      const invalidTime = normalizedScheduledTimes.find(
        item => !TIME_24H_REGEX.test(item),
      );

      if (invalidTime) {
        Alert.alert(
          'Invalid time format',
          `Use 24-hour time like 08:00 or 20:30. Problem: ${invalidTime}`,
        );
        return;
      }

      if (frequencyType === 'daily') {
        normalizedTimesPerDay = Number(timesPerDay) || 1;

        if (normalizedTimesPerDay < 1) {
          Alert.alert(
            'Invalid routine',
            'Times per day must be at least 1.',
          );
          return;
        }

        if (normalizedScheduledTimes.length !== normalizedTimesPerDay) {
          Alert.alert(
            'Schedule mismatch',
            'For a daily routine, the number of scheduled times should match times per day.',
          );
          return;
        }
      } else {
        normalizedTimesPerDay = 1;
        normalizedIntervalDays = Number(intervalDays) || 2;

        if (normalizedIntervalDays < 2) {
          Alert.alert(
            'Invalid interval',
            'Every X days should be 2 or more days.',
          );
          return;
        }
      }
    } else {
      normalizedMinHoursBetweenDoses = Number(minHoursBetweenDoses) || 4;
      normalizedMaxDailyDoses = Number(maxDailyDoses) || 4;

      if (normalizedMinHoursBetweenDoses < 1) {
        Alert.alert(
          'Invalid spacing',
          'Minimum hours between doses must be at least 1.',
        );
        return;
      }

      if (normalizedMaxDailyDoses < 1) {
        Alert.alert(
          'Invalid daily limit',
          'Maximum daily doses must be at least 1.',
        );
        return;
      }
    }

    const medication: Medication = {
      id: existingMedication?.id ?? Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      form: form.trim() || undefined,
      type,
      frequencyType: type === 'routine' ? frequencyType : undefined,
      timesPerDay: type === 'routine' ? normalizedTimesPerDay : undefined,
      scheduledTimes: type === 'routine' ? normalizedScheduledTimes : undefined,
      intervalDays:
        type === 'routine' && frequencyType === 'interval_days'
          ? normalizedIntervalDays
          : undefined,
      minHoursBetweenDoses:
        type === 'as_needed' ? normalizedMinHoursBetweenDoses : undefined,
      maxDailyDoses:
        type === 'as_needed' ? normalizedMaxDailyDoses : undefined,
      notes: notes.trim() || undefined,
      startDate: (startDate || new Date()).toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
      lastTakenAt: existingMedication?.lastTakenAt,
      takenHistory: existingMedication?.takenHistory ?? [],
      isActive: existingMedication?.isActive ?? true,
    };

    if (isEditMode) {
      await notificationService.cancelMedicationRemindersByMedicationId(
        medication.id,
      );
      updateMedication(medication);
    } else {
      addMedication(medication);
    }

    if (medication.type === 'routine' && medication.scheduledTimes?.length) {
      await Promise.all(
        medication.scheduledTimes.map(async time => {
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
            body: `Time to take ${medication.dosage}${
              medication.form ? ` (${medication.form})` : ''
            }.`,
            timestamp: reminderDate.getTime(),
            medicationId: medication.id,
          });
        }),
      );
    }

    await syncAllWidgets();
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {isEditMode ? 'EDIT' : 'NEW'} MEDICATION
          </Text>
          <Text style={styles.title}>
            {isEditMode ? 'Update medication' : 'Add medication'}
          </Text>
          <Text style={styles.subtitle}>
            Save the schedule, reminders, and basic details in one place.
          </Text>
        </View>

        {!isEditMode ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick setup</Text>
            <Text style={styles.helperText}>
              Start with a common schedule and adjust only what you need.
            </Text>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyQuickPreset('once_daily')}>
                <Text style={styles.presetChipText}>Once daily</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyQuickPreset('twice_daily')}>
                <Text style={styles.presetChipText}>Twice daily</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyQuickPreset('every_8_hours')}>
                <Text style={styles.presetChipText}>Every 8 hours</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyQuickPreset('as_needed')}>
                <Text style={styles.presetChipText}>As needed</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic details</Text>

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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication type</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                type === 'routine' && styles.segmentButtonActive,
              ]}
              onPress={() => setType('routine')}>
              <Text
                style={[
                  styles.segmentButtonText,
                  type === 'routine' && styles.segmentButtonTextActive,
                ]}>
                Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                type === 'as_needed' && styles.segmentButtonActive,
              ]}
              onPress={() => setType('as_needed')}>
              <Text
                style={[
                  styles.segmentButtonText,
                  type === 'as_needed' && styles.segmentButtonTextActive,
                ]}>
                As needed
              </Text>
            </TouchableOpacity>
          </View>

          {type === 'routine' ? (
            <>
              <Text style={styles.label}>Routine frequency</Text>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    frequencyType === 'daily' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setFrequencyType('daily')}>
                  <Text
                    style={[
                      styles.segmentButtonText,
                      frequencyType === 'daily' &&
                      styles.segmentButtonTextActive,
                    ]}>
                    Daily
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    frequencyType === 'interval_days' &&
                    styles.segmentButtonActive,
                  ]}
                  onPress={() => setFrequencyType('interval_days')}>
                  <Text
                    style={[
                      styles.segmentButtonText,
                      frequencyType === 'interval_days' &&
                      styles.segmentButtonTextActive,
                    ]}>
                    Every X days
                  </Text>
                </TouchableOpacity>
              </View>

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

                  <TouchableOpacity
                    style={styles.helperButton}
                    onPress={applySuggestedTimes}>
                    <Text style={styles.helperButtonText}>
                      Use suggested times
                    </Text>
                  </TouchableOpacity>
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
              <Text style={styles.helperText}>
                Separate multiple times with commas and use 24-hour format.
              </Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates and notes</Text>

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
        </View>

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
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
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
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  helperButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },
  helperButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    alignItems: 'center',
    marginRight: 10,
  },
  presetChipText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  segmentButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
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

import React, {useEffect, useMemo, useState} from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppointmentStore} from '../store/appointmentStore';
import {Appointment} from '../types/appointment';
import {appointmentTemplates} from '../data/appointmentTemplates';
import DateTimeField from '../components/DateTimeField';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {notificationService} from '../services/notificationService';
import {getBestAppointmentReminderDate} from '../utils/appointmentNotifications';

const visitTypes = Object.keys(appointmentTemplates);

const AddAppointmentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const appointmentId = route.params?.appointmentId as string | undefined;

  const addAppointment = useAppointmentStore(state => state.addAppointment);
  const updateAppointment = useAppointmentStore(state => state.updateAppointment);
  const appointments = useAppointmentStore(state => state.appointments);

  const existingAppointment = useMemo(
    () => appointments.find(item => item.id === appointmentId),
    [appointments, appointmentId],
  );

  const isEditMode = !!existingAppointment;

  const [doctorName, setDoctorName] = useState(existingAppointment?.doctorName ?? '');
  const [patientName, setPatientName] = useState(existingAppointment?.patientName ?? '');
  const [specialty, setSpecialty] = useState(existingAppointment?.specialty ?? '');
  const [visitType, setVisitType] = useState(
    existingAppointment?.visitType ?? visitTypes[0] ?? '',
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    existingAppointment ? new Date(existingAppointment.dateTime) : null,
  );
  const [selectedTime, setSelectedTime] = useState<Date | null>(
    existingAppointment ? new Date(existingAppointment.dateTime) : null,
  );
  const [location, setLocation] = useState(existingAppointment?.location ?? '');
  const [notes, setNotes] = useState(existingAppointment?.notes ?? '');
  const [preparation, setPreparation] = useState<string[]>(
    existingAppointment?.preparation ?? [],
  );

  useEffect(() => {
    if (!isEditMode && visitType && appointmentTemplates[visitType]) {
      setPreparation(appointmentTemplates[visitType]);
    }
  }, [visitType, isEditMode]);

  const handlePreparationChange = (text: string) => {
    const items = text
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);

    setPreparation(items);
  };

  const handleSave = async () => {
    if (
      !doctorName.trim() ||
      !specialty.trim() ||
      !visitType.trim() ||
      !selectedDate ||
      !selectedTime
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in doctor, specialty, visit type, date, and time.',
      );
      return;
    }

    const mergedDateTime = new Date(selectedDate);
    mergedDateTime.setHours(selectedTime.getHours());
    mergedDateTime.setMinutes(selectedTime.getMinutes());
    mergedDateTime.setSeconds(0);
    mergedDateTime.setMilliseconds(0);

    const appointment: Appointment = {
      id: existingAppointment?.id ?? Date.now().toString(),
      patientName: patientName.trim() || undefined,
      doctorName: doctorName.trim(),
      specialty: specialty.trim(),
      visitType: visitType.trim(),
      dateTime: mergedDateTime.toISOString(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      preparation,
    };

    if (isEditMode) {
      await notificationService.cancelAppointmentReminder(appointment.id);
      updateAppointment(appointment);
    } else {
      addAppointment(appointment);
    }

    const reminderDate = getBestAppointmentReminderDate(appointment);

    if (reminderDate) {
      const timeStr = mergedDateTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const prepLines =
        appointment.preparation.length > 0
          ? '<br><br><b>Preparation</b><br>' +
            appointment.preparation.map(p => `&nbsp;&nbsp;• ${p}`).join('<br>')
          : '';
      const locationLine = appointment.location
        ? `<br>📍 ${appointment.location}`
        : '';
      const bigText =
        `🕐 <b>${timeStr}</b> &nbsp;•&nbsp; ${appointment.specialty}` +
        locationLine +
        prepLines;
      await notificationService.scheduleAppointmentReminder({
        id: appointment.id,
        title: `Tomorrow: ${appointment.visitType} with ${appointment.doctorName}`,
        body: `${appointment.specialty} • ${timeStr}${appointment.location ? ` • ${appointment.location}` : ''}`,
        bigText,
        timestamp: reminderDate.getTime(),
        appointmentId: appointment.id,
      });
    }

    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.label}>Doctor name</Text>
        <TextInput
          value={doctorName}
          onChangeText={setDoctorName}
          placeholder="e.g. Dr. Novak"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>For (optional)</Text>
        <TextInput
          value={patientName}
          onChangeText={setPatientName}
          placeholder="e.g. Emma, my son..."
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Specialty</Text>
        <TextInput
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="e.g. Cardiology"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Visit type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {visitTypes.map(type => {
            const active = visitType === type;

            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setVisitType(type)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <DateTimeField
          label="Date"
          mode="date"
          value={selectedDate}
          onChange={setSelectedDate}
        />

        <DateTimeField
          label="Time"
          mode="time"
          value={selectedTime}
          onChange={setSelectedTime}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Clinic or address"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Preparation checklist</Text>
        <TextInput
          value={preparation.join('\n')}
          onChangeText={handlePreparationChange}
          placeholder="One item per line"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[styles.input, styles.multilineInput]}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[styles.input, styles.multilineInput]}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Save changes' : 'Save appointment'}
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
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
  },
  chipTextActive: {
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

export default AddAppointmentScreen;

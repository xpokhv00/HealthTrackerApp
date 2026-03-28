import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppointmentStore} from '../store/appointmentStore';
import {
  formatAppointmentDateTime,
  getTimeUntilAppointment,
  isUpcomingAppointment,
} from '../utils/appointment';
import {notificationService} from '../services/notificationService';
import { colors } from '../theme/colors.ts';

const AppointmentDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {appointmentId} = route.params;

  const appointment = useAppointmentStore(state =>
    state.appointments.find(item => item.id === appointmentId),
  );
  const removeAppointment = useAppointmentStore(state => state.removeAppointment);

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Appointment not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUpcoming = isUpcomingAppointment(appointment);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.visitType}>{appointment.visitType}</Text>
          <Text style={styles.doctor}>{appointment.doctorName}</Text>
          <Text style={styles.specialty}>{appointment.specialty}</Text>
          <Text style={styles.dateTime}>
            {formatAppointmentDateTime(appointment.dateTime)}
          </Text>
          <Text style={styles.countdown}>
            {isUpcoming ? getTimeUntilAppointment(appointment.dateTime) : 'Past appointment'}
          </Text>
        </View>

        {appointment.location ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.value}>{appointment.location}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation</Text>
          {appointment.preparation.length === 0 ? (
            <Text style={styles.value}>No preparation notes added.</Text>
          ) : (
            appointment.preparation.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.listItem}>
                • {item}
              </Text>
            ))
          )}
        </View>

        {appointment.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{appointment.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('AddAppointment', {
              appointmentId: appointment.id,
            })
          }>
          <Text style={styles.editButtonText}>Edit appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            await notificationService.cancelAppointmentReminder(appointment.id);
            removeAppointment(appointment.id);
            navigation.goBack();
          }}>
          <Text style={styles.deleteButtonText}>Delete appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  visitType: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  doctor: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: '#344054',
  },
  specialty: {
    marginTop: 4,
    fontSize: 15,
    color: '#667085',
  },
  dateTime: {
    marginTop: 10,
    fontSize: 16,
    color: '#1D2939',
    fontWeight: '700',
  },
  countdown: {
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
  },
  listItem: {
    fontSize: 15,
    color: '#344054',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  deleteButton: {
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
    marginBottom: 12,
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

export default AppointmentDetailScreen;

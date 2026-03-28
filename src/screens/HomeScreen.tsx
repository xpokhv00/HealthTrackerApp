import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useMedicationStore} from '../store/medicationStore';
import {useAppointmentStore} from '../store/appointmentStore';
import {useSymptomStore} from '../store/symptomStore';
import {getAvailabilityLabel} from '../utils/medication';
import {
  formatAppointmentDateTime,
  getUpcomingAppointments,
} from '../utils/appointment';
import {
  formatSymptomDateTime,
  getRecentSymptoms,
  getSeverityLabel,
} from '../utils/symptom';
import {notificationService} from '../services/notificationService';
import {colors} from '../theme/colors.ts';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);

  const recentMeds = medications.slice(0, 3);
  const nextAppointment = getUpcomingAppointments(appointments)[0];
  const recentSymptoms = getRecentSymptoms(symptoms, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Health Overview</Text>
        <Text style={styles.subtitle}>Your most important items for today</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today’s medications</Text>

          {recentMeds.length === 0 ? (
            <Text style={styles.cardText}>No medications added yet.</Text>
          ) : (
            recentMeds.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={styles.flexOne}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {getAvailabilityLabel(item)}
                  </Text>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Medications')}>
            <Text style={styles.linkButtonText}>Open medications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next appointment</Text>

          {nextAppointment ? (
            <>
              <Text style={styles.itemTitle}>{nextAppointment.visitType}</Text>
              <Text style={styles.itemMeta}>
                {nextAppointment.doctorName} • {nextAppointment.specialty}
              </Text>
              <Text style={styles.itemMeta}>
                {formatAppointmentDateTime(nextAppointment.dateTime)}
              </Text>
            </>
          ) : (
            <Text style={styles.cardText}>No upcoming appointments.</Text>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.linkButtonText}>Open appointments</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>History & reports</Text>
          <Text style={styles.cardText}>
            Review your recent health data and generate a doctor-friendly
            summary.
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.linkButtonText}>Open history</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent symptoms</Text>

          {recentSymptoms.length === 0 ? (
            <Text style={styles.cardText}>No symptoms logged yet.</Text>
          ) : (
            recentSymptoms.map(item => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.itemTitle}>{item.symptom}</Text>
                <Text style={styles.itemMeta}>
                  {item.severity}/10 • {getSeverityLabel(item.severity)}
                </Text>
                <Text style={styles.itemMeta}>
                  {formatSymptomDateTime(item.createdAt)}
                </Text>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('AddSymptom')}>
            <Text style={styles.secondaryButtonText}>Log symptom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Symptoms')}>
            <Text style={styles.linkButtonText}>Open symptoms</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => notificationService.showInstantTestNotification()}>
          <Text style={styles.testButtonText}>Send test notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#475467',
  },
  row: {
    marginBottom: 12,
  },
  flexOne: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
  },
  linkButton: {
    marginTop: 12,
    backgroundColor: '#4C7EFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  testButton: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default HomeScreen;

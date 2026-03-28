import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import ReportSection from '../components/ReportSection';
import {useMedicationStore} from '../store/medicationStore';
import {useAppointmentStore} from '../store/appointmentStore';
import {useSymptomStore} from '../store/symptomStore';
import {colors} from '../theme/colors';
import {
  getActiveMedicationsForReport,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getUpcomingAppointmentsForReport,
} from '../utils/report';

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);

  const activeMedications = getActiveMedicationsForReport(medications);
  const recentSymptoms = getRecentSymptomsForReport(symptoms, 5);
  const upcomingAppointments = getUpcomingAppointmentsForReport(appointments);
  const pastAppointments = getPastAppointmentsForReport(appointments);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>History & Report</Text>
        <Text style={styles.subtitle}>
          Review your health data and prepare a doctor-friendly summary
        </Text>

        <ReportSection title="Overview">
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeMedications.length}</Text>
              <Text style={styles.statLabel}>Active medications</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{recentSymptoms.length}</Text>
              <Text style={styles.statLabel}>Recent symptoms</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
              <Text style={styles.statLabel}>Upcoming appointments</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pastAppointments.length}</Text>
              <Text style={styles.statLabel}>Past appointments</Text>
            </View>
          </View>
        </ReportSection>

        <ReportSection title="Recent symptoms">
          {recentSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No symptoms logged yet.</Text>
          ) : (
            recentSymptoms.map(item => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowTitle}>{item.symptom}</Text>
                <Text style={styles.rowMeta}>Severity: {item.severity}/10</Text>
              </View>
            ))
          )}
        </ReportSection>

        <ReportSection title="Current medications">
          {activeMedications.length === 0 ? (
            <Text style={styles.emptyText}>No active medications.</Text>
          ) : (
            activeMedications.map(item => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.dosage}
                  {item.form ? ` • ${item.form}` : ''}
                </Text>
              </View>
            ))
          )}
        </ReportSection>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('DoctorReport')}>
          <Text style={styles.primaryButtonText}>Open doctor report</Text>
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
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 15,
    color: colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  row: {
    marginBottom: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default HistoryScreen;

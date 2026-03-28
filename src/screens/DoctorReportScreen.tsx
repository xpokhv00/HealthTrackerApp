import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Screen from '../components/Screen';
import ReportSection from '../components/ReportSection';
import {useMedicationStore} from '../store/medicationStore';
import {useAppointmentStore} from '../store/appointmentStore';
import {useSymptomStore} from '../store/symptomStore';
import {colors} from '../theme/colors';
import {
  getActiveMedicationsForReport,
  getAverageSeverity,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getUpcomingAppointmentsForReport,
  groupSymptomsByName,
} from '../utils/report';
import {formatAppointmentDateTime} from '../utils/appointment';
import {formatSymptomDateTime} from '../utils/symptom';
import {
  exportDoctorReportPdf,
  shareDoctorReportPdf,
} from '../services/doctorReportExport';

const DoctorReportScreen: React.FC = () => {
  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);

  const [isExporting, setIsExporting] = useState(false);

  const activeMedications = getActiveMedicationsForReport(medications);
  const recentSymptoms = getRecentSymptomsForReport(symptoms, 10);
  const groupedSymptoms = groupSymptomsByName(recentSymptoms);
  const upcomingAppointments = getUpcomingAppointmentsForReport(appointments);
  const pastAppointments = getPastAppointmentsForReport(appointments).slice(0, 5);

  const handleExportAndShare = async () => {
    try {
      setIsExporting(true);

      const {fileUrl} = await exportDoctorReportPdf({
        medications,
        appointments,
        symptoms,
      });

      await shareDoctorReportPdf(fileUrl);
    } catch (error) {
      Alert.alert('Export failed', 'Could not create or share the PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Doctor Report</Text>
        <Text style={styles.subtitle}>
          A compact overview of current symptoms, treatments, and visits
        </Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportAndShare}
          disabled={isExporting}>
          <Text style={styles.exportButtonText}>
            {isExporting ? 'Preparing PDF…' : 'Export as PDF'}
          </Text>
        </TouchableOpacity>

        <ReportSection title="Current symptoms summary">
          {recentSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No recent symptoms available.</Text>
          ) : (
            Object.entries(groupedSymptoms).map(([name, entries]) => (
              <View key={name} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{name}</Text>
                <Text style={styles.itemMeta}>
                  Entries: {entries.length} • Avg severity: {getAverageSeverity(entries)}/10
                </Text>
                <Text style={styles.itemMeta}>
                  Latest: {formatSymptomDateTime(entries[0].createdAt)}
                </Text>
                {entries[0].note ? (
                  <Text style={styles.itemNote}>Latest note: {entries[0].note}</Text>
                ) : null}
              </View>
            ))
          )}
        </ReportSection>

        <ReportSection title="Current medications">
          {activeMedications.length === 0 ? (
            <Text style={styles.emptyText}>No active medications listed.</Text>
          ) : (
            activeMedications.map(item => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.dosage}
                  {item.form ? ` • ${item.form}` : ''}
                </Text>
                <Text style={styles.itemMeta}>
                  Type: {item.type === 'routine' ? 'Routine' : 'As needed'}
                </Text>
                {item.notes ? (
                  <Text style={styles.itemNote}>Notes: {item.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </ReportSection>

        <ReportSection title="Upcoming appointments">
          {upcomingAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming appointments.</Text>
          ) : (
            upcomingAppointments.slice(0, 3).map(item => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{item.visitType}</Text>
                <Text style={styles.itemMeta}>
                  {item.doctorName} • {item.specialty}
                </Text>
                <Text style={styles.itemMeta}>
                  {formatAppointmentDateTime(item.dateTime)}
                </Text>
              </View>
            ))
          )}
        </ReportSection>

        <ReportSection title="Recent appointment history">
          {pastAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No past appointments recorded.</Text>
          ) : (
            pastAppointments.map(item => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{item.visitType}</Text>
                <Text style={styles.itemMeta}>
                  {item.doctorName} • {item.specialty}
                </Text>
                <Text style={styles.itemMeta}>
                  {formatAppointmentDateTime(item.dateTime)}
                </Text>
                {item.notes ? (
                  <Text style={styles.itemNote}>Notes: {item.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </ReportSection>
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
  exportButton: {
    marginBottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  itemBlock: {
    marginBottom: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemNote: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
  },
});

export default DoctorReportScreen;

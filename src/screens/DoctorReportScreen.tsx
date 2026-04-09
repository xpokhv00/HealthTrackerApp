import React, {useMemo, useState} from 'react';
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
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {colors} from '../theme/colors';
import {
  getActiveMedicationsForReport,
  getAverageSeverity,
  getMostFrequentSymptomForReport,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getReportWindowLabel,
  getRoutineAdherenceSummary,
  getStrongestSymptomForReport,
  getUpcomingAppointmentsForReport,
  groupSymptomsByName,
  ReportWindow,
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
  const routineSlots = useRoutineDoseStore(state => state.slots);

  const [isExporting, setIsExporting] = useState(false);
  const [reportWindow, setReportWindow] = useState<ReportWindow>(14);

  const activeMedications = useMemo(
    () => getActiveMedicationsForReport(medications),
    [medications],
  );

  const recentSymptoms = useMemo(
    () => getRecentSymptomsForReport(symptoms, 12, reportWindow),
    [symptoms, reportWindow],
  );

  const groupedSymptoms = useMemo(
    () => groupSymptomsByName(recentSymptoms),
    [recentSymptoms],
  );

  const upcomingAppointments = useMemo(
    () => getUpcomingAppointmentsForReport(appointments),
    [appointments],
  );

  const pastAppointments = useMemo(
    () => getPastAppointmentsForReport(appointments, reportWindow).slice(0, 5),
    [appointments, reportWindow],
  );

  const mostFrequentSymptom = useMemo(
    () => getMostFrequentSymptomForReport(recentSymptoms),
    [recentSymptoms],
  );

  const strongestSymptom = useMemo(
    () => getStrongestSymptomForReport(recentSymptoms),
    [recentSymptoms],
  );

  const overallAverageSeverity = useMemo(
    () => getAverageSeverity(recentSymptoms),
    [recentSymptoms],
  );

  const adherenceSummary = useMemo(
    () => getRoutineAdherenceSummary(medications, routineSlots, reportWindow),
    [medications, routineSlots, reportWindow],
  );

  const handleExportAndShare = async () => {
    try {
      setIsExporting(true);

      const {fileUrl} = await exportDoctorReportPdf({
        medications,
        appointments,
        symptoms,
        routineSlots,
        reportWindow,
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
        <Text style={styles.subtitle}>
          A compact overview of current symptoms, treatments, visits, and routine adherence
        </Text>

        <View style={styles.filterRow}>
          {[7, 14, 30, 'all'].map(item => {
            const active = reportWindow === item;
            const label = item === 'all' ? 'All' : `${item}d`;

            return (
              <TouchableOpacity
                key={String(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setReportWindow(item as ReportWindow)}>
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportAndShare}
          disabled={isExporting}>
          <Text style={styles.exportButtonText}>
            {isExporting ? 'Preparing PDF…' : 'Export as PDF'}
          </Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>REPORT PERIOD</Text>
          <Text style={styles.summaryTitle}>
            {getReportWindowLabel(reportWindow)}
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>Symptoms logged</Text>
              <Text style={styles.summaryTileValue}>{recentSymptoms.length}</Text>
            </View>

            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>Avg severity</Text>
              <Text style={styles.summaryTileValue}>
                {recentSymptoms.length > 0 ? `${overallAverageSeverity}/10` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summarySectionLabel}>Routine adherence</Text>
            <Text style={styles.summarySectionValue}>
              {adherenceSummary.total > 0
                ? `${adherenceSummary.adherencePercent}%`
                : 'No routine slots in this period'}
            </Text>
            {adherenceSummary.total > 0 ? (
              <Text style={styles.summarySectionMeta}>
                {adherenceSummary.taken} taken • {adherenceSummary.missed} missed •{' '}
                {adherenceSummary.pending} pending
              </Text>
            ) : null}
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summarySectionLabel}>Most frequent symptom</Text>
            <Text style={styles.summarySectionValue}>
              {mostFrequentSymptom
                ? `${mostFrequentSymptom.name} • ${mostFrequentSymptom.count}x`
                : 'No symptom pattern available'}
            </Text>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summarySectionLabel}>Strongest recent symptom</Text>
            <Text style={styles.summarySectionValue}>
              {strongestSymptom
                ? `${strongestSymptom.symptom} • ${strongestSymptom.severity}/10`
                : 'No symptom entries'}
            </Text>
            {strongestSymptom ? (
              <Text style={styles.summarySectionMeta}>
                {formatSymptomDateTime(strongestSymptom.createdAt)}
              </Text>
            ) : null}
          </View>
        </View>

        <ReportSection title="Current symptoms summary">
          {recentSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No symptoms in this period.</Text>
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
                {item.purpose ? (
                  <Text style={styles.itemNote}>Purpose: {item.purpose}</Text>
                ) : null}
                {item.usageInstructions ? (
                  <Text style={styles.itemNote}>Take: {item.usageInstructions}</Text>
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
                {item.location ? (
                  <Text style={styles.itemNote}>Location: {item.location}</Text>
                ) : null}
              </View>
            ))
          )}
        </ReportSection>

        <ReportSection title="Recent appointment history">
          {pastAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No past appointments in this period.</Text>
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
  subtitle: {
    marginBottom: 16,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 14,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  summaryTileLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryTileValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  summarySection: {
    marginTop: 10,
  },
  summarySectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summarySectionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  summarySectionMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
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

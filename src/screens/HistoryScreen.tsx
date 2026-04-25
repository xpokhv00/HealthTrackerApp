import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Screen from '../components/Screen';
import {useMedicationStore} from '../store/medicationStore';
import {useAppointmentStore} from '../store/appointmentStore';
import {useSymptomStore} from '../store/symptomStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {colors, severityColors} from '../theme/colors';
import {
  getActiveMedicationsForReport,
  getAverageSeverity,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getRoutineAdherenceSummary,
  getUpcomingAppointmentsForReport,
  groupSymptomsByName,
  ReportWindow,
} from '../utils/report';
import {formatAppointmentDate, formatAppointmentTime} from '../utils/appointment';
import {
  exportDoctorReportPdf,
  shareDoctorReportPdf,
} from '../services/doctorReportExport';

function adherenceColor(pct: number) {
  if (pct >= 80) {return colors.severityLowText;}
  if (pct >= 50) {return colors.severityMidText;}
  return colors.severityHighText;
}

const WINDOW_OPTIONS: {label: string; value: ReportWindow}[] = [
  {label: '7d', value: 7},
  {label: '14d', value: 14},
  {label: '30d', value: 30},
  {label: 'All', value: 'all'},
];

const HistoryScreen: React.FC = () => {
  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);
  const routineSlots = useRoutineDoseStore(state => state.slots);

  const [reportWindow, setReportWindow] = useState<ReportWindow>(14);
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const peopleOptions = useMemo(() => {
    const hasMe =
      medications.some(m => !m.patientName) ||
      symptoms.some(s => !s.patientName) ||
      appointments.some(a => !a.patientName);
    const names = [
      ...medications.map(m => m.patientName),
      ...symptoms.map(s => s.patientName),
      ...appointments.map(a => a.patientName),
    ].filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    if (unique.length === 0) {return [];}
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [medications, symptoms, appointments]);

  const filteredMedications = useMemo(() => {
    if (personFilter === 'all') {return medications;}
    if (personFilter === 'me') {return medications.filter(m => !m.patientName);}
    return medications.filter(m => m.patientName === personFilter);
  }, [medications, personFilter]);

  const filteredSymptoms = useMemo(() => {
    if (personFilter === 'all') {return symptoms;}
    if (personFilter === 'me') {return symptoms.filter(s => !s.patientName);}
    return symptoms.filter(s => s.patientName === personFilter);
  }, [symptoms, personFilter]);

  const filteredAppointments = useMemo(() => {
    if (personFilter === 'all') {return appointments;}
    if (personFilter === 'me') {return appointments.filter(a => !a.patientName);}
    return appointments.filter(a => a.patientName === personFilter);
  }, [appointments, personFilter]);

  const activeMedications = useMemo(
    () => getActiveMedicationsForReport(filteredMedications),
    [filteredMedications],
  );

  const recentSymptoms = useMemo(
    () => getRecentSymptomsForReport(filteredSymptoms, 12, reportWindow),
    [filteredSymptoms, reportWindow],
  );

  const groupedSymptoms = useMemo(
    () => groupSymptomsByName(recentSymptoms),
    [recentSymptoms],
  );

  const upcomingAppointments = useMemo(
    () => getUpcomingAppointmentsForReport(filteredAppointments).slice(0, 3),
    [filteredAppointments],
  );

  const pastAppointments = useMemo(
    () => getPastAppointmentsForReport(filteredAppointments, reportWindow).slice(0, 5),
    [filteredAppointments, reportWindow],
  );

  const adherence = useMemo(
    () => getRoutineAdherenceSummary(filteredMedications, routineSlots, reportWindow),
    [filteredMedications, routineSlots, reportWindow],
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const {fileUrl} = await exportDoctorReportPdf({
        medications: filteredMedications,
        appointments: filteredAppointments,
        symptoms: filteredSymptoms,
        routineSlots,
        reportWindow,
      });
      await shareDoctorReportPdf(fileUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Export failed', msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Report</Text>
          <TouchableOpacity
            style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.8}>
            <Ionicons name="share-outline" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>
              {isExporting ? 'Preparing…' : 'Export PDF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters — time window + person in one row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {WINDOW_OPTIONS.map(opt => {
            const active = reportWindow === opt.value;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setReportWindow(opt.value)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {peopleOptions.length > 0 && (
            <>
              <View style={styles.chipDivider} />
              {peopleOptions.map(option => {
                const active = personFilter === option;
                const label =
                  option === 'all' ? 'Everyone' : option === 'me' ? 'Me' : option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setPersonFilter(option)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Stat bar */}
        <View style={styles.statBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeMedications.length}</Text>
            <Text style={styles.statLabel}>medications</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recentSymptoms.length}</Text>
            <Text style={styles.statLabel}>symptoms</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>upcoming</Text>
          </View>
          {adherence.total > 0 && (
            <>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: adherenceColor(adherence.adherencePercent)}]}>
                  {adherence.adherencePercent}%
                </Text>
                <Text style={styles.statLabel}>adherence</Text>
              </View>
            </>
          )}
        </View>

        {/* Symptoms section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          {Object.keys(groupedSymptoms).length === 0 ? (
            <Text style={styles.emptyText}>None logged in this period</Text>
          ) : (
            Object.entries(groupedSymptoms).map(([name, entries]) => {
              const avg = getAverageSeverity(entries);
              const sc = severityColors(avg);
              return (
                <View key={name} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowName}>{name}</Text>
                    {entries[0].note ? (
                      <Text style={styles.rowNote} numberOfLines={1}>
                        {entries[0].note}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.badge, {backgroundColor: sc.bg}]}>
                      <Text style={[styles.badgeText, {color: sc.text}]}>
                        {avg}/10
                      </Text>
                    </View>
                    <Text style={styles.rowCount}>{entries.length}×</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Medications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {activeMedications.length === 0 ? (
            <Text style={styles.emptyText}>No active medications</Text>
          ) : (
            activeMedications.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  {item.purpose ? (
                    <Text style={styles.rowNote} numberOfLines={1}>{item.purpose}</Text>
                  ) : null}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowMeta}>{item.dosage}</Text>
                  {item.form ? (
                    <Text style={styles.rowMeta}>{item.form}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Upcoming appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          ) : (
            upcomingAppointments.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName}>Dr. {item.doctorName}</Text>
                  <Text style={styles.rowNote}>{item.visitType}{item.location ? ` · ${item.location}` : ''}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowMeta}>{formatAppointmentDate(item.dateTime)}</Text>
                  <Text style={styles.rowMeta}>{formatAppointmentTime(item.dateTime)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Past visits */}
        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past visits</Text>
            {pastAppointments.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName}>Dr. {item.doctorName}</Text>
                  <Text style={styles.rowNote}>{item.visitType}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowMeta}>{formatAppointmentDate(item.dateTime)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  statBar: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statSep: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowNote: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rowCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingBottom: 8,
  },
});

export default HistoryScreen;

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
import {useRoutineDoseStore} from '../store/routineDoseStore';

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
import {getTodayRoutineDoseSummary} from '../utils/routineDoseSummary';

import RoutineProgressCircle from '../components/RoutineProgressCircle';
import {colors} from '../theme/colors.ts';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);
  const routineSlots = useRoutineDoseStore(state => state.slots);

  const routineSummary = getTodayRoutineDoseSummary(routineSlots);
  const nextAppointment = getUpcomingAppointments(appointments)[0];
  const medicationPreview = medications.slice(0, 2);
  const recentSymptoms = getRecentSymptoms(symptoms, 2);

  const routineStatusLabel =
    routineSummary.overdueCount > 0
      ? `${routineSummary.overdueCount} overdue`
      : routineSummary.total === 0
        ? 'No doses today'
        : routineSummary.remaining === 0
          ? 'All done'
          : `${routineSummary.remaining} left`;

  const routineMessage = routineSummary.nextActionable
    ? `Next: ${routineSummary.nextActionable.medicationName} at ${routineSummary.nextActionable.scheduledTime}`
    : routineSummary.total === 0
      ? 'No routine medication is scheduled for today.'
      : 'All routine doses are completed for today.';

  const statusPillStyle =
    routineSummary.overdueCount > 0
      ? styles.statusPillWarning
      : routineSummary.remaining === 0
        ? styles.statusPillSuccess
        : styles.statusPillNeutral;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.title}>Health overview</Text>
          <Text style={styles.subtitle}>
            See what needs attention and act quickly.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Today’s routine</Text>

              <View style={[styles.statusPill, statusPillStyle]}>
                <Text style={styles.statusPillText}>{routineStatusLabel}</Text>
              </View>

              <Text style={styles.heroStats}>
                {routineSummary.taken} completed • {routineSummary.remaining}{' '}
                remaining
              </Text>

              <Text style={styles.heroMessage}>{routineMessage}</Text>
            </View>

            <RoutineProgressCircle
              percent={routineSummary.percent}
              taken={routineSummary.taken}
              total={routineSummary.total}
              size={112}
              strokeWidth={10}
            />
          </View>

          <View style={styles.heroChipsRow}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipLabel}>Scheduled</Text>
              <Text style={styles.heroChipValue}>{routineSummary.total}</Text>
            </View>

            <View style={styles.heroChip}>
              <Text style={styles.heroChipLabel}>Completed</Text>
              <Text style={styles.heroChipValue}>{routineSummary.taken}</Text>
            </View>

            <View style={styles.heroChip}>
              <Text style={styles.heroChipLabel}>Remaining</Text>
              <Text style={styles.heroChipValue}>{routineSummary.remaining}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Medications')}>
            <Text style={styles.primaryButtonText}>
              {routineSummary.remaining > 0
                ? 'Open medications'
                : 'View medications'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.actionCard}
            onPress={() => navigation.navigate('Medications')}>
            <Text style={styles.actionTitle}>Medications</Text>
            <Text style={styles.actionMeta}>{medications.length} saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.actionCard}
            onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.actionTitle}>Appointments</Text>
            <Text style={styles.actionMeta}>
              {nextAppointment ? 'Next visit ready' : 'None upcoming'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddSymptom')}>
            <Text style={styles.actionTitle}>Log symptom</Text>
            <Text style={styles.actionMeta}>Quick entry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Next appointment</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

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
            <Text style={styles.emptyText}>No upcoming appointments.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Medications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Medications')}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          {medicationPreview.length === 0 ? (
            <Text style={styles.emptyText}>No medications added yet.</Text>
          ) : (
            medicationPreview.map(item => (
              <View key={item.id} style={styles.listRow}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemMeta}>{getAvailabilityLabel(item)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent symptoms</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Symptoms')}>
              <Text style={styles.linkText}>History</Text>
            </TouchableOpacity>
          </View>

          {recentSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No symptoms logged yet.</Text>
          ) : (
            recentSymptoms.map(item => (
              <View key={item.id} style={styles.listRow}>
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

          <View style={styles.cardActions}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddSymptom')}>
              <Text style={styles.secondaryButtonText}>Log symptom</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
    marginTop: 6,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  statusPillNeutral: {
    backgroundColor: '#EEF2FF',
  },
  statusPillSuccess: {
    backgroundColor: '#ECFDF3',
  },
  statusPillWarning: {
    backgroundColor: '#FEF3F2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  heroStats: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  heroMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },
  heroChipsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
  },
  heroChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  heroChipLabel: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 2,
  },
  heroChipValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    padding: 14,
    marginRight: 10,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  actionMeta: {
    fontSize: 13,
    color: '#667085',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  listRow: {
    marginBottom: 14,
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
  emptyText: {
    fontSize: 15,
    color: '#667085',
  },
  cardActions: {
    marginTop: 4,
  },
  secondaryButton: {
    marginTop: 8,
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
    fontSize: 15,
  },
});

export default HomeScreen;

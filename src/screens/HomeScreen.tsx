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

import {getUpcomingAppointments, formatAppointmentDateTime} from '../utils/appointment';
import {getRecentSymptoms, formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';
import {getTodayRoutineDoseSummary} from '../utils/routineDoseSummary';

import RoutineProgressCircle from '../components/RoutineProgressCircle';
import {colors, severityColors, countdownColors} from '../theme/colors';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) {return 'Good morning';}
  if (h < 18) {return 'Good afternoon';}
  return 'Good evening';
}

function timeUntil(dateTime: string): string {
  const diff = new Date(dateTime).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {return 'Today';}
  if (days === 1) {return 'Tomorrow';}
  return `In ${days}d`;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const medications = useMedicationStore(state => state.medications);
  const appointments = useAppointmentStore(state => state.appointments);
  const symptoms = useSymptomStore(state => state.symptoms);
  const routineSlots = useRoutineDoseStore(state => state.slots);

  const routineSummary = getTodayRoutineDoseSummary(routineSlots);
  const nextAppointment = getUpcomingAppointments(appointments)[0];
  const medicationPreview = medications.slice(0, 3);
  const recentSymptoms = getRecentSymptoms(symptoms, 3);
  const primaryAction = routineSummary.primaryAction;

  const heroMessageColor =
    routineSummary.overdueCount > 0
      ? colors.severityHighText
      : routineSummary.remaining === 0 && routineSummary.total > 0
        ? colors.severityLowText
        : colors.neutralText;

  const heroMessage =
    routineSummary.overdueCount > 0
      ? `⚠ ${routineSummary.overdueCount} dose${routineSummary.overdueCount > 1 ? 's' : ''} overdue`
      : primaryAction
        ? `Next: ${primaryAction.medicationName} at ${primaryAction.scheduledTime}`
        : routineSummary.total === 0
          ? 'No routine doses scheduled today'
          : '✓ All routine doses completed';

  const handlePrimaryActionPress = () => {
    if (primaryAction?.medicationId) {
      navigation.navigate('MedicationDetail', {medicationId: primaryAction.medicationId});
      return;
    }
    navigation.navigate('Medications');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.subtitle}>Here's your health overview for today.</Text>
        </View>

        {/* Hero — routine progress */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Today's routine</Text>

              {primaryAction ? (
                <View style={styles.nextDoseBlock}>
                  <Text style={[styles.nextDoseLabel, routineSummary.overdueCount > 0 && styles.nextDoseLabelOverdue]}>
                    {routineSummary.overdueCount > 0 ? 'Overdue' : 'Next up'}
                  </Text>
                  <Text style={styles.nextDoseName}>{primaryAction.medicationName}</Text>
                  <Text style={styles.nextDoseTime}>🕐 {primaryAction.scheduledTime}</Text>
                </View>
              ) : (
                <Text style={[styles.heroMessage, {color: heroMessageColor}]}>{heroMessage}</Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{routineSummary.taken}</Text>
                  <Text style={styles.statLabel}>done</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{routineSummary.remaining}</Text>
                  <Text style={styles.statLabel}>left</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{routineSummary.total}</Text>
                  <Text style={styles.statLabel}>total</Text>
                </View>
              </View>
            </View>

            <RoutineProgressCircle
              percent={routineSummary.percent}
              taken={routineSummary.taken}
              total={routineSummary.total}
              size={104}
              strokeWidth={10}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={handlePrimaryActionPress}>
            <Text style={styles.primaryButtonText}>
              {primaryAction
                ? routineSummary.overdueCount > 0 ? '⚠ Open overdue medication' : '💊 Open next medication'
                : '💊 View medications'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next appointment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next appointment</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          {nextAppointment ? (
            <TouchableOpacity
              style={styles.apptCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AppointmentDetail', {appointmentId: nextAppointment.id})}>
              <View style={styles.apptAccent} />
              <View style={styles.apptBody}>
                <View style={styles.apptTopRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.apptTitle}>{nextAppointment.visitType}</Text>
                    <Text style={styles.apptMeta}>🩺 {nextAppointment.doctorName} · {nextAppointment.specialty}</Text>
                    <Text style={styles.apptMeta}>🗓 {formatAppointmentDateTime(nextAppointment.dateTime)}</Text>
                    {nextAppointment.location
                      ? <Text style={styles.apptMeta}>📍 {nextAppointment.location}</Text>
                      : null}
                  </View>
                  {(() => {
                    const badge = countdownColors(nextAppointment.dateTime);
                    return (
                      <View style={[styles.countdownBadge, {backgroundColor: badge.bg}]}>
                        <Text style={[styles.countdownText, {color: badge.text}]}>
                          {timeUntil(nextAppointment.dateTime)}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
            </View>
          )}
        </View>

        {/* Medications preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Medications')}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          {medicationPreview.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>No medications added yet</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {medicationPreview.map((item, idx) => {
                const isRoutine = item.type === 'routine';
                const accent = isRoutine ? colors.primary : colors.teal;
                const badgeBg = isRoutine ? '#EEF4FF' : colors.tealLight;
                const badgeText = isRoutine ? colors.countdownLaterText : '#0D7A6B';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.previewRow, idx < medicationPreview.length - 1 && styles.previewRowBorder]}
                    onPress={() => navigation.navigate('MedicationDetail', {medicationId: item.id})}
                    activeOpacity={0.8}>
                    <View style={[styles.previewAccent, {backgroundColor: accent}]} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewTitle}>{item.name}</Text>
                      <Text style={styles.previewMeta}>{item.dosage}{item.form ? ` · ${item.form}` : ''}</Text>
                    </View>
                    <View style={[styles.previewBadge, {backgroundColor: badgeBg}]}>
                      <Text style={[styles.previewBadgeText, {color: badgeText}]}>
                        {isRoutine ? 'Daily' : 'As needed'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent symptoms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent symptoms</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Symptoms')}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentSymptoms.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyText}>No symptoms logged yet</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {recentSymptoms.map((item, idx) => {
                const sev = severityColors(item.severity);
                return (
                  <View
                    key={item.id}
                    style={[styles.previewRow, idx < recentSymptoms.length - 1 && styles.previewRowBorder]}>
                    <View style={[styles.previewAccent, {backgroundColor: sev.bar}]} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewTitle}>{item.symptom}</Text>
                      <Text style={styles.previewMeta}>🗓 {formatSymptomDateTime(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.previewBadge, {backgroundColor: sev.bg}]}>
                      <Text style={[styles.previewBadgeText, {color: sev.text}]}>
                        {item.severity}/10
                      </Text>
                      <Text style={[styles.previewBadgeSubtext, {color: sev.text}]}>
                        {getSeverityLabel(item.severity)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('AddSymptom')}>
            <Text style={styles.secondaryButtonText}>🩺 Log a symptom</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroMessage: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  nextDoseBlock: {
    marginBottom: 14,
  },
  nextDoseLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  nextDoseLabelOverdue: {
    color: colors.severityHighText,
  },
  nextDoseName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  nextDoseTime: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 15,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  // Next appointment card
  apptCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  apptAccent: {
    width: 4,
    backgroundColor: colors.severityLowBar,
  },
  apptBody: {
    flex: 1,
    padding: 14,
  },
  apptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  apptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  apptMeta: {
    fontSize: 13,
    color: colors.neutralText,
    marginTop: 2,
  },
  countdownBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Shared list card
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 14,
  },
  previewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  previewAccent: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 12,
    borderRadius: 2,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  previewMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    marginLeft: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewBadgeSubtext: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  // Empty states
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Secondary button
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
    fontSize: 15,
  },
});

export default HomeScreen;

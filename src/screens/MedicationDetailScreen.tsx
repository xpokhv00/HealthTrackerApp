import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {
  formatDateTime,
  getNextAllowedTime,
  getTodayDoseCount,
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';
import {notificationService} from '../services/notificationService';
import {getMedicationSnoozeNotificationId} from '../utils/medicationNotifications';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../theme/colors.ts';
import Screen from '../components/Screen.tsx';
import {syncAllWidgets} from '../services/widgetSync';
import {getRoutineScheduleLabel} from '../utils/routineSchedule';
import {markNextRoutineDoseTaken} from '../services/markNextRoutineDoseTaken';
import {toDateKey} from '../utils/dateHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetail'>;

const formatTimeOnly = (value?: string) => {
  if (!value) {return '—';}
  return new Date(value).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

type StatusVariant = 'success' | 'warning' | 'neutral' | 'muted';

const STATUS_BG: Record<StatusVariant, string> = {
  success: '#ECFDF5',
  warning: '#FEF3F2',
  neutral: '#EEF2FF',
  muted:   '#F2F4F7',
};
const STATUS_TEXT: Record<StatusVariant, string> = {
  success: '#027A48',
  warning: '#B42318',
  neutral: '#3730A3',
  muted:   '#667085',
};

const MedicationDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {medicationId} = route.params;
  const insets = useSafeAreaInsets();

  const medication = useMedicationStore(state =>
    state.medications.find(item => item.id === medicationId),
  );
  const markMedicationTaken = useMedicationStore(state => state.markMedicationTaken);
  const removeMedication = useMedicationStore(state => state.removeMedication);
  const routineSlots = useRoutineDoseStore(state => state.slots);

  if (!medication) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Medication not found</Text>
          <Text style={styles.errorText}>It may have been deleted.</Text>
        </View>
      </Screen>
    );
  }

  const availableNow = isMedicationAvailableNow(medication);
  const dailyLimitReached = hasReachedDailyLimit(medication);
  const takenToday = getTodayDoseCount(medication);
  const nextAllowedTime = getNextAllowedTime(medication);

  const todayKey = toDateKey(new Date());
  const todayRoutineSlots = routineSlots
    .filter(slot => slot.medicationId === medication.id && slot.date === todayKey)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const overdueRoutineSlot = todayRoutineSlots.find(s => s.status === 'missed') ?? null;
  const pendingRoutineSlot = todayRoutineSlots.find(s => s.status === 'pending') ?? null;
  const nextRoutineAction = overdueRoutineSlot ?? pendingRoutineSlot ?? null;

  const routineTakenToday = todayRoutineSlots.filter(
    s => s.status === 'taken_on_time' || s.status === 'taken_late',
  ).length;

  const totalToday = todayRoutineSlots.length;
  const isRoutine = medication.type === 'routine';

  // Status pill logic
  let statusLabel: string;
  let statusVariant: StatusVariant;

  if (isRoutine) {
    if (overdueRoutineSlot) {
      statusLabel = `Overdue · ${overdueRoutineSlot.scheduledTime}`;
      statusVariant = 'warning';
    } else if (pendingRoutineSlot) {
      statusLabel = `Next · ${pendingRoutineSlot.scheduledTime}`;
      statusVariant = 'neutral';
    } else if (totalToday === 0) {
      statusLabel = 'No dose today';
      statusVariant = 'muted';
    } else {
      statusLabel = 'All doses done';
      statusVariant = 'success';
    }
  } else {
    if (dailyLimitReached) {
      statusLabel = 'Daily limit reached';
      statusVariant = 'warning';
    } else if (availableNow) {
      statusLabel = 'Available now';
      statusVariant = 'success';
    } else {
      statusLabel = `Available ${formatTimeOnly(nextAllowedTime?.toISOString())}`;
      statusVariant = 'neutral';
    }
  }

  const routineTakeDisabled = isRoutine && !nextRoutineAction;
  const asNeededTakeDisabled = !isRoutine && (!availableNow || dailyLimitReached);
  const takeDisabled = routineTakeDisabled || asNeededTakeDisabled;

  const takeButtonLabel = isRoutine
    ? nextRoutineAction
      ? `Mark ${nextRoutineAction.scheduledTime} dose taken`
      : 'No routine dose to log'
    : dailyLimitReached
      ? 'Daily limit reached'
      : availableNow
        ? 'Mark as taken'
        : `Available at ${formatTimeOnly(nextAllowedTime?.toISOString())}`;

  const handleTake = async () => {
    if (isRoutine) {
      if (!nextRoutineAction) {return;}
      markNextRoutineDoseTaken(medication.id);
    } else {
      markMedicationTaken(medication.id);
    }
    await syncAllWidgets();
  };

  const handleDelete = async () => {
    await notificationService.cancelMedicationRemindersByMedicationId(medication.id);
    await notificationService.cancelMedicationReminder(
      getMedicationSnoozeNotificationId(medication.id),
    );
    removeMedication(medication.id);
    await syncAllWidgets();
    navigation.goBack();
  };

  const recentHistory = [...medication.takenHistory].reverse().slice(0, 8);

  return (
    <Screen>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* ── Hero card ── */}
          <View style={styles.heroCard}>
            {/* Name + status pill */}
            <View style={styles.heroTop}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.name}>{medication.name}</Text>
                <Text style={styles.dosage}>
                  {medication.dosage}{medication.form ? ` · ${medication.form}` : ''}
                </Text>
                {medication.patientName ? (
                  <View style={styles.patientRow}>
                    <Ionicons name="person-outline" size={12} color={colors.primary} />
                    <Text style={styles.patientName}>{medication.patientName}</Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.statusPill, {backgroundColor: STATUS_BG[statusVariant]}]}>
                <Text style={[styles.statusPillText, {color: STATUS_TEXT[statusVariant]}]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Today progress bar (routine only) */}
            {isRoutine && totalToday > 0 ? (
              <View style={styles.progressSection}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {width: `${Math.round((routineTakenToday / totalToday) * 100)}%`},
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {routineTakenToday}/{totalToday} doses today
                </Text>
              </View>
            ) : null}

            {/* Stat row */}
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {isRoutine ? routineTakenToday : takenToday}
                </Text>
                <Text style={styles.statLabel}>today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {medication.lastTakenAt ? formatTimeOnly(medication.lastTakenAt) : '—'}
                </Text>
                <Text style={styles.statLabel}>last taken</Text>
              </View>
              {isRoutine ? (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {getRoutineScheduleLabel(medication)}
                    </Text>
                    <Text style={styles.statLabel}>frequency</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {medication.maxDailyDoses ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>max/day</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── Schedule ── */}
          {isRoutine && medication.scheduledTimes && medication.scheduledTimes.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SCHEDULE</Text>
              <View style={styles.timeChips}>
                {medication.scheduledTimes.map(time => {
                  const slot = todayRoutineSlots.find(s => s.scheduledTime === time);
                  const taken = slot?.status === 'taken_on_time' || slot?.status === 'taken_late';
                  const overdue = slot?.status === 'missed';
                  return (
                    <View
                      key={time}
                      style={[
                        styles.timeChip,
                        taken && styles.timeChipTaken,
                        overdue && styles.timeChipOverdue,
                      ]}>
                      <Ionicons
                        name={taken ? 'checkmark-circle' : overdue ? 'alert-circle' : 'time-outline'}
                        size={13}
                        color={taken ? '#027A48' : overdue ? '#B42318' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.timeChipText,
                          taken && styles.timeChipTextTaken,
                          overdue && styles.timeChipTextOverdue,
                        ]}>
                        {time}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── Usage / purpose ── */}
          {medication.purpose || medication.usageInstructions ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>USAGE</Text>
              {medication.purpose ? (
                <Text style={styles.usageText}>{medication.purpose}</Text>
              ) : null}
              {medication.usageInstructions ? (
                <View style={styles.instructionPill}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.instructionText}>{medication.usageInstructions}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* ── History ── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HISTORY</Text>
            {recentHistory.length === 0 ? (
              <Text style={styles.emptyText}>No doses recorded yet</Text>
            ) : (
              recentHistory.map((entry, i) => (
                <View key={entry} style={[styles.historyRow, i === 0 && styles.historyRowFirst]}>
                  <View style={[styles.historyDot, i === 0 && styles.historyDotFirst]} />
                  <Text style={[styles.historyText, i === 0 && styles.historyTextFirst]}>
                    {formatDateTime(entry)}
                  </Text>
                </View>
              ))
            )}
            {medication.takenHistory.length > 8 ? (
              <Text style={styles.historyMore}>
                +{medication.takenHistory.length - 8} earlier doses
              </Text>
            ) : null}
          </View>

        </ScrollView>

        {/* ── Footer ── */}
        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
          <TouchableOpacity
            style={[styles.takeButton, takeDisabled && styles.takeButtonDisabled]}
            onPress={handleTake}
            disabled={takeDisabled}>
            <Text style={styles.takeButtonText}>{takeButtonLabel}</Text>
          </TouchableOpacity>

          <View style={styles.footerBar}>
            <TouchableOpacity
              style={styles.footerAction}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddMedication', {medicationId: medication.id})}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.footerActionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerAction}
              activeOpacity={0.7}
              onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.primary} />
              <Text style={styles.footerActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  scroll: {flex: 1},
  content: {padding: 16, paddingBottom: 24},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24},
  errorTitle: {fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8},
  errorText: {fontSize: 14, color: colors.textSecondary, textAlign: 'center'},

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroTextBlock: {flex: 1, paddingRight: 10},
  name: {fontSize: 24, fontWeight: '800', color: colors.text},
  dosage: {marginTop: 4, fontSize: 15, color: colors.textSecondary},
  patientRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6},
  patientName: {fontSize: 13, fontWeight: '700', color: colors.primary},
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {fontSize: 12, fontWeight: '700'},

  // Progress bar
  progressSection: {marginBottom: 14},
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  progressLabel: {fontSize: 12, color: colors.textSecondary, fontWeight: '500'},

  // Stat row
  statRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 10,
  },
  statItem: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: 15, fontWeight: '800', color: colors.text},
  statLabel: {marginTop: 2, fontSize: 11, color: colors.textSecondary},
  statDivider: {width: 1, backgroundColor: colors.border, marginVertical: 4},

  // Generic card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  // Schedule time chips
  timeChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipTaken: {backgroundColor: '#ECFDF5', borderColor: '#A6F4C5'},
  timeChipOverdue: {backgroundColor: '#FEF3F2', borderColor: '#FDA29B'},
  timeChipText: {fontSize: 13, fontWeight: '700', color: colors.textSecondary},
  timeChipTextTaken: {color: '#027A48'},
  timeChipTextOverdue: {color: '#B42318'},

  // Usage
  usageText: {fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 8},
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  instructionText: {fontSize: 13, fontWeight: '600', color: colors.primary},

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyRowFirst: {borderTopWidth: 0},
  historyDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.border,
  },
  historyDotFirst: {backgroundColor: colors.primary},
  historyText: {fontSize: 13, color: colors.textSecondary},
  historyTextFirst: {color: colors.text, fontWeight: '600'},
  historyMore: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyText: {fontSize: 14, color: colors.textSecondary},

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  takeButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 4,
  },
  takeButtonDisabled: {backgroundColor: '#B8C4D6'},
  takeButtonText: {color: '#FFFFFF', fontSize: 15, fontWeight: '800'},
  footerBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  footerAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerActionText: {fontSize: 15, fontWeight: '700', color: colors.primary},
  footerDivider: {width: 1, backgroundColor: colors.border, marginVertical: 2},
});

export default MedicationDetailScreen;

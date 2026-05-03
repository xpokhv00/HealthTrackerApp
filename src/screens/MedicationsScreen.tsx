import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import MedicationCard, {CardVariant} from '../components/MedicationCard';
import {Medication} from '../types/medication';
import Screen from '../components/Screen';
import {markNextRoutineDoseTaken} from '../services/markNextRoutineDoseTaken';
import {colors} from '../theme/colors';
import {toDateKey} from '../utils/dateHelpers';
import {hasReachedDailyLimit, isMedicationAvailableNow} from '../utils/medication';
import {syncAllWidgets} from '../services/widgetSync';

type Props = NativeStackScreenProps<RootStackParamList, 'Medications'>;

interface ClassifiedMed {
  med: Medication;
  variant: CardVariant;
  nextSlotTime?: string;
  takenToday: number;
  totalToday: number;
}

const MedicationsScreen: React.FC<Props> = ({navigation}) => {
  const medications = useMedicationStore(state => state.medications);
  const markMedicationTaken = useMedicationStore(state => state.markMedicationTaken);
  const slots = useRoutineDoseStore(state => state.slots);

  const [personFilter, setPersonFilter] = useState<string>('all');

  const todayKey = toDateKey(new Date());

  const peopleOptions = useMemo(() => {
    const hasMe = medications.some(m => !m.patientName);
    const names = medications.map(m => m.patientName).filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    if (unique.length === 0) {return [];}
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [medications]);

  const personFiltered = useMemo(() => {
    if (personFilter === 'all') {return medications;}
    if (personFilter === 'me') {return medications.filter(m => !m.patientName);}
    return medications.filter(m => m.patientName === personFilter);
  }, [medications, personFilter]);

  // Classify every medication into urgent / upcoming / resting
  const {urgent, upcoming, resting} = useMemo(() => {
    const u: ClassifiedMed[] = [];
    const up: ClassifiedMed[] = [];
    const r: ClassifiedMed[] = [];

    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    for (const med of personFiltered) {
      const todaySlots = slots.filter(
        s => s.medicationId === med.id && s.date === todayKey,
      ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      const takenToday = todaySlots.filter(s => s.status === 'taken_on_time' || s.status === 'taken_late').length;
      const totalToday = todaySlots.length;

      if (med.type === 'routine') {
        const overdueSlot = todaySlots.find(s => s.status === 'missed');
        const pendingSlot = todaySlots.find(s => s.status === 'pending');
        const allDone =
          totalToday > 0 &&
          todaySlots.every(
            s => s.status === 'taken_on_time' || s.status === 'taken_late' || s.status === 'missed',
          ) &&
          todaySlots.some(s => s.status === 'taken_on_time' || s.status === 'taken_late');

        if (overdueSlot) {
          u.push({med, variant: 'urgent', nextSlotTime: overdueSlot.scheduledTime, takenToday, totalToday});
        } else if (pendingSlot && pendingSlot.scheduledTime <= nowHHMM) {
          // Due now or slightly past
          u.push({med, variant: 'urgent', nextSlotTime: pendingSlot.scheduledTime, takenToday, totalToday});
        } else if (allDone) {
          r.push({med, variant: 'resting', takenToday, totalToday});
        } else if (pendingSlot) {
          up.push({med, variant: 'upcoming', nextSlotTime: pendingSlot.scheduledTime, takenToday, totalToday});
        } else {
          // No slots today — show in upcoming
          up.push({med, variant: 'upcoming', takenToday, totalToday});
        }
      } else {
        // as-needed
        const available = isMedicationAvailableNow(med);
        const limitReached = hasReachedDailyLimit(med);
        if (available && !limitReached) {
          u.push({med, variant: 'urgent', takenToday, totalToday});
        } else {
          r.push({med, variant: 'resting', takenToday, totalToday});
        }
      }
    }

    return {urgent: u, upcoming: up, resting: r};
  }, [personFiltered, slots, todayKey]);

  // Today's routine summary
  const {routineTotal, routineTaken} = useMemo(() => {
    const routineMeds = personFiltered.filter(m => m.type === 'routine');
    let total = 0;
    let taken = 0;
    for (const med of routineMeds) {
      const todaySlots = slots.filter(s => s.medicationId === med.id && s.date === todayKey);
      total += todaySlots.length;
      taken += todaySlots.filter(s => s.status === 'taken_on_time' || s.status === 'taken_late').length;
    }
    return {routineTotal: total, routineTaken: taken};
  }, [personFiltered, slots, todayKey]);

  const handleTakePress = async (item: Medication) => {
    if (item.type === 'routine') {
      markNextRoutineDoseTaken(item.id);
    } else {
      markMedicationTaken(item.id);
    }
    await syncAllWidgets();
  };

  const isEmpty = medications.length === 0;
  const allDoneToday = routineTotal > 0 && routineTaken === routineTotal;
  const progressPct = routineTotal > 0 ? routineTaken / routineTotal : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Medications</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedication')}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Person filter — only when multiple people */}
        {peopleOptions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}>
            {peopleOptions.map(option => {
              const active = personFilter === option;
              const label = option === 'all' ? 'Everyone' : option === 'me' ? 'Me' : option;
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
          </ScrollView>
        )}

        {/* Today's routine progress banner */}
        {routineTotal > 0 ? (
          <View style={[styles.progressBanner, allDoneToday && styles.progressBannerDone]}>
            <View style={styles.progressBannerLeft}>
              <Ionicons
                name={allDoneToday ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={allDoneToday ? colors.severityLowText : colors.primary}
              />
              <Text style={[styles.progressBannerText, allDoneToday && styles.progressBannerTextDone]}>
                {allDoneToday
                  ? 'All routine doses done today'
                  : `${routineTaken} of ${routineTotal} routine doses done`}
              </Text>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {width: `${Math.round(progressPct * 100)}%`},
                    allDoneToday && styles.progressBarFillDone,
                  ]}
                />
              </View>
            </View>
          </View>
        ) : null}

        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>
              Add your first routine or as-needed medication.
            </Text>
          </View>
        ) : (
          <>
            {/* Urgent — needs action now */}
            {urgent.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionLabel}>ACTION NEEDED</Text>
                </View>
                {urgent.map(item => (
                  <MedicationCard
                    key={item.med.id}
                    medication={item.med}
                    variant={item.variant}
                    nextSlotTime={item.nextSlotTime}
                    takenToday={item.takenToday}
                    totalToday={item.totalToday}
                    onPress={() => navigation.navigate('MedicationDetail', {medicationId: item.med.id})}
                    onTakePress={() => handleTakePress(item.med)}
                  />
                ))}
              </View>
            )}

            {/* Upcoming — scheduled later today */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabelMuted}>UPCOMING</Text>
                {upcoming.map(item => (
                  <MedicationCard
                    key={item.med.id}
                    medication={item.med}
                    variant={item.variant}
                    nextSlotTime={item.nextSlotTime}
                    takenToday={item.takenToday}
                    totalToday={item.totalToday}
                    onPress={() => navigation.navigate('MedicationDetail', {medicationId: item.med.id})}
                    onTakePress={() => handleTakePress(item.med)}
                  />
                ))}
              </View>
            )}

            {/* Resting — done or not available */}
            {resting.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabelMuted}>DONE / NOT NEEDED</Text>
                {resting.map(item => (
                  <MedicationCard
                    key={item.med.id}
                    medication={item.med}
                    variant={item.variant}
                    nextSlotTime={item.nextSlotTime}
                    takenToday={item.takenToday}
                    totalToday={item.totalToday}
                    onPress={() => navigation.navigate('MedicationDetail', {medicationId: item.med.id})}
                    onTakePress={() => handleTakePress(item.med)}
                  />
                ))}
              </View>
            )}
          </>
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
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  chipRow: {
    gap: 8,
    marginBottom: 12,
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
    color: '#FFFFFF',
  },
  progressBanner: {
    backgroundColor: '#EEF4FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D7FE',
  },
  progressBannerDone: {
    backgroundColor: colors.severityLowBg,
    borderColor: '#A6F4C5',
  },
  progressBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBannerTextDone: {
    color: colors.severityLowText,
  },
  progressBarWrap: {},
  progressBarTrack: {
    height: 5,
    backgroundColor: '#C7D7FE',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  progressBarFillDone: {
    backgroundColor: colors.severityLowBar,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.primary,
  },  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  sectionLabelMuted: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default MedicationsScreen;

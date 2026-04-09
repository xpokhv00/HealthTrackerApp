import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import MedicationCard from '../components/MedicationCard';
import {Medication} from '../types/medication';
import Screen from '../components/Screen';
import {markNextRoutineDoseTaken} from '../services/markNextRoutineDoseTaken';
import {colors} from '../theme/colors';
import {toDateKey} from '../utils/dateHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'Medications'>;

function sortByRecent(meds: Medication[]): Medication[] {
  return [...meds].sort((a, b) => {
    const aTime = a.lastTakenAt ? new Date(a.lastTakenAt).getTime() : 0;
    const bTime = b.lastTakenAt ? new Date(b.lastTakenAt).getTime() : 0;
    return bTime - aTime;
  });
}

interface SectionProps {
  title: string;
  data: Medication[];
  doneIds: Set<string>;
  onPressItem: (id: string) => void;
  onTakePress: (item: Medication) => void;
}

const Section: React.FC<SectionProps> = ({
  title,
  data,
  doneIds,
  onPressItem,
  onTakePress,
}) => {
  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map(item => (
        <MedicationCard
          key={item.id}
          medication={item}
          allDoneToday={doneIds.has(item.id)}
          onPress={() => onPressItem(item.id)}
          onTakePress={() => onTakePress(item)}
        />
      ))}
    </View>
  );
};

const MedicationsScreen: React.FC<Props> = ({navigation}) => {
  const medications = useMedicationStore(state => state.medications);
  const markMedicationTaken = useMedicationStore(
    state => state.markMedicationTaken,
  );
  const slots = useRoutineDoseStore(state => state.slots);

  const [personFilter, setPersonFilter] = useState<string>('all');

  // Which routine medication ids have all today's slots done (taken or missed)
  const todayKey = toDateKey(new Date());
  const routineDoneIds = useMemo(() => {
    const todaySlots = slots.filter(s => s.date === todayKey);
    const done = new Set<string>();
    const allRoutineIds = new Set(
      medications.filter(m => m.type === 'routine').map(m => m.id),
    );
    allRoutineIds.forEach(medId => {
      const medSlots = todaySlots.filter(s => s.medicationId === medId);
      if (
        medSlots.length > 0 &&
        medSlots.some(s => s.status === 'taken_on_time' || s.status === 'taken_late') &&
        medSlots.every(s => s.status === 'taken_on_time' || s.status === 'taken_late' || s.status === 'missed')
      ) {
        done.add(medId);
      }
    });
    return done;
  }, [slots, todayKey, medications]);

  const peopleOptions = useMemo(() => {
    const hasMe = medications.some(m => !m.patientName);
    const names = medications
      .map(m => m.patientName)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [medications]);

  const personFiltered = useMemo(() => {
    if (personFilter === 'all') {return medications;}
    if (personFilter === 'me') {return medications.filter(m => !m.patientName);}
    return medications.filter(m => m.patientName === personFilter);
  }, [medications, personFilter]);

  // Routine: active (not all done today) first, done ones at the end
  const {routineActive, routineDone} = useMemo(() => {
    const routine = personFiltered.filter(m => m.type === 'routine');
    const active = sortByRecent(routine.filter(m => !routineDoneIds.has(m.id)));
    const done = sortByRecent(routine.filter(m => routineDoneIds.has(m.id)));
    return {routineActive: active, routineDone: done};
  }, [personFiltered, routineDoneIds]);

  const asNeededMedications = useMemo(
    () => sortByRecent(personFiltered.filter(m => m.type === 'as_needed')),
    [personFiltered],
  );

  const isEmpty = medications.length === 0;

  const handleTakePress = (item: Medication) => {
    if (item.type === 'routine') {
      markNextRoutineDoseTaken(item.id);
      return;
    }
    markMedicationTaken(item.id);
  };

  const allRoutine = [...routineActive, ...routineDone];

  return (
    <Screen>
      <FlatList
        data={[{key: 'content'}]}
        keyExtractor={item => item.key}
        contentContainerStyle={isEmpty ? styles.emptyListContent : undefined}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Medications</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddMedication')}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {!isEmpty && peopleOptions.length > 1 && (
              <View style={styles.filtersSection}>
                <Text style={styles.filtersLabel}>Person</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalFilterRow}>
                  {peopleOptions.map(option => {
                    const active = personFilter === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() => setPersonFilter(option)}>
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}>
                          {option === 'all' ? 'All' : option === 'me' ? 'Me' : option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        }
        renderItem={() =>
          isEmpty ? null : (
            <View style={styles.listContent}>
              <Section
                title="Routine"
                data={allRoutine}
                doneIds={routineDoneIds}
                onPressItem={id =>
                  navigation.navigate('MedicationDetail', {medicationId: id})
                }
                onTakePress={handleTakePress}
              />
              <Section
                title="As needed"
                data={asNeededMedications}
                doneIds={new Set()}
                onPressItem={id =>
                  navigation.navigate('MedicationDetail', {medicationId: id})
                }
                onTakePress={handleTakePress}
              />
            </View>
          )
        }
        ListEmptyComponent={null}
      />

      {isEmpty && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptyText}>
            Add your first routine or as-needed medication.
          </Text>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#4C7EFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  filtersLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
    marginBottom: 8,
  },
  horizontalFilterRow: {
    paddingRight: 20,
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
  listContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1F36',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: '#667085',
  },
});

export default MedicationsScreen;

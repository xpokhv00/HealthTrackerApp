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
import MedicationCard from '../components/MedicationCard';
import {Medication} from '../types/medication';
import Screen from '../components/Screen';
import {markNextRoutineDoseTaken} from '../services/markNextRoutineDoseTaken';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Medications'>;
type SortOption = 'az' | 'za' | 'recent';

const sortOptions: {label: string; value: SortOption}[] = [
  {label: 'A–Z', value: 'az'},
  {label: 'Z–A', value: 'za'},
  {label: 'Recently taken', value: 'recent'},
];

function sortMedications(meds: Medication[], sort: SortOption): Medication[] {
  const arr = [...meds];
  switch (sort) {
    case 'za':
      return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'recent':
      return arr.sort((a, b) => {
        const aTime = a.lastTakenAt ? new Date(a.lastTakenAt).getTime() : 0;
        const bTime = b.lastTakenAt ? new Date(b.lastTakenAt).getTime() : 0;
        return bTime - aTime;
      });
    case 'az':
    default:
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

const Section = ({
  title,
  data,
  onPressItem,
  onTakePress,
}: {
  title: string;
  data: Medication[];
  onPressItem: (id: string) => void;
  onTakePress: (item: Medication) => void;
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

  const [personFilter, setPersonFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('az');

  const peopleOptions = useMemo(() => {
    const names = medications
      .map(m => m.patientName)
      .filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(names))];
  }, [medications]);

  const personFiltered = useMemo(
    () =>
      personFilter === 'all'
        ? medications
        : medications.filter(m => m.patientName === personFilter),
    [medications, personFilter],
  );

  const routineMedications = useMemo(
    () => sortMedications(personFiltered.filter(m => m.type === 'routine'), sortOption),
    [personFiltered, sortOption],
  );

  const asNeededMedications = useMemo(
    () =>
      sortMedications(
        personFiltered.filter(m => m.type === 'as_needed'),
        sortOption,
      ),
    [personFiltered, sortOption],
  );

  const isEmpty = medications.length === 0;

  const handleTakePress = (item: Medication) => {
    if (item.type === 'routine') {
      markNextRoutineDoseTaken(item.id);
      return;
    }
    markMedicationTaken(item.id);
  };

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

            {!isEmpty && (
              <View style={styles.filtersSection}>
                {peopleOptions.length > 1 && (
                  <>
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
                              {option === 'all' ? 'All' : option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                <Text style={[styles.filtersLabel, peopleOptions.length > 1 && styles.labelSpacingTop]}>
                  Sort
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalFilterRow}>
                  {sortOptions.map(opt => {
                    const active = sortOption === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() => setSortOption(opt.value)}>
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}>
                          {opt.label}
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
                data={routineMedications}
                onPressItem={id =>
                  navigation.navigate('MedicationDetail', {medicationId: id})
                }
                onTakePress={handleTakePress}
              />
              <Section
                title="As needed"
                data={asNeededMedications}
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
  labelSpacingTop: {
    marginTop: 10,
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

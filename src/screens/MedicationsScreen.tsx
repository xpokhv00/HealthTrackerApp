import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useMedicationStore} from '../store/medicationStore';
import MedicationCard from '../components/MedicationCard';
import {Medication} from '../types/medication';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'Medications'>;

const Section = ({
                   title,
                   data,
                   onPressItem,
                   onTakePress,
                 }: {
  title: string;
  data: Medication[];
  onPressItem: (id: string) => void;
  onTakePress: (id: string) => void;
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
          onTakePress={() => onTakePress(item.id)}
        />
      ))}
    </View>
  );
};

const MedicationsScreen: React.FC<Props> = ({navigation}) => {
  const medications = useMedicationStore(state => state.medications);
  const markMedicationTaken = useMedicationStore(state => state.markMedicationTaken);

  const routineMedications = medications.filter(item => item.type === 'routine');
  const asNeededMedications = medications.filter(item => item.type === 'as_needed');

  const isEmpty = medications.length === 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMedication')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptyText}>
            Add your first routine or as-needed medication.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[{key: 'content'}]}
          keyExtractor={item => item.key}
          renderItem={() => (
            <View style={styles.listContent}>
              <Section
                title="Routine"
                data={routineMedications}
                onPressItem={id =>
                  navigation.navigate('MedicationDetail', {medicationId: id})
                }
                onTakePress={id => markMedicationTaken(id)}
              />

              <Section
                title="As needed"
                data={asNeededMedications}
                onPressItem={id =>
                  navigation.navigate('MedicationDetail', {medicationId: id})
                }
                onTakePress={id => markMedicationTaken(id)}
              />
            </View>
          )}
        />
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import {useSymptomStore} from '../store/symptomStore';
import SymptomCard from '../components/SymptomCard';
import {colors} from '../theme/colors';

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const symptoms = useSymptomStore(state => state.symptoms);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Symptoms</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddSymptom')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {symptoms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No symptoms logged yet</Text>
          <Text style={styles.emptyText}>
            Start tracking your condition with quick symptom entries.
          </Text>
        </View>
      ) : (
        <FlatList
          data={symptoms}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <SymptomCard
              symptom={item}
              onPress={() =>
                navigation.navigate('SymptomDetail', {
                  symptomId: item.id,
                })
              }
            />
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
  listContent: {
    padding: 20,
    paddingTop: 12,
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
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: colors.textSecondary,
  },
});

export default SymptomsScreen;

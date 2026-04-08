import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {useSymptomStore} from '../store/symptomStore';
import {formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';

const SymptomDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {symptomId} = route.params;

  const symptom = useSymptomStore(state =>
    state.symptoms.find(item => item.id === symptomId),
  );
  const removeSymptom = useSymptomStore(state => state.removeSymptom);

  if (!symptom) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Symptom not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.name}>{symptom.symptom}</Text>
          <Text style={styles.meta}>
            Severity {symptom.severity}/10 • {getSeverityLabel(symptom.severity)}
          </Text>
          <Text style={styles.date}>{formatSymptomDateTime(symptom.createdAt)}</Text>

          {symptom.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{symptom.category}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.value}>Symptom: {symptom.symptom}</Text>
          <Text style={styles.value}>Severity: {symptom.severity}/10</Text>
          <Text style={styles.value}>
            Severity label: {getSeverityLabel(symptom.severity)}
          </Text>
          <Text style={styles.value}>
            Logged at: {formatSymptomDateTime(symptom.createdAt)}
          </Text>
          <Text style={styles.value}>
            Category: {symptom.category ?? 'Not set'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Triggers</Text>
          {symptom.triggers?.length ? (
            <View style={styles.triggerRow}>
              {symptom.triggers.map(item => (
                <View key={item} style={styles.triggerChip}>
                  <Text style={styles.triggerChipText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.value}>No triggers selected.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.value}>
            {symptom.note ? symptom.note : 'No notes added.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('AddSymptom', {
                symptomId: symptom.id,
              })
            }>
            <Text style={styles.editButtonText}>Edit symptom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              removeSymptom(symptom.id);
              navigation.goBack();
            }}>
            <Text style={styles.deleteButtonText}>Delete symptom</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textSecondary,
  },
  date: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  triggerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  triggerChip: {
    backgroundColor: '#F2F4F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  triggerChipText: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '700',
  },
  footer: {
    marginTop: 8,
  },
  editButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SymptomDetailScreen;

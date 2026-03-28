import React, {useMemo, useState} from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {useSymptomStore} from '../store/symptomStore';
import {SymptomEntry} from '../types/symptom';

const symptomSuggestions = [
  'Headache',
  'Cough',
  'Fever',
  'Fatigue',
  'Sore throat',
  'Nasal congestion',
  'Eye irritation',
  'Stomach pain',
];

const severityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const AddSymptomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const symptomId = route.params?.symptomId as string | undefined;

  const symptoms = useSymptomStore(state => state.symptoms);
  const addSymptom = useSymptomStore(state => state.addSymptom);
  const updateSymptom = useSymptomStore(state => state.updateSymptom);

  const existingSymptom = useMemo(
    () => symptoms.find(item => item.id === symptomId),
    [symptoms, symptomId],
  );

  const isEditMode = !!existingSymptom;

  const [symptom, setSymptom] = useState(existingSymptom?.symptom ?? '');
  const [severity, setSeverity] = useState(existingSymptom?.severity ?? 5);
  const [note, setNote] = useState(existingSymptom?.note ?? '');

  const handleSave = () => {
    if (!symptom.trim()) {
      Alert.alert('Missing information', 'Please enter a symptom name.');
      return;
    }

    const entry: SymptomEntry = {
      id: existingSymptom?.id ?? Date.now().toString(),
      symptom: symptom.trim(),
      severity,
      note: note.trim() || undefined,
      createdAt: existingSymptom?.createdAt ?? new Date().toISOString(),
    };

    if (isEditMode) {
      updateSymptom(entry);
    } else {
      addSymptom(entry);
    }

    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Symptom' : 'Log Symptom'}
        </Text>

        <Text style={styles.label}>Quick suggestions</Text>
        <Text style={styles.helperText}>
          Pick one or type a custom symptom below.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {symptomSuggestions.map(item => {
            const active = symptom === item;

            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSymptom(item)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Symptom name</Text>
        <TextInput
          value={symptom}
          onChangeText={setSymptom}
          placeholder="e.g. Headache"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Severity</Text>
        <Text style={styles.helperText}>Choose a value from 1 to 10.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.severityRow}>
          {severityOptions.map(value => {
            const active = severity === value;

            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.severityButton,
                  active && styles.severityButtonActive,
                ]}
                onPress={() => setSeverity(value)}>
                <Text
                  style={[
                    styles.severityButtonText,
                    active && styles.severityButtonTextActive,
                  ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.severityText}>Selected severity: {severity}/10</Text>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note about duration, triggers, how you feel..."
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[styles.input, styles.multilineInput]}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Save changes' : 'Save symptom'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  severityRow: {
    gap: 10,
    paddingVertical: 4,
  },
  severityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityButtonText: {
    color: colors.text,
    fontWeight: '800',
  },
  severityButtonTextActive: {
    color: '#FFFFFF',
  },
  severityText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default AddSymptomScreen;

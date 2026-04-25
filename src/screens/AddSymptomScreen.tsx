import React, {useMemo, useState} from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {useSymptomStore} from '../store/symptomStore';
import {SymptomEntry} from '../types/symptom';
import {getCategoryForSymptom} from '../utils/symptom';

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

const triggerOptions = [
  'Stress',
  'Sleep',
  'Food',
  'Exercise',
  'Weather',
  'Work',
  'Screen time',
  'Medication',
];

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
  const [patientName, setPatientName] = useState(existingSymptom?.patientName ?? '');
  const [severity, setSeverity] = useState(existingSymptom?.severity ?? 5);
  const [note, setNote] = useState(existingSymptom?.note ?? '');
  const [triggers, setTriggers] = useState<string[]>(
    existingSymptom?.triggers ?? [],
  );

  const handleSetSymptom = (value: string) => {
    setSymptom(value);
  };

  const toggleTrigger = (value: string) => {
    setTriggers(current =>
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    );
  };

  const handleSave = () => {
    if (!symptom.trim()) {
      Alert.alert('Missing information', 'Please enter a symptom name.');
      return;
    }

    const entry: SymptomEntry = {
      id: existingSymptom?.id ?? Date.now().toString(),
      patientName: patientName.trim() || undefined,
      symptom: symptom.trim(),
      severity,
      note: note.trim() || undefined,
      category: getCategoryForSymptom(symptom),
      triggers: triggers.length > 0 ? triggers : undefined,
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
      <View style={styles.screenInner}>
        <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick suggestions</Text>
          <Text style={styles.helperText}>
            Pick one or type a custom symptom below.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {symptomSuggestions.map(item => {
              const active = symptom === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleSetSymptom(item)}>
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
            onChangeText={handleSetSymptom}
            placeholder="e.g. Headache"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>For (optional)</Text>
          <TextInput
            value={patientName}
            onChangeText={setPatientName}
            placeholder="e.g. Emma, my son..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity</Text>

          <Text style={styles.label}>Severity</Text>
          <Text style={styles.helperText}>Choose a value from 1 to 10.</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possible triggers</Text>
          <Text style={styles.helperText}>
            Select anything that may be related.
          </Text>

          <View style={styles.wrapRow}>
            {triggerOptions.map(item => {
              const active = triggers.includes(item);

              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive, styles.wrapChip]}
                  onPress={() => toggleTrigger(item)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note about duration, triggers, how you feel..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[styles.input, styles.multilineInput]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Save changes' : 'Save symptom'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 16,
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
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
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
    lineHeight: 18,
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
  horizontalRow: {
    gap: 10,
    paddingVertical: 4,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wrapChip: {
    marginRight: 10,
    marginBottom: 10,
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
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  screenInner: {
    flex: 1,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default AddSymptomScreen;

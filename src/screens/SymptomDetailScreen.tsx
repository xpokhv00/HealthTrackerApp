import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';
import {useSymptomStore} from '../store/symptomStore';
import {formatSymptomDateTime, getSeverityLabel} from '../utils/symptom';

function severityColors(severity: number) {
  if (severity <= 3) {return {bg: '#ECFDF5', text: '#027A48', bar: '#12B76A'};}
  if (severity <= 6) {return {bg: '#FFFAEB', text: '#B54708', bar: '#F79009'};}
  return {bg: '#FEF3F2', text: '#B42318', bar: '#F04438'};
}

const CATEGORY_COLORS: Record<string, string> = {
  Pain: '#FEE4E2', Respiratory: '#E0F2FE', Digestive: '#FEF9C3',
  Mood: '#F3E8FF', Energy: '#FFF7ED', Skin: '#FCE7F3', Other: '#F2F4F7',
};
const CATEGORY_TEXT: Record<string, string> = {
  Pain: '#912018', Respiratory: '#0369A1', Digestive: '#854D0E',
  Mood: '#6B21A8', Energy: '#9A3412', Skin: '#9D174D', Other: '#344054',
};

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

  const sev = severityColors(symptom.severity);

  const handleDelete = () => {
    Alert.alert('Delete symptom', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeSymptom(symptom.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Hero — name + severity side by side */}
        <View style={styles.card}>
          <View style={[styles.severityStripe, {backgroundColor: sev.bar}]} />
          <View style={styles.cardBody}>
            <View style={styles.heroRow}>
              <Text style={styles.symptomName}>{symptom.symptom}</Text>
              <View style={[styles.severityBadge, {backgroundColor: sev.bg}]}>
                <Text style={[styles.severityNumber, {color: sev.text}]}>
                  {symptom.severity}
                </Text>
                <Text style={[styles.severityScale, {color: sev.text}]}>/10</Text>
                <Text style={[styles.severityLabel, {color: sev.text}]}>
                  {getSeverityLabel(symptom.severity)}
                </Text>
              </View>
            </View>

            <Text style={styles.dateText}>
              {formatSymptomDateTime(symptom.createdAt)}
            </Text>

            {/* Category + patient inline */}
            <View style={styles.pillRow}>
              {symptom.category ? (
                <View style={[styles.pill, {
                  backgroundColor: CATEGORY_COLORS[symptom.category] ?? '#F2F4F7',
                }]}>
                  <Text style={[styles.pillText, {
                    color: CATEGORY_TEXT[symptom.category] ?? '#344054',
                  }]}>
                    {symptom.category}
                  </Text>
                </View>
              ) : null}
              {symptom.patientName ? (
                <View style={styles.pill}>
                  <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
                  <Text style={styles.pillText}>{symptom.patientName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Triggers */}
        {symptom.triggers && symptom.triggers.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.sectionLabel}>TRIGGERS</Text>
              <View style={styles.pillRow}>
                {symptom.triggers.map(item => (
                  <View key={item} style={styles.triggerPill}>
                    <Ionicons name="flash-outline" size={12} color="#B54708" />
                    <Text style={styles.triggerPillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {/* Note */}
        {symptom.note ? (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.sectionLabel}>NOTE</Text>
              <Text style={styles.noteText}>{symptom.note}</Text>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Bottom bar — Edit | Delete */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerAction}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AddSymptom', {symptomId: symptom.id})}>
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 100,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  severityStripe: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  symptomName: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  severityBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  severityNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  severityScale: {
    fontSize: 11,
    fontWeight: '700',
  },
  severityLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F4F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  triggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFAEB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B54708',
  },
  noteText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  footerAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
});

export default SymptomDetailScreen;

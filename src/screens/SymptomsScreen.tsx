import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import SymptomCard from '../components/SymptomCard';
import SymptomTrendChart from '../components/SymptomTrendChart';
import {useSymptomStore} from '../store/symptomStore';
import {colors} from '../theme/colors';
import {
  filterSymptomsByDays,
  getAverageSeverity,
} from '../utils/symptom';
import {
  buildSymptomTrendPoints,
  getTrendDirection,
} from '../utils/symptomTrends';

type WindowFilter = 7 | 30 | 'all';

const TREND_LABELS: Record<string, string> = {
  improving: '↓ Improving',
  worsening: '↑ Worsening',
  stable: '→ Stable',
  no_data: '—',
};

const TREND_COLORS: Record<string, string> = {
  improving: '#027A48',
  worsening: '#B42318',
  stable: '#667085',
  no_data: '#667085',
};

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const symptoms = useSymptomStore(state => state.symptoms);

  const [windowFilter, setWindowFilter] = useState<WindowFilter>(7);
  const [personFilter, setPersonFilter] = useState<string>('all');

  const timeFilteredSymptoms = useMemo(
    () => filterSymptomsByDays(symptoms, windowFilter),
    [symptoms, windowFilter],
  );

  const peopleOptions = useMemo(() => {
    const hasMe = timeFilteredSymptoms.some(s => !s.patientName);
    const names = timeFilteredSymptoms
      .map(s => s.patientName)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    if (unique.length === 0 && !hasMe) {return [];}
    if (unique.length === 0) {return [];}
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [timeFilteredSymptoms]);

  const visibleSymptoms = useMemo(() => {
    if (personFilter === 'all') {return timeFilteredSymptoms;}
    if (personFilter === 'me') {return timeFilteredSymptoms.filter(s => !s.patientName);}
    return timeFilteredSymptoms.filter(s => s.patientName === personFilter);
  }, [timeFilteredSymptoms, personFilter]);

  const trendWindowDays = windowFilter === 'all' ? 30 : windowFilter;

  const trendPoints = useMemo(
    () => buildSymptomTrendPoints(visibleSymptoms, trendWindowDays),
    [visibleSymptoms, trendWindowDays],
  );

  const trendDirection = useMemo(
    () => getTrendDirection(trendPoints),
    [trendPoints],
  );

  const avgSeverity = useMemo(
    () => getAverageSeverity(visibleSymptoms),
    [visibleSymptoms],
  );

  const trendColor = TREND_COLORS[trendDirection];

  return (
    <Screen>
      <FlatList
        data={visibleSymptoms}
        keyExtractor={item => item.id}
        contentContainerStyle={
          visibleSymptoms.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Symptoms</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddSymptom')}>
                <Text style={styles.addButtonText}>+ Log</Text>
              </TouchableOpacity>
            </View>

            {/* Time window chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              {([7, 30, 'all'] as WindowFilter[]).map(val => {
                const label =
                  val === 'all' ? 'All time' : val === 7 ? '7 days' : '30 days';
                const active = windowFilter === val;
                return (
                  <TouchableOpacity
                    key={String(val)}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setWindowFilter(val)}>
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Person chips — only when multiple people */}
              {peopleOptions.length > 0 && (
                <>
                  <View style={styles.chipDivider} />
                  {peopleOptions.map(option => {
                    const active = personFilter === option;
                    const label =
                      option === 'all'
                        ? 'Everyone'
                        : option === 'me'
                        ? 'Me'
                        : option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setPersonFilter(option)}>
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>

            {/* Insight bar */}
            {visibleSymptoms.length > 0 ? (
              <View style={styles.insightBar}>
                <View style={styles.insightItem}>
                  <Text style={styles.insightValue}>{visibleSymptoms.length}</Text>
                  <Text style={styles.insightLabel}>entries</Text>
                </View>
                <View style={styles.insightSep} />
                <View style={styles.insightItem}>
                  <Text style={styles.insightValue}>{avgSeverity}/10</Text>
                  <Text style={styles.insightLabel}>avg severity</Text>
                </View>
                <View style={styles.insightSep} />
                <View style={styles.insightItem}>
                  <Text style={[styles.insightValue, {color: trendColor}]}>
                    {TREND_LABELS[trendDirection]}
                  </Text>
                  <Text style={styles.insightLabel}>trend</Text>
                </View>
              </View>
            ) : null}

            {/* Bar chart — inline, no card wrapper */}
            {visibleSymptoms.length > 0 ? (
              <SymptomTrendChart
                points={trendPoints}
                trendDirection={trendDirection}
              />
            ) : null}
          </View>
        }
        renderItem={({item}) => (
          <SymptomCard
            symptom={item}
            onPress={() =>
              navigation.navigate('SymptomDetail', {symptomId: item.id})
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No symptoms logged</Text>
            <Text style={styles.emptyText}>
              Tap "+ Log" to record your first entry.
            </Text>
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
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
  chipDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  insightBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  insightLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  insightSep: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
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

export default SymptomsScreen;

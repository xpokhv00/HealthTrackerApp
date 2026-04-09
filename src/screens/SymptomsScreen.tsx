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
import {useSymptomStore} from '../store/symptomStore';
import {colors} from '../theme/colors';
import {
  filterSymptomsByCategory,
  filterSymptomsByDays,
  formatSymptomDateTime,
  getSeverityLabel,
  getSymptomSummary,
} from '../utils/symptom';

type WindowFilter = 7 | 30 | 'all';
type CategoryFilter =
  | 'all'
  | 'Pain'
  | 'Respiratory'
  | 'Digestive'
  | 'Mood'
  | 'Energy'
  | 'Skin'
  | 'Other';

const categoryOptions: CategoryFilter[] = [
  'all',
  'Pain',
  'Respiratory',
  'Digestive',
  'Mood',
  'Energy',
  'Skin',
  'Other',
];

import SymptomTrendCard from '../components/SymptomTrendCard';
import {
  buildSymptomTrendPoints,
  getTrendDirection,
} from '../utils/symptomTrends';

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const symptoms = useSymptomStore(state => state.symptoms);

  const [windowFilter, setWindowFilter] = useState<WindowFilter>(7);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [activeDimension, setActiveDimension] = useState<'time' | 'category' | 'person'>('time');

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
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [timeFilteredSymptoms]);

  const personFilteredSymptoms = useMemo(() => {
    if (personFilter === 'all') {return timeFilteredSymptoms;}
    if (personFilter === 'me') {return timeFilteredSymptoms.filter(s => !s.patientName);}
    return timeFilteredSymptoms.filter(s => s.patientName === personFilter);
  }, [timeFilteredSymptoms, personFilter]);

  const visibleSymptoms = useMemo(
    () => filterSymptomsByCategory(personFilteredSymptoms, categoryFilter),
    [personFilteredSymptoms, categoryFilter],
  );

  const summary = useMemo(
    () => getSymptomSummary(visibleSymptoms),
    [visibleSymptoms],
  );

  const summaryTitle =
    windowFilter === 'all' ? 'All logged symptoms' : `Last ${windowFilter} days`;

  const selectedCategoryLabel =
    categoryFilter === 'all' ? 'All categories' : categoryFilter;

  const trendWindowDays = windowFilter === 'all' ? 7 : windowFilter;

  const trendPoints = useMemo(
    () => buildSymptomTrendPoints(visibleSymptoms, trendWindowDays),
    [visibleSymptoms, trendWindowDays],
  );

  const trendDirection = useMemo(
    () => getTrendDirection(trendPoints),
    [trendPoints],
  );

  return (
    <Screen>
      <FlatList
        data={visibleSymptoms}
        keyExtractor={item => item.id}
        contentContainerStyle={
          visibleSymptoms.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Symptoms</Text>
                <Text style={styles.subtitle}>
                  Review recent patterns, severity, and likely triggers.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddSymptom')}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filtersSection}>
              {/* Row 1: dimension selector */}
              <View style={styles.dimensionRow}>
                <TouchableOpacity
                  style={[styles.dimensionTab, activeDimension === 'time' && styles.dimensionTabActive]}
                  onPress={() => setActiveDimension('time')}>
                  <Text style={[styles.dimensionTabText, activeDimension === 'time' && styles.dimensionTabTextActive]}>
                    Time
                    {windowFilter !== 7 ? (
                      <Text style={styles.dimensionBadge}> ·</Text>
                    ) : null}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dimensionTab, activeDimension === 'category' && styles.dimensionTabActive]}
                  onPress={() => setActiveDimension('category')}>
                  <Text style={[styles.dimensionTabText, activeDimension === 'category' && styles.dimensionTabTextActive]}>
                    Category
                    {categoryFilter !== 'all' ? (
                      <Text style={styles.dimensionBadge}> ·</Text>
                    ) : null}
                  </Text>
                </TouchableOpacity>
                {peopleOptions.length > 1 && (
                  <TouchableOpacity
                    style={[styles.dimensionTab, activeDimension === 'person' && styles.dimensionTabActive]}
                    onPress={() => setActiveDimension('person')}>
                    <Text style={[styles.dimensionTabText, activeDimension === 'person' && styles.dimensionTabTextActive]}>
                      Person
                      {personFilter !== 'all' ? (
                        <Text style={styles.dimensionBadge}> ·</Text>
                      ) : null}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Row 2: chips for active dimension */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {activeDimension === 'time' && (
                  <>
                    {([7, 30, 'all'] as WindowFilter[]).map(val => {
                      const label = val === 'all' ? 'All time' : `${val} days`;
                      const active = windowFilter === val;
                      return (
                        <TouchableOpacity
                          key={String(val)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                          onPress={() => setWindowFilter(val)}>
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
                {activeDimension === 'category' && categoryOptions.map(option => {
                  const active = categoryFilter === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setCategoryFilter(option)}>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {option === 'all' ? 'All' : option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {activeDimension === 'person' && peopleOptions.map(option => {
                  const active = personFilter === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setPersonFilter(option)}>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {option === 'all' ? 'All' : option === 'me' ? 'Me' : option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryEyebrow}>OVERVIEW</Text>
              <Text style={styles.summaryTitle}>{summaryTitle}</Text>
              <Text style={styles.summarySubtitle}>{selectedCategoryLabel}</Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryTileLabel}>Entries</Text>
                  <Text style={styles.summaryTileValue}>{summary.total}</Text>
                </View>

                <View style={styles.summaryTile}>
                  <Text style={styles.summaryTileLabel}>Avg severity</Text>
                  <Text style={styles.summaryTileValue}>
                    {summary.total > 0 ? `${summary.averageSeverity}/10` : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionLabel}>Most common symptom</Text>
                <Text style={styles.summarySectionValue}>
                  {summary.mostCommon
                    ? `${summary.mostCommon.symptom} • ${summary.mostCommon.count}x`
                    : 'No pattern yet'}
                </Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionLabel}>Strongest recent entry</Text>
                <Text style={styles.summarySectionValue}>
                  {summary.strongest
                    ? `${summary.strongest.symptom} • ${summary.strongest.severity}/10`
                    : 'No symptoms logged'}
                </Text>
                {summary.strongest ? (
                  <Text style={styles.summarySectionMeta}>
                    {getSeverityLabel(summary.strongest.severity)} •{' '}
                    {formatSymptomDateTime(summary.strongest.createdAt)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionLabel}>Top triggers</Text>
                {summary.topTriggers.length > 0 ? (
                  <View style={styles.tagRow}>
                    {summary.topTriggers.map(item => (
                      <View key={item.trigger} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>
                          {item.trigger} • {item.count}x
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.summarySectionMeta}>
                    No trigger data yet
                  </Text>
                )}
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionLabel}>Categories</Text>
                {summary.categoryCounts.length > 0 ? (
                  summary.categoryCounts.slice(0, 4).map(item => (
                    <Text key={item.category} style={styles.summarySectionMeta}>
                      {item.category}: {item.count}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.summarySectionMeta}>
                    No categories yet
                  </Text>
                )}
              </View>
            </View>

            <SymptomTrendCard
              title="Severity over time"
              subtitle={
                trendWindowDays === 7
                  ? 'Daily symptom severity in the last 7 days'
                  : `Daily symptom severity in the last ${trendWindowDays} days`
              }
              points={trendPoints}
              trendDirection={trendDirection}
            />

            {visibleSymptoms.length > 0 ? (
              <Text style={styles.listTitle}>Entries</Text>
            ) : null}
          </View>
        }
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No symptoms in this view</Text>
            <Text style={styles.emptyText}>
              Try another filter or add a new symptom entry.
            </Text>
          </View>
        }
      />
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
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dimensionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dimensionTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dimensionTabActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF4FF',
  },
  dimensionTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dimensionTabTextActive: {
    color: colors.primary,
  },
  dimensionBadge: {
    color: colors.primary,
    fontSize: 16,
  },
  chipRow: {
    paddingRight: 20,
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
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#667085',
    marginTop: 4,
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  summaryTileLabel: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 4,
  },
  summaryTileValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  summarySection: {
    marginTop: 10,
  },
  summarySectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
    marginBottom: 4,
  },
  summarySectionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  summarySectionMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: '#F2F4F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '700',
  },
  listTitle: {
    paddingHorizontal: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 22,
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

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
import {useAppointmentStore} from '../store/appointmentStore';
import AppointmentCard from '../components/AppointmentCard';
import {
  getPastAppointments,
  getUpcomingAppointments,
} from '../utils/appointment';
import Screen from '../components/Screen';
import {colors} from '../theme/colors';

const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const appointments = useAppointmentStore(state => state.appointments);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [personFilter, setPersonFilter] = useState<string>('all');

  const upcomingAppointments = getUpcomingAppointments(appointments);
  const pastAppointments = getPastAppointments(appointments);

  const tabData =
    selectedTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const peopleOptions = useMemo(() => {
    const hasMe = appointments.some(a => !a.patientName);
    const names = appointments
      .map(a => a.patientName)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    return ['all', ...(hasMe ? ['me'] : []), ...unique];
  }, [appointments]);

  const data = useMemo(() => {
    if (personFilter === 'all') {return tabData;}
    if (personFilter === 'me') {return tabData.filter(a => !a.patientName);}
    return tabData.filter(a => a.patientName === personFilter);
  }, [tabData, personFilter]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAppointment')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'upcoming' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('upcoming')}>
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === 'upcoming' && styles.tabButtonTextActive,
            ]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'past' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('past')}>
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === 'past' && styles.tabButtonTextActive,
            ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {peopleOptions.length > 1 && (
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
                  style={[styles.filterChip, active && styles.filterChipActive]}
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

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {selectedTab === 'upcoming'
              ? 'No upcoming appointments'
              : 'No past appointments'}
          </Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'upcoming'
              ? 'Add your next doctor visit.'
              : 'Past visits will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <AppointmentCard
              appointment={item}
              onPress={() =>
                navigation.navigate('AppointmentDetail', {
                  appointmentId: item.id,
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  filtersSection: {
    paddingHorizontal: 20,
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
    color: '#667085',
  },
});

export default AppointmentsScreen;

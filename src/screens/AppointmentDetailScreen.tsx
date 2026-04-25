import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppointmentStore} from '../store/appointmentStore';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAvailabilityBadgeColors,
  getAvailabilityBadgeLabel,
  isUpcomingAppointment,
} from '../utils/appointment';
import {notificationService} from '../services/notificationService';
import {colors} from '../theme/colors';
import Screen from '../components/Screen';

const AppointmentDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {appointmentId} = route.params;

  const appointment = useAppointmentStore(state =>
    state.appointments.find(item => item.id === appointmentId),
  );
  const removeAppointment = useAppointmentStore(
    state => state.removeAppointment,
  );

  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  const getChecked = (index: number) => checkedItems[index] ?? false;
  const toggleChecked = (index: number) =>
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });

  if (!appointment) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Appointment not found.</Text>
        </View>
      </Screen>
    );
  }

  const isUpcoming = isUpcomingAppointment(appointment);
  const badgeColors = isUpcoming
    ? getAvailabilityBadgeColors(appointment.dateTime)
    : {bg: '#F2F4F7', text: '#667085'};
  const badgeLabel = isUpcoming
    ? getAvailabilityBadgeLabel(appointment.dateTime)
    : 'Past appointment';

  const handleDelete = () => {
    Alert.alert('Delete appointment', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await notificationService.cancelAppointmentReminder(appointment.id);
          removeAppointment(appointment.id);
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

        {/* 1. Doctor & Time card */}
        <View style={styles.card}>
          <Text style={styles.doctorTitle}>With Dr. {appointment.doctorName}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatAppointmentDate(appointment.dateTime)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatAppointmentTime(appointment.dateTime)}</Text>
          </View>

          <View style={[styles.badge, {backgroundColor: badgeColors.bg}]}>
            <Text style={[styles.badgeText, {color: badgeColors.text}]}>
              {badgeLabel}
            </Text>
          </View>
        </View>

        {/* 2. Location card */}
        {appointment.location ? (
          <View style={styles.card}>
            <View style={styles.locationRow}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={28} color={colors.textMuted} />
              </View>
              <View style={styles.locationContent}>
                <Text style={styles.locationName}>{appointment.location}</Text>
                <TouchableOpacity style={styles.directionsBtn} activeOpacity={0.8}>
                  <Ionicons name="compass-outline" size={14} color={colors.primary} />
                  <Text style={styles.directionsBtnText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* 3. Preparation checklist card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preparation</Text>
            <TouchableOpacity style={styles.headerAction} activeOpacity={0.7}>
              <Text style={styles.headerActionText}>Add to Reminders</Text>
              <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {appointment.preparation.length === 0 ? (
            <Text style={styles.emptyText}>No preparation notes added.</Text>
          ) : (
            appointment.preparation.map((item, index) => (
              <TouchableOpacity
                key={`prep-${index}`}
                style={styles.checkRow}
                activeOpacity={0.7}
                onPress={() => toggleChecked(index)}>
                <Ionicons
                  name={getChecked(index) ? 'checkbox' : 'checkbox-outline'}
                  size={18}
                  color={getChecked(index) ? colors.primary : colors.textMuted}
                  style={styles.checkIcon}
                />
                <Text style={[styles.checkText, getChecked(index) && styles.checkTextDone]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 4. Symptoms to discuss card */}
        {(appointment.symptomsToDiscuss && appointment.symptomsToDiscuss.length > 0) ||
        appointment.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>To Discuss with Doctor</Text>

            {appointment.symptomsToDiscuss &&
            appointment.symptomsToDiscuss.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsRow}>
                {appointment.symptomsToDiscuss.map((tag, i) => (
                  <View key={`tag-${i}`} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {appointment.notes ? (
              <Text style={styles.discussSubtext}>{appointment.notes}</Text>
            ) : null}
          </View>
        ) : null}

      </ScrollView>

      {/* Bottom actions — single row */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerAction}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('AddAppointment', {
              appointmentId: appointment.id,
            })
          }>
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
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mapPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  checkIcon: {
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  checkTextDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  tagsRow: {
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 4,
  },
  tag: {
    backgroundColor: colors.neutral,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  discussSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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

export default AppointmentDetailScreen;

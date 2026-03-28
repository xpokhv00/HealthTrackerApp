
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Appointment} from '../types/appointment';
import {
  formatAppointmentDateTime,
  getTimeUntilAppointment,
  isUpcomingAppointment,
} from '../utils/appointment';

interface Props {
  appointment: Appointment;
  onPress: () => void;
}

const AppointmentCard: React.FC<Props> = ({appointment, onPress}) => {
  const isUpcoming = isUpcomingAppointment(appointment);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.visitType}>{appointment.visitType}</Text>
          <Text style={styles.doctor}>
            {appointment.doctorName} • {appointment.specialty}
          </Text>
          <Text style={styles.dateTime}>
            {formatAppointmentDateTime(appointment.dateTime)}
          </Text>
          {appointment.location ? (
            <Text style={styles.location}>{appointment.location}</Text>
          ) : null}
        </View>

        <View style={[styles.badge, !isUpcoming && styles.badgePast]}>
          <Text style={[styles.badgeText, !isUpcoming && styles.badgeTextPast]}>
            {isUpcoming
              ? getTimeUntilAppointment(appointment.dateTime)
              : 'Past'}
          </Text>
        </View>
      </View>

      {appointment.preparation.length > 0 ? (
        <Text style={styles.preparation}>
          Prep: {appointment.preparation[0]}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  visitType: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  doctor: {
    marginTop: 4,
    fontSize: 14,
    color: '#475467',
  },
  dateTime: {
    marginTop: 6,
    fontSize: 14,
    color: '#1D2939',
    fontWeight: '700',
  },
  location: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF4FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgePast: {
    backgroundColor: '#F2F4F7',
  },
  badgeText: {
    color: '#3538CD',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeTextPast: {
    color: '#667085',
  },
  preparation: {
    marginTop: 12,
    fontSize: 13,
    color: '#475467',
  },
});

export default AppointmentCard;

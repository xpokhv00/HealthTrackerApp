
import React, {useState} from 'react';
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
  const [expanded, setExpanded] = useState(false);

  const hasPrep = appointment.preparation.length > 0;
  const showToggle = appointment.preparation.length > 1;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.visitType}>{appointment.visitType}</Text>
          {appointment.patientName ? (
            <Text style={styles.patientName}>For: {appointment.patientName}</Text>
          ) : null}
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

      {hasPrep ? (
        <View style={styles.prepSection}>
          {expanded ? (
            appointment.preparation.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.prepItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.preparation}>
              Prep: {appointment.preparation[0]}
              {appointment.preparation.length > 1
                ? ` +${appointment.preparation.length - 1} more`
                : ''}
            </Text>
          )}

          {showToggle ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                setExpanded(prev => !prev);
              }}
              style={styles.toggleButton}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.toggleText}>
                {expanded ? 'Show less' : 'Show all'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  patientName: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#4C7EFF',
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
  prepSection: {
    marginTop: 12,
  },
  preparation: {
    fontSize: 13,
    color: '#475467',
  },
  prepItem: {
    fontSize: 14,
    color: '#344054',
    marginBottom: 6,
  },
  toggleButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C7EFF',
  },
});

export default AppointmentCard;

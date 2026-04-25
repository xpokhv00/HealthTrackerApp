import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Appointment} from '../types/appointment';
import {
  formatAppointmentDateTime,
  getTimeUntilAppointment,
  isUpcomingAppointment,
} from '../utils/appointment';
import {colors, countdownColors} from '../theme/colors';

interface Props {
  appointment: Appointment;
  onPress: () => void;
}

const AppointmentCard: React.FC<Props> = ({appointment, onPress}) => {
  const isUpcoming = isUpcomingAppointment(appointment);
  const [expanded, setExpanded] = useState(false);

  const hasPrep = appointment.preparation.length > 0;
  const showToggle = appointment.preparation.length > 1;
  const badge = isUpcoming ? countdownColors(appointment.dateTime) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Accent bar — green for upcoming, grey for past */}
      <View style={[styles.accent, {backgroundColor: isUpcoming ? colors.severityLowBar : colors.border}]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.info}>
            <Text style={styles.visitType}>{appointment.visitType}</Text>

            {appointment.patientName ? (
              <Text style={styles.patientName}>👤 {appointment.patientName}</Text>
            ) : null}

            <Text style={styles.doctor}>
              🩺 {appointment.doctorName} · {appointment.specialty}
            </Text>

            <Text style={styles.dateTime}>
              🗓 {formatAppointmentDateTime(appointment.dateTime)}
            </Text>

            {appointment.location ? (
              <Text style={styles.location}>📍 {appointment.location}</Text>
            ) : null}
          </View>

          {badge ? (
            <View style={[styles.badge, {backgroundColor: badge.bg}]}>
              <Text style={[styles.badgeText, {color: badge.text}]}>
                {getTimeUntilAppointment(appointment.dateTime)}
              </Text>
            </View>
          ) : (
            <View style={styles.badgePast}>
              <Text style={styles.badgeTextPast}>Past</Text>
            </View>
          )}
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
                📋 {appointment.preparation[0]}
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
                  {expanded ? 'Show less ↑' : 'Show all ↓'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  body: {
    flex: 1,
    padding: 14,
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  patientName: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  doctor: {
    marginTop: 5,
    fontSize: 13,
    color: colors.neutralText,
  },
  dateTime: {
    marginTop: 4,
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
  },
  location: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  badgePast: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeTextPast: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  prepSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  preparation: {
    fontSize: 13,
    color: colors.neutralText,
  },
  prepItem: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 5,
  },
  toggleButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AppointmentCard;

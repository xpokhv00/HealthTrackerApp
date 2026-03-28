import {Appointment} from '../types/appointment';

export const getBestAppointmentReminderDate = (
  appointment: Appointment,
): Date | null => {
  const appointmentTime = new Date(appointment.dateTime).getTime();
  const now = Date.now();

  const oneDayBefore = appointmentTime - 24 * 60 * 60 * 1000;
  const twoHoursBefore = appointmentTime - 2 * 60 * 60 * 1000;

  if (oneDayBefore > now) {
    return new Date(oneDayBefore);
  }

  if (twoHoursBefore > now) {
    return new Date(twoHoursBefore);
  }

  return null;
};

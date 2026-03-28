import {Appointment} from '../types/appointment';

export const formatAppointmentDateTime = (iso: string) => {
  const date = new Date(iso);

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const isUpcomingAppointment = (appointment: Appointment) => {
  return new Date(appointment.dateTime).getTime() >= Date.now();
};

export const getUpcomingAppointments = (appointments: Appointment[]) => {
  return appointments.filter(isUpcomingAppointment).sort((a, b) => {
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });
};

export const getPastAppointments = (appointments: Appointment[]) => {
  return appointments
    .filter(item => !isUpcomingAppointment(item))
    .sort((a, b) => {
      return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
    });
};

export const getTimeUntilAppointment = (iso: string) => {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return 'Started or passed';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `In ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `In ${hours}h ${minutes}m`;
  }

  return `In ${minutes}m`;
};

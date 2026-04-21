import {Appointment} from '../types/appointment';

export const formatAppointmentDateTime = (iso: string) => {
  const date = new Date(iso);

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const formatAppointmentDate = (iso: string) =>
  new Date(iso).toLocaleDateString();

export const formatAppointmentTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

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

// Returns a pill badge label like "TOMORROW MORNING (In 16h)" or "TODAY 9:30 AM (In 2h)"
export const getAvailabilityBadgeLabel = (iso: string): string => {
  const target = new Date(iso);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Past';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const timeStr = target.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const countdownStr =
    days > 0
      ? `In ${days}d ${hours}h`
      : hours > 0
      ? `In ${hours}h ${minutes}m`
      : `In ${minutes}m`;

  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const h = target.getHours();
  const timeOfDay =
    h < 12 ? 'MORNING' : h < 17 ? 'AFTERNOON' : 'EVENING';

  if (diffDays === 0) {
    return `TODAY ${timeOfDay} (${countdownStr})`;
  }
  if (diffDays === 1) {
    return `TOMORROW ${timeOfDay} (${countdownStr})`;
  }
  return `${target.toLocaleDateString(undefined, {weekday: 'long'}).toUpperCase()} ${timeOfDay} (${countdownStr})`;
};

// Returns badge colors based on urgency
export const getAvailabilityBadgeColors = (
  iso: string,
): {bg: string; text: string} => {
  const diff = new Date(iso).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days <= 1) {
    return {bg: '#FEF3F2', text: '#B42318'};
  }
  if (days <= 7) {
    return {bg: '#FFFAEB', text: '#B54708'};
  }
  return {bg: '#EEF4FF', text: '#3538CD'};
};


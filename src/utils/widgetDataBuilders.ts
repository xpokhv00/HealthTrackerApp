import { Appointment } from '../types/appointment';
import { Medication } from '../types/medication';
import {
  AsNeededWidgetItem,
  AppointmentWidgetData,
  RoutineWidgetItem,
} from '../native/healthWidgets';
import { isRoutineMedicationDueToday } from './routineSchedule';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const parseTimeToday = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h || 0, m || 0, 0, 0);
  return date;
};

const formatRemaining = (minutes: number) => {
  if (minutes <= 0) {
    return 'Available now';
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) {
    return `Available in ${h}h ${m}m`;
  }

  return `Available in ${m}m`;
};

const getRoutineStatus = (
  med: Medication,
  scheduledTime: string,
): 'pending' | 'missed' | 'taken' => {
  const now = new Date();
  const scheduled = parseTimeToday(scheduledTime);

  const takenToday = med.takenHistory
    .map(item => new Date(item))
    .filter(item => isSameDay(item, now));

  if (takenToday.length > 0) {
    return 'taken';
  }

  if (now.getTime() > scheduled.getTime()) {
    return 'missed';
  }

  return 'pending';
};

export const buildRoutineWidgetItems = (
  medications: Medication[],
): RoutineWidgetItem[] => {
  const items: RoutineWidgetItem[] = [];

  medications
    .filter(
      item =>
        item.isActive &&
        item.type === 'routine' &&
        isRoutineMedicationDueToday(item) &&
        item.scheduledTimes &&
        item.scheduledTimes.length > 0,
    )
    .forEach(med => {
      med.scheduledTimes?.forEach(time => {
        items.push({
          id: med.id,
          name: med.name,
          dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
          time,
          status: getRoutineStatus(med, time),
        });
      });
    });

  const order = {
    pending: 0,
    missed: 1,
    taken: 2,
  };

  return items.sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }

    return a.time.localeCompare(b.time);
  });
};

export const buildAsNeededWidgetItems = (
  medications: Medication[],
): AsNeededWidgetItem[] => {
  const now = Date.now();

  return medications
    .filter(item => item.isActive && item.type === 'as_needed')
    .map(med => {
      if (!med.lastTakenAt || !med.minHoursBetweenDoses) {
        return {
          id: med.id,
          name: med.name,
          dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
          available: true,
          availableInText: 'Available now',
        };
      }

      const nextAllowed =
        new Date(med.lastTakenAt).getTime() +
        med.minHoursBetweenDoses * 60 * 60 * 1000;

      const remainingMinutes = Math.ceil((nextAllowed - now) / (1000 * 60));

      return {
        id: med.id,
        name: med.name,
        dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
        available: remainingMinutes <= 0,
        availableInText: formatRemaining(remainingMinutes),
      };
    })
    .sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      if (a.available && b.available) {
        return a.name.localeCompare(b.name);
      }

      return a.availableInText.localeCompare(b.availableInText);
    });
};

export const buildAppointmentWidgetData = (
  appointments: Appointment[],
): AppointmentWidgetData | null => {
  const now = Date.now();

  const next = appointments
    .filter(item => new Date(item.dateTime).getTime() >= now)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    )[0];

  if (!next) {
    return null;
  }

  const date = new Date(next.dateTime);

  return {
    title: next.visitType,
    doctor: next.doctorName,
    specialty: next.specialty,
    dayOfWeek: date.toLocaleDateString(undefined, { weekday: 'long' }),
    dateTimeText: `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    recommendations: next.preparation.slice(0, 3),
  };
};

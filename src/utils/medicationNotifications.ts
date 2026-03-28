import {Medication} from '../types/medication';

const parseTime = (time: string) => {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return {hours, minutes};
};

export const getNextTimestampForTime = (time: string): Date | null => {
  const parsed = parseTime(time);

  if (!parsed) {
    return null;
  }

  const now = new Date();
  const target = new Date();

  target.setHours(parsed.hours, parsed.minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
};

export const getRoutineReminderDates = (medication: Medication): Date[] => {
  if (
    medication.type !== 'routine' ||
    !medication.scheduledTimes ||
    medication.scheduledTimes.length === 0
  ) {
    return [];
  }

  return medication.scheduledTimes
    .map(getNextTimestampForTime)
    .filter((item): item is Date => item instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime());
};

export const getRoutineReminderNotificationId = (
  medicationId: string,
  time: string,
) => {
  const normalizedTime = time.replace(':', '-');
  return `medication-${medicationId}-${normalizedTime}`;
};

export const getMedicationSnoozeNotificationId = (medicationId: string) => {
  return `medication-snooze-${medicationId}`;
};

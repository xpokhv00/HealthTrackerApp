import {Medication} from '../types/medication';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (from: Date, to: Date) => {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const isRoutineMedicationDueToday = (
  medication: Medication,
  targetDate: Date = new Date(),
) => {
  if (medication.type !== 'routine' || !medication.isActive) {
    return false;
  }

  const startDate = new Date(medication.startDate);

  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  if (medication.endDate) {
    const endDate = new Date(medication.endDate);
    if (startOfDay(targetDate).getTime() > startOfDay(endDate).getTime()) {
      return false;
    }
  }

  const frequencyType = medication.frequencyType ?? 'daily';

  if (frequencyType === 'daily') {
    return startOfDay(targetDate).getTime() >= startOfDay(startDate).getTime();
  }

  if (frequencyType === 'interval_days') {
    const interval = medication.intervalDays ?? 1;
    if (interval <= 0) {
      return false;
    }

    const diffDays = daysBetween(startDate, targetDate);
    if (diffDays < 0) {
      return false;
    }

    return diffDays % interval === 0;
  }

  return false;
};

export const getRoutineExpectedDoseCountToday = (medication: Medication) => {
  if (!isRoutineMedicationDueToday(medication)) {
    return 0;
  }

  if (medication.scheduledTimes?.length) {
    return medication.scheduledTimes.length;
  }

  return medication.timesPerDay ?? 1;
};

export const getTakenCountToday = (medication: Medication) => {
  const today = new Date();

  return medication.takenHistory.filter(entry => {
    const date = new Date(entry);
    return isSameDay(date, today);
  }).length;
};

export const getRoutineTakenCountToday = (medication: Medication) => {
  const expected = getRoutineExpectedDoseCountToday(medication);
  const taken = getTakenCountToday(medication);

  return Math.min(expected, taken);
};

export const getRoutineProgressSummary = (medications: Medication[]) => {
  const routineMeds = medications.filter(item => item.type === 'routine' && item.isActive);

  const totalExpected = routineMeds.reduce(
    (sum, med) => sum + getRoutineExpectedDoseCountToday(med),
    0,
  );

  const totalTaken = routineMeds.reduce(
    (sum, med) => sum + getRoutineTakenCountToday(med),
    0,
  );

  const percent =
    totalExpected === 0 ? 0 : Math.round((totalTaken / totalExpected) * 100);

  return {
    totalExpected,
    totalTaken,
    percent,
  };
};

export const getRoutineScheduleLabel = (medication: Medication) => {
  if (medication.type !== 'routine') {
    return '';
  }

  const frequencyType = medication.frequencyType ?? 'daily';

  if (frequencyType === 'interval_days') {
    return `Every ${medication.intervalDays ?? 1} days`;
  }

  return 'Daily';
};

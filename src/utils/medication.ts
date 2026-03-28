import {Medication} from '../types/medication';

export const formatDateTime = (iso?: string) => {
  if (!iso) {
    return 'Not taken yet';
  }

  const date = new Date(iso);

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const getTodayDoseCount = (medication: Medication) => {
  const today = new Date();

  return medication.takenHistory.filter(entry => {
    const date = new Date(entry);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;
};

export const getNextAllowedTime = (medication: Medication): Date | null => {
  if (medication.type !== 'as_needed') {
    return null;
  }

  if (!medication.lastTakenAt || !medication.minHoursBetweenDoses) {
    return null;
  }

  const lastTaken = new Date(medication.lastTakenAt);
  const nextAllowed = new Date(
    lastTaken.getTime() + medication.minHoursBetweenDoses * 60 * 60 * 1000,
  );

  return nextAllowed;
};

export const isMedicationAvailableNow = (medication: Medication): boolean => {
  if (medication.type === 'routine') {
    return true;
  }

  const nextAllowed = getNextAllowedTime(medication);

  if (!nextAllowed) {
    return true;
  }

  return new Date() >= nextAllowed;
};

export const getAvailabilityLabel = (medication: Medication): string => {
  if (medication.type === 'routine') {
    const count = getTodayDoseCount(medication);
    return `Taken today: ${count}`;
  }

  const nextAllowed = getNextAllowedTime(medication);

  if (!medication.lastTakenAt) {
    return 'Available now';
  }

  if (!nextAllowed) {
    return 'Available now';
  }

  const now = new Date();

  if (now >= nextAllowed) {
    return 'Available now';
  }

  return `Available at ${nextAllowed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const hasReachedDailyLimit = (medication: Medication): boolean => {
  if (medication.type !== 'as_needed' || !medication.maxDailyDoses) {
    return false;
  }

  return getTodayDoseCount(medication) >= medication.maxDailyDoses;
};

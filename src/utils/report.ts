import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {SymptomEntry} from '../types/symptom';

export const sortByNewest = <T extends {createdAt?: string; dateTime?: string}>(
  items: T[],
) => {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.dateTime || 0).getTime();
    const bTime = new Date(b.createdAt || b.dateTime || 0).getTime();

    return bTime - aTime;
  });
};

export const getRecentSymptomsForReport = (
  symptoms: SymptomEntry[],
  limit = 10,
) => {
  return sortByNewest(symptoms).slice(0, limit);
};

export const getActiveMedicationsForReport = (medications: Medication[]) => {
  return medications.filter(item => item.isActive);
};

export const getUpcomingAppointmentsForReport = (appointments: Appointment[]) => {
  const now = Date.now();

  return [...appointments]
    .filter(item => new Date(item.dateTime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );
};

export const getPastAppointmentsForReport = (appointments: Appointment[]) => {
  const now = Date.now();

  return [...appointments]
    .filter(item => new Date(item.dateTime).getTime() < now)
    .sort(
      (a, b) =>
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );
};

export const groupSymptomsByName = (symptoms: SymptomEntry[]) => {
  return symptoms.reduce<Record<string, SymptomEntry[]>>((acc, item) => {
    if (!acc[item.symptom]) {
      acc[item.symptom] = [];
    }

    acc[item.symptom].push(item);
    return acc;
  }, {});
};

export const getAverageSeverity = (entries: SymptomEntry[]) => {
  if (entries.length === 0) {
    return 0;
  }

  const total = entries.reduce((sum, item) => sum + item.severity, 0);
  return Number((total / entries.length).toFixed(1));
};

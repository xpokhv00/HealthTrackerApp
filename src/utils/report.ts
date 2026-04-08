import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {RoutineDoseSlot} from '../types/routineDose';
import {SymptomEntry} from '../types/symptom';

export type ReportWindow = 7 | 14 | 30 | 'all';

const isTakenRoutineSlot = (status: RoutineDoseSlot['status']) =>
  status === 'taken_on_time' || status === 'taken_late';

const getWindowStartTime = (window: ReportWindow) => {
  if (window === 'all') {
    return null;
  }

  return Date.now() - window * 24 * 60 * 60 * 1000;
};

export const getReportWindowLabel = (window: ReportWindow) => {
  if (window === 'all') {
    return 'All available records';
  }

  return `Last ${window} days`;
};

export const sortByNewest = <T extends {createdAt?: string; dateTime?: string}>(
  items: T[],
) => {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.dateTime || 0).getTime();
    const bTime = new Date(b.createdAt || b.dateTime || 0).getTime();

    return bTime - aTime;
  });
};

export const getSymptomsForReport = (
  symptoms: SymptomEntry[],
  window: ReportWindow,
) => {
  const startTime = getWindowStartTime(window);

  const filtered =
    startTime === null
      ? symptoms
      : symptoms.filter(
        item => new Date(item.createdAt).getTime() >= startTime,
      );

  return sortByNewest(filtered);
};

export const getRecentSymptomsForReport = (
  symptoms: SymptomEntry[],
  limit = 10,
  window: ReportWindow = 14,
) => {
  return getSymptomsForReport(symptoms, window).slice(0, limit);
};

export const getActiveMedicationsForReport = (medications: Medication[]) => {
  return medications.filter(item => item.isActive);
};

export const getUpcomingAppointmentsForReport = (
  appointments: Appointment[],
) => {
  const now = Date.now();

  return [...appointments]
    .filter(item => new Date(item.dateTime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );
};

export const getPastAppointmentsForReport = (
  appointments: Appointment[],
  window: ReportWindow = 30,
) => {
  const now = Date.now();
  const startTime = getWindowStartTime(window);

  return [...appointments]
    .filter(item => {
      const time = new Date(item.dateTime).getTime();
      if (time >= now) {
        return false;
      }

      if (startTime === null) {
        return true;
      }

      return time >= startTime;
    })
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

export const getMostFrequentSymptomForReport = (symptoms: SymptomEntry[]) => {
  const grouped = groupSymptomsByName(symptoms);
  const items = Object.entries(grouped)
    .map(([name, entries]) => ({
      name,
      count: entries.length,
      latest: entries[0],
      averageSeverity: getAverageSeverity(entries),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return (
        new Date(b.latest.createdAt).getTime() -
        new Date(a.latest.createdAt).getTime()
      );
    });

  return items[0] ?? null;
};

export const getStrongestSymptomForReport = (symptoms: SymptomEntry[]) => {
  if (symptoms.length === 0) {
    return null;
  }

  return [...symptoms].sort((a, b) => {
    if (b.severity !== a.severity) {
      return b.severity - a.severity;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
};

export const getRoutineAdherenceSummary = (
  medications: Medication[],
  slots: RoutineDoseSlot[],
  window: ReportWindow,
) => {
  const routineMedicationIds = new Set(
    medications
      .filter(item => item.isActive && item.type === 'routine')
      .map(item => item.id),
  );

  const startTime = getWindowStartTime(window);

  const relevantSlots = slots.filter(slot => {
    if (!routineMedicationIds.has(slot.medicationId)) {
      return false;
    }

    const slotDateTime = new Date(`${slot.date}T${slot.scheduledTime}:00`).getTime();

    if (Number.isNaN(slotDateTime)) {
      return false;
    }

    if (startTime === null) {
      return true;
    }

    return slotDateTime >= startTime;
  });

  const total = relevantSlots.length;
  const taken = relevantSlots.filter(slot => isTakenRoutineSlot(slot.status)).length;
  const missed = relevantSlots.filter(slot => slot.status === 'missed').length;
  const pending = relevantSlots.filter(slot => slot.status === 'pending').length;
  const adherencePercent = total === 0 ? 0 : Math.round((taken / total) * 100);

  return {
    total,
    taken,
    missed,
    pending,
    adherencePercent,
  };
};

import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {RoutineDoseSlot} from '../types/routineDose';
import {SymptomEntry} from '../types/symptom';
import {isRoutineMedicationDueToday} from './routineSchedule';

export type ReportWindow = 7 | 14 | 30 | 'all';

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
  _slots: RoutineDoseSlot[],
  window: ReportWindow,
) => {
  const routineMeds = medications.filter(
    item => item.isActive && item.type === 'routine',
  );

  if (routineMeds.length === 0) {
    return {total: 0, taken: 0, missed: 0, pending: 0, adherencePercent: 0};
  }

  const now = new Date();
  const windowDays = window === 'all' ? null : window;

  // Build the list of days in the window (from oldest to today)
  const days: Date[] = [];
  if (windowDays === null) {
    // 'all': span from the earliest medication startDate to today
    const earliest = routineMeds.reduce<Date | null>((min, med) => {
      const d = new Date(med.startDate);
      return !min || d < min ? d : min;
    }, null);
    if (earliest) {
      let cursor = new Date(earliest);
      cursor.setHours(0, 0, 0, 0);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      while (cursor <= todayStart) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  } else {
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
  }

  let totalExpected = 0;
  let totalTaken = 0;

  for (const day of days) {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    for (const med of routineMeds) {
      if (!isRoutineMedicationDueToday(med, day)) {
        continue;
      }
      const dosesPerDay = med.scheduledTimes?.length ?? med.timesPerDay ?? 1;
      totalExpected += dosesPerDay;

      // Count taken doses on this day from takenHistory
      const takenOnDay = med.takenHistory.filter(iso => {
        const t = new Date(iso).getTime();
        return t >= dayStart && t <= dayEnd;
      }).length;

      // Don't count more than expected (can't over-take for adherence purposes)
      totalTaken += Math.min(takenOnDay, dosesPerDay);
    }
  }

  // Pending = today's remaining doses (future scheduled times today)
  let pending = 0;
  for (const med of routineMeds) {
    if (!isRoutineMedicationDueToday(med, now)) {continue;}
    const times = med.scheduledTimes ?? [];
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const remainingTimes = times.filter(t => t > nowHHMM);
    pending += remainingTimes.length;
  }

  const missed = Math.max(0, totalExpected - totalTaken - pending);
  const adherencePercent =
    totalExpected === 0 ? 0 : Math.round((totalTaken / totalExpected) * 100);

  return {
    total: totalExpected,
    taken: totalTaken,
    missed,
    pending,
    adherencePercent,
  };
};

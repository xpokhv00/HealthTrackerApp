import {Medication} from '../types/medication';
import {
  getRoutineProgressSummary,
  isRoutineMedicationDueToday,
} from './routineSchedule';

const parseTimeMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const getNextRoutineTimeToday = (medications: Medication[]) => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const times = medications
    .filter(item => item.type === 'routine' && item.isActive && isRoutineMedicationDueToday(item))
    .flatMap(item => item.scheduledTimes ?? [])
    .sort((a, b) => parseTimeMinutes(a) - parseTimeMinutes(b));

  return times.find(time => parseTimeMinutes(time) >= nowMinutes) ?? null;
};

export const getRoutineHomeSummary = (medications: Medication[]) => {
  const progress = getRoutineProgressSummary(medications);
  const nextTime = getNextRoutineTimeToday(medications);

  return {
    ...progress,
    nextTime,
  };
};

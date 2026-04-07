import {Medication} from '../types/medication';
import {RoutineDoseSlot} from '../types/routineDose';
import {toDateKey} from './dateHelpers';
import {isRoutineMedicationDueToday} from './routineSchedule';

export const buildTodayRoutineDoseSlots = (
  medications: Medication[],
  targetDate: Date = new Date(),
): RoutineDoseSlot[] => {
  const dateKey = toDateKey(targetDate);

  return medications
    .filter(
      med =>
        med.type === 'routine' &&
        med.isActive &&
        isRoutineMedicationDueToday(med, targetDate) &&
        med.scheduledTimes &&
        med.scheduledTimes.length > 0,
    )
    .flatMap(med =>
      (med.scheduledTimes ?? []).map(time => ({
        id: `${med.id}_${dateKey}_${time}`,
        medicationId: med.id,
        medicationName: med.name,
        date: dateKey,
        scheduledTime: time,
        status: 'pending' as const,
      })),
    )
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
};

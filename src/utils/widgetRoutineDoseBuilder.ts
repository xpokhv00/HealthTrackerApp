import {RoutineDoseSlot} from '../types/routineDose';
import {RoutineWidgetItem} from '../native/healthWidgets';
import {toDateKey} from './dateHelpers';

export const buildRoutineWidgetItemsFromSlots = (
  slots: RoutineDoseSlot[],
  targetDate: Date = new Date(),
): RoutineWidgetItem[] => {
  const dateKey = toDateKey(targetDate);

  const todaySlots = slots.filter(slot => slot.date === dateKey);

  const order = {
    pending: 0,
    missed: 1,
    taken_on_time: 2,
    taken_late: 2,
  };

  return todaySlots
    .map(slot => ({
      id: slot.id,
      name: slot.medicationName,
      dosage: '',
      time: slot.scheduledTime,
      status:
        slot.status === 'taken_on_time' || slot.status === 'taken_late'
          ? 'taken'
          : slot.status,
    }))
    .sort((a, b) => {
      if (order[a.status as keyof typeof order] !== order[b.status as keyof typeof order]) {
        return (
          order[a.status as keyof typeof order] -
          order[b.status as keyof typeof order]
        );
      }

      return a.time.localeCompare(b.time);
    });
};

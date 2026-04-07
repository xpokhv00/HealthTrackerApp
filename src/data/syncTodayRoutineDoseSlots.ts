import {buildTodayRoutineDoseSlots} from '../utils/routineDoseGenerator.ts';
import {useMedicationStore} from '../store/medicationStore.ts';
import {useRoutineDoseStore} from '../store/routineDoseStore.ts';

export const syncTodayRoutineDoseSlots = () => {
  const medications = useMedicationStore.getState().medications;
  const slots = buildTodayRoutineDoseSlots(medications);

  useRoutineDoseStore.getState().upsertSlotsForDay(slots);
  useRoutineDoseStore.getState().markMissedSlotsForToday();
};

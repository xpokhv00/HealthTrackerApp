import {buildTodayRoutineDoseSlots} from '../utils/routineDoseGenerator';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';

export const syncTodayRoutineDoseSlots = () => {
  const medications = useMedicationStore.getState().medications;
  const slots = buildTodayRoutineDoseSlots(medications);
  useRoutineDoseStore.getState().upsertSlotsForDay(slots);
  useRoutineDoseStore.getState().markMissedSlotsForToday();
};

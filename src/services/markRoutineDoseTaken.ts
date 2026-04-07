import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';

export const markRoutineDoseTaken = (slotId: string, medicationId: string) => {
  useRoutineDoseStore.getState().markSlotTaken(slotId);

  // Keep legacy medication history for compatibility with existing screens
  useMedicationStore.getState().markMedicationTaken(medicationId);
};

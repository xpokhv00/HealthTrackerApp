import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {toDateKey} from '../utils/dateHelpers';

export const markNextRoutineDoseTaken = (medicationId: string) => {
  const todayKey = toDateKey(new Date());

  const routineDoseStore = useRoutineDoseStore.getState();
  const medicationStore = useMedicationStore.getState();

  const candidateSlots = routineDoseStore.slots
    .filter(
      slot =>
        slot.medicationId === medicationId &&
        slot.date === todayKey &&
        (slot.status === 'pending' || slot.status === 'missed'),
    )
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const nextSlot = candidateSlots[0];

  if (nextSlot) {
    routineDoseStore.markSlotTaken(nextSlot.id);
  }

  // keep legacy medication history for current screens
  medicationStore.markMedicationTaken(medicationId);
};

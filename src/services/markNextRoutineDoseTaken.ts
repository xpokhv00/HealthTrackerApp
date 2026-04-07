import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {toDateKey} from '../utils/dateHelpers';

const parseTodayTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.getTime();
};

export const markNextRoutineDoseTaken = (medicationId: string): boolean => {
  const today = new Date();
  const todayKey = toDateKey(today);
  const now = today.getTime();

  const routineDoseStore = useRoutineDoseStore.getState();
  const medicationStore = useMedicationStore.getState();
  const medication = medicationStore.getMedicationById(medicationId);

  if (!medication || medication.type !== 'routine') {
    return false;
  }

  const candidateSlots = routineDoseStore.slots.filter(
    slot =>
      slot.medicationId === medicationId &&
      slot.date === todayKey &&
      (slot.status === 'pending' || slot.status === 'missed'),
  );

  if (candidateSlots.length === 0) {
    return false;
  }

  const sortedSlots = [...candidateSlots].sort((a, b) => {
    const aTime = parseTodayTime(a.scheduledTime);
    const bTime = parseTodayTime(b.scheduledTime);

    const aIsOverdue = aTime <= now;
    const bIsOverdue = bTime <= now;

    if (aIsOverdue !== bIsOverdue) {
      return aIsOverdue ? -1 : 1;
    }

    return aTime - bTime;
  });

  const nextSlot = sortedSlots[0];

  if (!nextSlot) {
    return false;
  }

  routineDoseStore.markSlotTaken(nextSlot.id);

  // Keep legacy medication history in sync with routine slot actions.
  medicationStore.markMedicationTaken(medicationId);

  return true;
};

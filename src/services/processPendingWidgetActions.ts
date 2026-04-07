import {
  clearPendingWidgetActions,
  getPendingWidgetActions,
} from '../native/healthWidgets';
import {syncRoutineMedicationReminders} from './medicationReminderSync';
import {syncAllWidgets} from './widgetSync';
import {useAppointmentStore} from '../store/appointmentStore';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {WidgetAction} from '../types/widgetActions';

const dedupeActions = (actions: WidgetAction[]) => {
  const seen = new Set<string>();

  return actions.filter(action => {
    const key =
      action.type === 'routine_slot_taken'
        ? `${action.type}-${action.slotId}-${action.createdAt}`
        : `${action.type}-${action.medicationId}-${action.createdAt}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const processPendingWidgetActions = async () => {
  const actions = dedupeActions(await getPendingWidgetActions());

  if (actions.length === 0) {
    return;
  }

  const medicationStore = useMedicationStore.getState();
  const routineDoseStore = useRoutineDoseStore.getState();

  actions.forEach(action => {
    switch (action.type) {
      case 'routine_slot_taken': {
        const slot = routineDoseStore.slots.find(item => item.id === action.slotId);

        if (!slot) {
          break;
        }

        routineDoseStore.markSlotTaken(action.slotId);
        medicationStore.markMedicationTaken(slot.medicationId);
        break;
      }

      case 'as_needed_taken':
        medicationStore.markMedicationTaken(action.medicationId);
        break;
    }
  });

  await clearPendingWidgetActions();

  const medications = useMedicationStore.getState().medications;
  const appointments = useAppointmentStore.getState().appointments;

  await syncRoutineMedicationReminders(medications);
  await syncAllWidgets({
    medications,
    appointments,
  });
};

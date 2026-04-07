import {
  clearPendingWidgetActions,
  getPendingWidgetActions,
} from '../native/healthWidgets';
import {syncRoutineMedicationReminders} from './medicationReminderSync';
import {syncAllWidgets} from './widgetSync';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {WidgetAction} from '../types/widgetActions';
import {
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';

const getActionKey = (action: WidgetAction) => {
  switch (action.type) {
    case 'routine_slot_taken':
      return `${action.type}-${action.slotId}-${action.createdAt}`;
    case 'as_needed_taken':
      return `${action.type}-${action.medicationId}-${action.createdAt}`;
    default:
      return `${action.type}-${action.createdAt}`;
  }
};

const dedupeActions = (actions: WidgetAction[]) => {
  const seen = new Set<string>();

  return actions.filter(action => {
    const key = getActionKey(action);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const isRoutineSlotAlreadyTaken = (status: string) =>
  status === 'taken_on_time' || status === 'taken_late';

export const processPendingWidgetActions = async () => {
  const actions = dedupeActions(await getPendingWidgetActions());

  if (actions.length === 0) {
    return;
  }

  const medicationStore = useMedicationStore.getState();
  const routineDoseStore = useRoutineDoseStore.getState();

  for (const action of actions) {
    switch (action.type) {
      case 'routine_slot_taken': {
        const slot = routineDoseStore.slots.find(item => item.id === action.slotId);

        if (!slot || isRoutineSlotAlreadyTaken(slot.status)) {
          break;
        }

        routineDoseStore.markSlotTaken(action.slotId);
        medicationStore.markMedicationTaken(slot.medicationId);
        break;
      }

      case 'as_needed_taken': {
        const medication = medicationStore.getMedicationById(action.medicationId);

        if (!medication) {
          break;
        }

        if (
          hasReachedDailyLimit(medication) ||
          !isMedicationAvailableNow(medication)
        ) {
          break;
        }

        medicationStore.markMedicationTaken(action.medicationId);
        break;
      }

      default:
        break;
    }
  }

  await clearPendingWidgetActions();

  const medications = useMedicationStore.getState().medications;
  await syncRoutineMedicationReminders(medications);
  await syncAllWidgets();
};

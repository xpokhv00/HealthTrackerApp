import {
  syncAppointmentWidget,
  syncAsNeededWidget,
  syncRoutineWidget,
} from '../native/healthWidgets';
import {useAppointmentStore} from '../store/appointmentStore';
import {useMedicationStore} from '../store/medicationStore';
import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {
  buildAppointmentWidgetData,
  buildAsNeededWidgetItems,
  buildRoutineWidgetItems,
} from '../utils/widgetDataBuilders';

type SyncWidgetArgs = {
  medications?: Medication[];
  appointments?: Appointment[];
};

const resolveSyncData = (args?: SyncWidgetArgs) => {
  return {
    medications: args?.medications ?? useMedicationStore.getState().medications,
    appointments:
      args?.appointments ?? useAppointmentStore.getState().appointments,
  };
};

export const syncAllWidgets = async (args?: SyncWidgetArgs) => {
  const {medications, appointments} = resolveSyncData(args);

  await syncRoutineWidget(buildRoutineWidgetItems(medications));
  await syncAsNeededWidget(buildAsNeededWidgetItems(medications));
  await syncAppointmentWidget(buildAppointmentWidgetData(appointments));
};

export const syncMedicationWidget = async (medications?: Medication[]) => {
  await syncAllWidgets({medications});
};

export const syncAppointmentWidgets = async (appointments?: Appointment[]) => {
  await syncAllWidgets({appointments});
};

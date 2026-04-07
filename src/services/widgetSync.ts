import {syncAppointmentWidget, syncAsNeededWidget, syncRoutineWidget} from '../native/healthWidgets';
import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {
  buildAppointmentWidgetData,
  buildAsNeededWidgetItems,
  buildRoutineWidgetItems,
} from '../utils/widgetDataBuilders';

export const syncAllWidgets = async ({
                                       medications,
                                       appointments,
                                     }: {
  medications: Medication[];
  appointments: Appointment[];
}) => {
  await syncRoutineWidget(buildRoutineWidgetItems(medications));
  await syncAsNeededWidget(buildAsNeededWidgetItems(medications));
  await syncAppointmentWidget(buildAppointmentWidgetData(appointments));
};

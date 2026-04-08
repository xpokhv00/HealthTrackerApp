import {seedAppointments} from '../data/seedAppointments';
import {seedMedications} from '../data/seedMedications';
import {seedSymptoms} from '../data/seedSymptoms';
import {syncRoutineMedicationReminders} from './medicationReminderSync';
import {syncTodayRoutineDoseSlots} from './syncRoutineDoseSlots';
import {syncAllWidgets} from './widgetSync';
import {useAppointmentStore} from '../store/appointmentStore';
import {useMedicationStore} from '../store/medicationStore';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {useSymptomStore} from '../store/symptomStore';

export const loadSeedData = async () => {
  const medicationStore = useMedicationStore.getState();
  const appointmentStore = useAppointmentStore.getState();
  const symptomStore = useSymptomStore.getState();
  const routineDoseStore = useRoutineDoseStore.getState();

  medicationStore.clearAll();
  appointmentStore.clearAllAppointments();
  symptomStore.clearAllSymptoms();
  routineDoseStore.clearAllSlots();

  seedMedications.forEach(item => medicationStore.addMedication(item));
  seedAppointments.forEach(item => appointmentStore.addAppointment(item));
  seedSymptoms.forEach(item => symptomStore.addSymptom(item));

  syncTodayRoutineDoseSlots();

  const meds = useMedicationStore.getState().medications;
  await syncRoutineMedicationReminders(meds);
  await syncAllWidgets();
};

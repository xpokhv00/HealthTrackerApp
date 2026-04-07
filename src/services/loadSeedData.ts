import {seedAppointments} from '../data/seedAppointments';
import {seedMedications} from '../data/seedMedications';
import {seedSymptoms} from '../data/seedSymptoms';
import {syncRoutineMedicationReminders} from './medicationReminderSync';
import {useAppointmentStore} from '../store/appointmentStore';
import {useMedicationStore} from '../store/medicationStore';
import {useSymptomStore} from '../store/symptomStore';
import { syncTodayRoutineDoseSlots } from './syncRoutineDoseSlots.ts';

export const loadSeedData = async () => {
  const medicationStore = useMedicationStore.getState();
  const appointmentStore = useAppointmentStore.getState();
  const symptomStore = useSymptomStore.getState();

  medicationStore.clearAll();
  appointmentStore.clearAllAppointments();
  symptomStore.clearAllSymptoms();

  seedMedications.forEach(item => medicationStore.addMedication(item));
  seedAppointments.forEach(item => appointmentStore.addAppointment(item));
  seedSymptoms.forEach(item => symptomStore.addSymptom(item));

  syncTodayRoutineDoseSlots();

  const meds = useMedicationStore.getState().medications;
  await syncRoutineMedicationReminders(meds);
};

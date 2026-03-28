import {seedAppointments} from '../data/seedAppointments.ts';
import {seedMedications} from '../data/seedMedications.ts';
import {seedSymptoms} from '../data/seedSymptoms.ts';
import {useAppointmentStore} from '../store/appointmentStore.ts';
import {useMedicationStore} from '../store/medicationStore.ts';
import {useSymptomStore} from '../store/symptomStore.ts';

export const loadSeedData = () => {
  const medicationStore = useMedicationStore.getState();
  const appointmentStore = useAppointmentStore.getState();
  const symptomStore = useSymptomStore.getState();

  medicationStore.clearAll();
  appointmentStore.clearAllAppointments();
  symptomStore.clearAllSymptoms();

  seedMedications.forEach(item => medicationStore.addMedication(item));
  seedAppointments.forEach(item => appointmentStore.addAppointment(item));
  seedSymptoms.forEach(item => symptomStore.addSymptom(item));
};

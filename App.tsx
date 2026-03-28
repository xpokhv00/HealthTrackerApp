import React, {useEffect} from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import {notificationService} from './src/services/notificationService';
import {syncRoutineMedicationReminders} from './src/services/medicationReminderSync';
import {useMedicationStore} from './src/store/medicationStore';
import {notificationNavigationService} from './src/services/notificationNavigation';
import {syncMedicationWidget} from './src/services/widgetSync';
import {loadSeedData} from './src/services/loadSeedData';
import {useAppointmentStore} from './src/store/appointmentStore';
import {useSymptomStore} from './src/store/symptomStore';

const App = () => {
  useEffect(() => {
    const setup = async () => {
      const medications = useMedicationStore.getState().medications;
      const appointments = useAppointmentStore.getState().appointments;
      const symptoms = useSymptomStore.getState().symptoms;
      await syncRoutineMedicationReminders(medications);
      await syncMedicationWidget(medications);

      if (
        __DEV__ &&
        medications.length === 0 &&
        appointments.length === 0 &&
        symptoms.length === 0
      ) {
        loadSeedData();
      }

      await notificationService.init();

      const updatedMeds = useMedicationStore.getState().medications;
      await syncRoutineMedicationReminders(updatedMeds);
      await syncMedicationWidget(updatedMeds);

      notificationNavigationService.registerForegroundHandler();
      await notificationNavigationService.handleInitialNotification();
    };

    setup();

    return () => {
      notificationNavigationService.unregisterForegroundHandler();
    };
  }, []);

  return <RootNavigator />;
};

export default App;

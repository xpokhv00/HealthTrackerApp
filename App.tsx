import React, {useEffect} from 'react';
import {AppState} from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import {syncAllWidgets} from './src/services/widgetSync';
import {useAppointmentStore} from './src/store/appointmentStore';
import {useMedicationStore} from './src/store/medicationStore';
import {processPendingWidgetActions} from './src/services/processPendingWidgetActions';
import {notificationService} from './src/services/notificationService';
import {syncRoutineMedicationReminders} from './src/services/medicationReminderSync';
import {notificationNavigationService} from './src/services/notificationNavigation';
import {syncTodayRoutineDoseSlots} from './src/services/syncRoutineDoseSlots';


const App = () => {
  useEffect(() => {
    const setup = async () => {
      await notificationService.init();

      await processPendingWidgetActions();
      syncTodayRoutineDoseSlots();

      const medications = useMedicationStore.getState().medications;
      const appointments = useAppointmentStore.getState().appointments;

      await syncRoutineMedicationReminders(medications);
      await syncAllWidgets({
        medications,
        appointments,
      });

      notificationNavigationService.registerForegroundHandler();
      await notificationNavigationService.handleInitialNotification();



    };

    setup();

    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        await processPendingWidgetActions();
        syncTodayRoutineDoseSlots();

        const medications = useMedicationStore.getState().medications;
        const appointments = useAppointmentStore.getState().appointments;

        await syncRoutineMedicationReminders(medications);
        await syncAllWidgets({
          medications,
          appointments,
        });
      }
    });

    return () => {
      notificationNavigationService.unregisterForegroundHandler();
      sub.remove();
    };
  }, []);

  return <RootNavigator />;
};

export default App;

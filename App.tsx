import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {notificationService} from './src/services/notificationService';
import {syncRoutineMedicationReminders} from './src/services/medicationReminderSync';
import {useMedicationStore} from './src/store/medicationStore';
import {notificationNavigationService} from './src/services/notificationNavigation';

const App = () => {
  useEffect(() => {
    const setup = async () => {
      await notificationService.init();

      const medications = useMedicationStore.getState().medications;
      await syncRoutineMedicationReminders(medications);

      notificationNavigationService.registerForegroundHandler();
      await notificationNavigationService.handleInitialNotification();
    };

    setup();

    return () => {
      notificationNavigationService.unregisterForegroundHandler();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
};

export default App;

import React, {useEffect} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RootNavigator from './src/navigation/RootNavigator';
import {loadSeedData} from './src/services/loadSeedData';
import {processPendingWidgetActions} from './src/services/processPendingWidgetActions';
import {notificationService} from './src/services/notificationService';
import {syncRoutineMedicationReminders} from './src/services/medicationReminderSync';
import {notificationNavigationService} from './src/services/notificationNavigation';
import {syncTodayRoutineDoseSlots} from './src/services/syncRoutineDoseSlots';
import {syncAllWidgets} from './src/services/widgetSync';
import {syncDailySummaryNotification} from './src/services/dailySummarySync';

import {useAppointmentStore} from './src/store/appointmentStore';
import {useMedicationStore} from './src/store/medicationStore';
import {useRoutineDoseStore} from './src/store/routineDoseStore';
import {useSymptomStore} from './src/store/symptomStore';

const DEFAULT_SEED_KEY = 'default-seed-loaded-v1';

const waitForStoresToHydrate = async () => {
  await Promise.all([
    useMedicationStore.persist.rehydrate(),
    useAppointmentStore.persist.rehydrate(),
    useSymptomStore.persist.rehydrate(),
    useRoutineDoseStore.persist.rehydrate(),
  ]);
};

const ensureDefaultSeedData = async () => {
  const alreadySeeded = await AsyncStorage.getItem(DEFAULT_SEED_KEY);

  const medications = useMedicationStore.getState().medications;
  const appointments = useAppointmentStore.getState().appointments;
  const symptoms = useSymptomStore.getState().symptoms;

  const storesAreEmpty =
    medications.length === 0 &&
    appointments.length === 0 &&
    symptoms.length === 0;

  if (!alreadySeeded && storesAreEmpty) {
    await loadSeedData();
    await AsyncStorage.setItem(DEFAULT_SEED_KEY, 'true');
  }
};

const App = () => {
  useEffect(() => {
    const setup = async () => {
      await waitForStoresToHydrate();
      await ensureDefaultSeedData();

      await notificationService.init();
      await processPendingWidgetActions();

      syncTodayRoutineDoseSlots();

      const medications = useMedicationStore.getState().medications;
      await syncRoutineMedicationReminders(medications);
      await syncDailySummaryNotification(medications);
      await syncAllWidgets();

      notificationNavigationService.registerForegroundHandler();
      await notificationNavigationService.handleInitialNotification();
    };

    setup();

    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        await processPendingWidgetActions();
        syncTodayRoutineDoseSlots();

        const medications = useMedicationStore.getState().medications;
        await syncRoutineMedicationReminders(medications);
        await syncDailySummaryNotification(medications);
        await syncAllWidgets();
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

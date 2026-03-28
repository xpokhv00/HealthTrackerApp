import notifee, {EventType, InitialNotification} from '@notifee/react-native';
import {navigateFromNotification} from '../navigation/navigationRef';
import {handleNotificationActionEvent} from './notificationQuickActions';

const handleNotificationOpen = (data?: Record<string, string>) => {
  if (!data) {
    navigateFromNotification('Tabs');
    return;
  }

  if (data.screen === 'MedicationDetail' && data.medicationId) {
    navigateFromNotification('MedicationDetail', {
      medicationId: data.medicationId,
    });
    return;
  }

  if (data.screen === 'AppointmentDetail' && data.appointmentId) {
    navigateFromNotification('AppointmentDetail', {
      appointmentId: data.appointmentId,
    });
    return;
  }

  if (data.screen === 'SymptomDetail' && data.symptomId) {
    navigateFromNotification('SymptomDetail', {
      symptomId: data.symptomId,
    });
    return;
  }

  navigateFromNotification('Tabs');
};

let foregroundUnsubscribe: undefined | (() => void);

export const notificationNavigationService = {
  registerForegroundHandler() {
    if (foregroundUnsubscribe) {
      return;
    }

    foregroundUnsubscribe = notifee.onForegroundEvent(async event => {
      const {type, detail} = event;

      if (type === EventType.ACTION_PRESS) {
        await handleNotificationActionEvent(event);
        return;
      }

      if (type === EventType.PRESS) {
        handleNotificationOpen(detail.notification?.data);
      }
    });
  },

  unregisterForegroundHandler() {
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe();
      foregroundUnsubscribe = undefined;
    }
  },

  async handleInitialNotification() {
    const initialNotification: InitialNotification | null =
      await notifee.getInitialNotification();

    if (!initialNotification) {
      return;
    }

    const actionId = initialNotification.pressAction?.id;

    if (actionId && actionId !== 'default') {
      await handleNotificationActionEvent({
        type: EventType.ACTION_PRESS,
        detail: {
          notification: initialNotification.notification,
          pressAction: initialNotification.pressAction,
          input: initialNotification.input,
        },
      } as any);
      return;
    }

    handleNotificationOpen(initialNotification.notification?.data);
  },
};

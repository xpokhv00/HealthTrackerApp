import notifee, {Event, EventType} from '@notifee/react-native';
import {NOTIFICATION_ACTIONS} from '../constants/notificationActions';
import {useMedicationStore} from '../store/medicationStore';
import {navigateFromNotification} from '../navigation/navigationRef';
import {notificationService} from './notificationService';
import {getMedicationSnoozeNotificationId} from '../utils/medicationNotifications';

const handleMarkAsTaken = async (medicationId?: string) => {
  if (!medicationId) {
    return;
  }

  const store = useMedicationStore.getState();
  const medication = store.getMedicationById(medicationId);

  if (!medication) {
    return;
  }

  store.markMedicationTaken(medicationId);

  await notifee.displayNotification({
    title: 'Medication logged',
    body: `${medication.name} was marked as taken.`,
    android: {
      channelId: 'medication-reminders',
      pressAction: {
        id: 'default',
      },
    },
    data: {
      screen: 'MedicationDetail',
      medicationId,
      entityType: 'medication',
    },
  });

  await notificationService.cancelMedicationReminder(
    getMedicationSnoozeNotificationId(medicationId),
  );

};

const handleSnooze10Min = async (medicationId?: string) => {
  if (!medicationId) {
    return;
  }

  const store = useMedicationStore.getState();
  const medication = store.getMedicationById(medicationId);

  if (!medication) {
    return;
  }

  const snoozeTime = Date.now() + 10 * 60 * 1000;

  await notificationService.cancelMedicationReminder(
    getMedicationSnoozeNotificationId(medicationId),
  );

  await notificationService.scheduleOneTimeMedicationSnooze({
    notificationId: getMedicationSnoozeNotificationId(medicationId),
    title: `Snoozed: ${medication.name}`,
    body: `Reminder again in 10 minutes for ${medication.dosage}${medication.form ? ` (${medication.form})` : ''}.`,
    timestamp: snoozeTime,
    medicationId,
  });
};

const handleOpenMedication = (medicationId?: string) => {
  if (!medicationId) {
    return;
  }

  navigateFromNotification('MedicationDetail', {
    medicationId,
  });
};

export const handleNotificationActionEvent = async (event: Event) => {
  const {type, detail} = event;

  if (type !== EventType.ACTION_PRESS) {
    return;
  }

  const actionId = detail.pressAction?.id;
  const medicationId = detail.notification?.data?.medicationId;

  if (actionId === NOTIFICATION_ACTIONS.MARK_AS_TAKEN) {
    await handleMarkAsTaken(medicationId);
    return;
  }

  if (actionId === NOTIFICATION_ACTIONS.SNOOZE_10_MIN) {
    await handleSnooze10Min(medicationId);
    return;
  }

  if (actionId === NOTIFICATION_ACTIONS.OPEN_MEDICATION) {
    handleOpenMedication(medicationId);
  }
};

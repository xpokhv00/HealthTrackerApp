import notifee, {Event, EventType} from '@notifee/react-native';
import {NOTIFICATION_ACTIONS} from '../constants/notificationActions';
import {useMedicationStore} from '../store/medicationStore';
import {navigateFromNotification} from '../navigation/navigationRef';
import {notificationService} from './notificationService';
import {getMedicationSnoozeNotificationId} from '../utils/medicationNotifications';
import {
  hasReachedDailyLimit,
  isMedicationAvailableNow,
} from '../utils/medication';
import {markNextRoutineDoseTaken} from './markNextRoutineDoseTaken';
import {syncAllWidgets} from './widgetSync';

const showFeedbackNotification = async (title: string, body: string, medicationId?: string) => {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'medication-reminders',
      pressAction: {
        id: 'default',
      },
    },
    data: medicationId
      ? {
        screen: 'MedicationDetail',
        medicationId,
        entityType: 'medication',
      }
      : undefined,
  });
};

const handleMarkAsTaken = async (medicationId?: string) => {
  if (!medicationId) {
    return;
  }

  const store = useMedicationStore.getState();
  const medication = store.getMedicationById(medicationId);

  if (!medication) {
    return;
  }

  if (medication.type === 'routine') {
    await Promise.resolve(markNextRoutineDoseTaken(medicationId));
  } else {
    const availableNow = isMedicationAvailableNow(medication);
    const dailyLimitReached = hasReachedDailyLimit(medication);

    if (dailyLimitReached) {
      await showFeedbackNotification(
        'Dose not logged',
        `You have already reached the daily limit for ${medication.name}.`,
        medicationId,
      );
      return;
    }

    if (!availableNow) {
      await showFeedbackNotification(
        'Dose not logged',
        `${medication.name} is not available yet.`,
        medicationId,
      );
      return;
    }

    store.markMedicationTaken(medicationId);
  }

  await notificationService.cancelMedicationReminder(
    getMedicationSnoozeNotificationId(medicationId),
  );

  await syncAllWidgets();

  await showFeedbackNotification(
    'Medication logged',
    `${medication.name} was marked as taken.`,
    medicationId,
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
    body: `Reminder again in 10 minutes for ${medication.dosage}${
      medication.form ? ` (${medication.form})` : ''
    }.`,
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
  const actionId = detail.pressAction?.id;
  const medicationId = detail.notification?.data?.medicationId;

  if (type === EventType.PRESS) {
    handleOpenMedication(medicationId);
    return;
  }

  if (type !== EventType.ACTION_PRESS) {
    return;
  }

  if (actionId === NOTIFICATION_ACTIONS.MARK_AS_TAKEN) {
    await handleMarkAsTaken(medicationId);
    return;
  }

  if (actionId === NOTIFICATION_ACTIONS.SNOOZE_10_MIN) {
    await handleSnooze10Min(medicationId);
    return;
  }

  if (
    actionId === NOTIFICATION_ACTIONS.OPEN_MEDICATION ||
    actionId === 'default'
  ) {
    handleOpenMedication(medicationId);
  }
};

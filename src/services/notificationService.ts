import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

const CHANNELS = {
  medication: 'medication-reminders',
  appointment: 'appointment-reminders',
};

import {AndroidLaunchActivityFlag} from '@notifee/react-native';
import {NOTIFICATION_ACTIONS} from '../constants/notificationActions';

type NotificationData = Record<string, string>;

export const notificationService = {
  async requestPermission() {
    await notifee.requestPermission();
  },

  async createChannels() {
    await notifee.createChannel({
      id: CHANNELS.medication,
      name: 'Medication reminders',
      importance: AndroidImportance.HIGH,
    });

    await notifee.createChannel({
      id: CHANNELS.appointment,
      name: 'Appointment reminders',
      importance: AndroidImportance.HIGH,
    });
  },

  async init() {
    await this.requestPermission();
    await this.createChannels();
  },

  async showInstantTestNotification() {
    await notifee.displayNotification({
      title: 'Health app ready',
      body: 'Notifications are working.',
      android: {
        channelId: CHANNELS.medication,
        pressAction: {
          id: 'default',
        },
      },
      data: {
        screen: 'Home',
      },
    });
  },

  async scheduleRepeatingMedicationReminder(params: {
    notificationId: string;
    title: string;
    body: string;
    timestamp: number;
    medicationId: string;
  }) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: params.timestamp,
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const data: NotificationData = {
      entityType: 'medication',
      medicationId: params.medicationId,
      screen: 'MedicationDetail',
    };

    await notifee.createTriggerNotification(
      {
        id: params.notificationId,
        title: params.title,
        body: params.body,
        data,
        android: {
          channelId: CHANNELS.medication,
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'Mark as taken',
              pressAction: {
                id: NOTIFICATION_ACTIONS.MARK_AS_TAKEN,
              },
            },
            {
              title: 'Snooze 10 min',
              pressAction: {
                id: NOTIFICATION_ACTIONS.SNOOZE_10_MIN,
              },
            },
            {
              title: 'Open',
              pressAction: {
                id: NOTIFICATION_ACTIONS.OPEN_MEDICATION,
                launchActivity: 'default',
                launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
              },
            },
          ],
        },
      },
      trigger,
    );
  },

  async scheduleAppointmentReminder(params: {
    id: string;
    title: string;
    body: string;
    timestamp: number;
    appointmentId: string;
  }) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: params.timestamp,
    };

    const data: NotificationData = {
      entityType: 'appointment',
      appointmentId: params.appointmentId,
      screen: 'AppointmentDetail',
    };

    await notifee.createTriggerNotification(
      {
        id: `appointment-${params.id}`,
        title: params.title,
        body: params.body,
        data,
        android: {
          channelId: CHANNELS.appointment,
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger,
    );
  },

  async cancelMedicationReminder(notificationId: string) {
    await notifee.cancelNotification(notificationId);
  },

  async cancelMedicationRemindersByMedicationId(medicationId: string) {
    const triggerIds = await notifee.getTriggerNotificationIds();
    const prefix = `medication-${medicationId}-`;

    const idsToCancel = triggerIds.filter(id => id.startsWith(prefix));

    await Promise.all(idsToCancel.map(id => notifee.cancelNotification(id)));
  },

  async cancelAppointmentReminder(id: string) {
    await notifee.cancelNotification(`appointment-${id}`);
  },

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  },

  async scheduleOneTimeMedicationSnooze(params: {
    notificationId: string;
    title: string;
    body: string;
    timestamp: number;
    medicationId: string;
  }) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: params.timestamp,
    };

    const data: NotificationData = {
      entityType: 'medication',
      medicationId: params.medicationId,
      screen: 'MedicationDetail',
      snoozed: 'true',
    };

    await notifee.createTriggerNotification(
      {
        id: params.notificationId,
        title: params.title,
        body: params.body,
        data,
        android: {
          channelId: CHANNELS.medication,
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'Mark as taken',
              pressAction: {
                id: NOTIFICATION_ACTIONS.MARK_AS_TAKEN,
              },
            },
            {
              title: 'Snooze 10 min',
              pressAction: {
                id: NOTIFICATION_ACTIONS.SNOOZE_10_MIN,
              },
            },
            {
              title: 'Open',
              pressAction: {
                id: NOTIFICATION_ACTIONS.OPEN_MEDICATION,
                launchActivity: 'default',
                launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
              },
            },
          ],
        },
      },
      trigger,
    );
  }
};

import {Medication} from '../types/medication';
import {notificationService} from './notificationService';
import {
  getRoutineReminderDates,
  getRoutineReminderNotificationId,
} from '../utils/medicationNotifications';

const buildMedicationReminderBody = (medication: Medication) =>
  `Time to take ${medication.dosage}${
    medication.form ? ` (${medication.form})` : ''
  }.`;

export const syncRoutineMedicationReminders = async (
  medications: Medication[],
) => {
  const routineMedications = medications.filter(
    item => item.type === 'routine',
  );

  for (const medication of routineMedications) {
    await notificationService.cancelMedicationRemindersByMedicationId(
      medication.id,
    );

    if (!medication.isActive || !medication.scheduledTimes?.length) {
      continue;
    }

    for (const time of medication.scheduledTimes) {
      const reminderDate = getRoutineReminderDates({
        ...medication,
        scheduledTimes: [time],
      })[0];

      if (!reminderDate) {
        continue;
      }

      const commonParams = {
        notificationId: getRoutineReminderNotificationId(medication.id, time),
        title: `Medication reminder: ${medication.name}`,
        body: buildMedicationReminderBody(medication),
        timestamp: reminderDate.getTime(),
        medicationId: medication.id,
      };

      if (medication.frequencyType === 'interval_days') {
        await notificationService.scheduleOneTimeMedicationReminder(
          commonParams,
        );
      } else {
        await notificationService.scheduleRepeatingMedicationReminder(
          commonParams,
        );
      }
    }
  }
};

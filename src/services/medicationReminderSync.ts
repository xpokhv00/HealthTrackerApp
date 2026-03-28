import {Medication} from '../types/medication';
import {notificationService} from './notificationService';
import {
  getRoutineReminderDates,
  getRoutineReminderNotificationId,
} from '../utils/medicationNotifications';

export const syncRoutineMedicationReminders = async (
  medications: Medication[],
) => {
  const routineMedications = medications.filter(
    item => item.isActive && item.type === 'routine' && item.scheduledTimes?.length,
  );

  for (const medication of routineMedications) {
    await notificationService.cancelMedicationRemindersByMedicationId(
      medication.id,
    );

    for (const time of medication.scheduledTimes ?? []) {
      const reminderDate = getRoutineReminderDates({
        ...medication,
        scheduledTimes: [time],
      })[0];

      if (!reminderDate) {
        continue;
      }

      await notificationService.scheduleRepeatingMedicationReminder({
        notificationId: getRoutineReminderNotificationId(medication.id, time),
        title: `Medication reminder: ${medication.name}`,
        body: `Time to take ${medication.dosage}${medication.form ? ` (${medication.form})` : ''}.`,
        timestamp: reminderDate.getTime(),
        medicationId: medication.id,
      });
    }
  }
};

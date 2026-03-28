import {Medication} from '../types/medication.ts';

const formatNextTime = (time?: string) => {
  if (!time) {
    return 'No next time';
  }

  return `Today at ${time}`;
};

export const getMedicationForWidget = (medications: Medication[]) => {
  const routine = medications.find(
    item =>
      item.isActive &&
      item.type === 'routine' &&
      item.scheduledTimes &&
      item.scheduledTimes.length > 0,
  );

  if (!routine) {
    return null;
  }

  return {
    name: routine.name,
    dosage: `${routine.dosage}${routine.form ? ` • ${routine.form}` : ''}`,
    nextTime: formatNextTime(routine.scheduledTimes?.[0]),
  };
};

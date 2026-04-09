import {Medication} from '../types/medication';
import {notificationService} from './notificationService';

const DAILY_SUMMARY_ID = 'daily-medication-summary';

const getNext7amTimestamp = (): number => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime();
};

const buildSummaryBody = (medications: Medication[]): string => {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const routineMeds = medications.filter(
    item =>
      item.isActive &&
      item.type === 'routine' &&
      item.scheduledTimes &&
      item.scheduledTimes.length > 0 &&
      new Date(item.startDate) <= today &&
      (!item.endDate || new Date(item.endDate) >= today),
  );

  const asNeededMeds = medications.filter(
    item =>
      item.isActive &&
      item.type === 'as_needed' &&
      new Date(item.startDate) <= today &&
      (!item.endDate || new Date(item.endDate) >= today),
  );

  if (routineMeds.length === 0 && asNeededMeds.length === 0) {
    return 'No medications scheduled for today.';
  }

  const parts: string[] = [];

  if (routineMeds.length > 0) {
    const names = routineMeds
      .map(m => {
        const times = m.scheduledTimes?.join(', ') ?? '';
        return `${m.name} (${times})`;
      })
      .join(', ');
    parts.push(names);
  }

  if (asNeededMeds.length > 0) {
    const names = asNeededMeds.map(m => `${m.name} as needed`).join(', ');
    parts.push(names);
  }

  return parts.join('; ');
};

export const syncDailySummaryNotification = async (
  medications: Medication[],
) => {
  const body = buildSummaryBody(medications);
  const timestamp = getNext7amTimestamp();

  await notificationService.scheduleDailySummaryNotification({
    notificationId: DAILY_SUMMARY_ID,
    title: "Today's medications",
    body,
    timestamp,
  });
};

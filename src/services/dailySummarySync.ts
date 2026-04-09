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

const buildSummaryBody = (medications: Medication[]): {body: string; bigText: string} => {
  const today = new Date();

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
    return {
      body: 'No medications scheduled for today.',
      bigText: 'No medications scheduled for today.',
    };
  }

  // Collapsed single-line body — just a count
  const total = routineMeds.length + asNeededMeds.length;
  const body = total === 1 ? '1 medication today' : `${total} medications today`;

  // Expanded HTML bigText
  const lines: string[] = [];

  if (routineMeds.length > 0) {
    lines.push('<b>Routine</b>');
    routineMeds.forEach(m => {
      const times = m.scheduledTimes?.join(', ') ?? '';
      const who = m.patientName ? ` <i>(${m.patientName})</i>` : '';
      const dose = m.dosage ? ` — ${m.dosage}` : '';
      lines.push(`&nbsp;&nbsp;• <b>${m.name}</b>${dose}${who}`);
      if (times) {
        lines.push(`&nbsp;&nbsp;&nbsp;&nbsp;🕐 ${times}`);
      }
    });
  }

  if (asNeededMeds.length > 0) {
    if (lines.length > 0) {lines.push('');}
    lines.push('<b>As needed</b>');
    asNeededMeds.forEach(m => {
      const who = m.patientName ? ` <i>(${m.patientName})</i>` : '';
      const dose = m.dosage ? ` — ${m.dosage}` : '';
      lines.push(`&nbsp;&nbsp;• <b>${m.name}</b>${dose}${who}`);
    });
  }

  return {body, bigText: lines.join('<br>')};
};

export const syncDailySummaryNotification = async (
  medications: Medication[],
) => {
  const {body, bigText} = buildSummaryBody(medications);
  const timestamp = getNext7amTimestamp();

  await notificationService.scheduleDailySummaryNotification({
    notificationId: DAILY_SUMMARY_ID,
    title: "Today's medications",
    body,
    bigText,
    timestamp,
  });
};

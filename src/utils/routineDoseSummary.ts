import {RoutineDoseSlot} from '../types/routineDose';
import {toDateKey} from './dateHelpers';

const isTaken = (status: RoutineDoseSlot['status']) =>
  status === 'taken_on_time' || status === 'taken_late';

export const getTodayRoutineDoseSummary = (
  slots: RoutineDoseSlot[],
  targetDate: Date = new Date(),
) => {
  const dateKey = toDateKey(targetDate);

  const todaySlots = slots
    .filter(slot => slot.date === dateKey)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const total = todaySlots.length;
  const taken = todaySlots.filter(slot => isTaken(slot.status)).length;

  // For Home UX, treat both pending and missed as "remaining attention"
  const remaining = Math.max(0, total - taken);

  const overdue = todaySlots.filter(slot => slot.status === 'missed');
  const upcoming = todaySlots.filter(slot => slot.status === 'pending');

  const percent = total === 0 ? 0 : Math.round((taken / total) * 100);

  // Prefer next upcoming dose. If none exists, but overdue doses exist, surface the earliest overdue one.
  const nextActionable =
    upcoming[0] ??
    overdue.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0] ??
    null;

  return {
    total,
    taken,
    remaining,
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
    percent,
    nextActionable,
  };
};

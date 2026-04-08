import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {
  AsNeededWidgetItem,
  AppointmentWidgetData,
  RoutineWidgetItem,
} from '../native/healthWidgets';
import {isRoutineMedicationDueToday} from './routineSchedule';
import {useRoutineDoseStore} from '../store/routineDoseStore';
import {toDateKey} from './dateHelpers';
import {RoutineDoseSlot} from '../types/routineDose';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const parseTimeToday = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h || 0, m || 0, 0, 0);
  return date;
};

const formatRemaining = (minutes: number) => {
  if (minutes <= 0) {
    return 'Available now';
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) {
    return `Available in ${h}h ${m}m`;
  }

  return `Available in ${m}m`;
};

const normalizeRoutineStatus = (
  status: RoutineDoseSlot['status'],
): 'pending' | 'missed' | 'taken' => {
  if (status === 'taken_on_time' || status === 'taken_late') {
    return 'taken';
  }

  return status;
};

const getFallbackRoutineStatus = (
  scheduledTime: string,
): 'pending' | 'missed' => {
  const now = new Date();
  const scheduled = parseTimeToday(scheduledTime);

  return now.getTime() > scheduled.getTime() ? 'missed' : 'pending';
};

export const buildRoutineWidgetItems = (
  medications: Medication[],
): RoutineWidgetItem[] => {
  const today = new Date();
  const todayKey = toDateKey(today);
  const routineSlots = useRoutineDoseStore.getState().slots;

  const dueRoutineMeds = medications.filter(
    item =>
      item.isActive &&
      item.type === 'routine' &&
      isRoutineMedicationDueToday(item, today) &&
      item.scheduledTimes &&
      item.scheduledTimes.length > 0,
  );

  const activeMedicationIds = new Set(dueRoutineMeds.map(item => item.id));

  const todaysSlots = routineSlots.filter(
    slot => slot.date === todayKey && activeMedicationIds.has(slot.medicationId),
  );

  const slotMap = new Map<string, RoutineDoseSlot>();
  todaysSlots.forEach(slot => {
    slotMap.set(`${slot.medicationId}_${slot.scheduledTime}`, slot);
  });

  const items: RoutineWidgetItem[] = [];

  dueRoutineMeds.forEach(med => {
    (med.scheduledTimes ?? []).forEach(time => {
      const matchingSlot = slotMap.get(`${med.id}_${time}`);

      const slotId = matchingSlot
        ? matchingSlot.id
        : `${med.id}_${todayKey}_${time}`;

      items.push({
        id: slotId,
        name: med.name,
        dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
        time,
        status: matchingSlot
          ? normalizeRoutineStatus(matchingSlot.status)
          : getFallbackRoutineStatus(time),
      });
    });
  });

  const order = {
    missed: 0,
    pending: 1,
    taken: 2,
  };

  return items.sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }

    return a.time.localeCompare(b.time);
  });
};

export const buildAsNeededWidgetItems = (
  medications: Medication[],
): AsNeededWidgetItem[] => {
  const now = new Date();

  return medications
    .filter(item => item.isActive && item.type === 'as_needed')
    .map(med => {
      const takenToday = med.takenHistory
        .map(item => new Date(item))
        .filter(item => isSameDay(item, now)).length;

      if (med.maxDailyDoses && takenToday >= med.maxDailyDoses) {
        return {
          id: med.id,
          name: med.name,
          dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
          available: false,
          availableInText: 'Daily limit reached',
          _sortRank: 2,
          _sortValue: Number.MAX_SAFE_INTEGER,
        };
      }

      if (!med.lastTakenAt || !med.minHoursBetweenDoses) {
        return {
          id: med.id,
          name: med.name,
          dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
          available: true,
          availableInText: 'Available now',
          _sortRank: 0,
          _sortValue: 0,
        };
      }

      const nextAllowed =
        new Date(med.lastTakenAt).getTime() +
        med.minHoursBetweenDoses * 60 * 60 * 1000;

      const remainingMinutes = Math.ceil(
        (nextAllowed - now.getTime()) / (1000 * 60),
      );

      return {
        id: med.id,
        name: med.name,
        dosage: `${med.dosage}${med.form ? ` • ${med.form}` : ''}`,
        available: remainingMinutes <= 0,
        availableInText: formatRemaining(remainingMinutes),
        _sortRank: remainingMinutes <= 0 ? 0 : 1,
        _sortValue: Math.max(remainingMinutes, 0),
      };
    })
    .sort((a, b) => {
      if (a._sortRank !== b._sortRank) {
        return a._sortRank - b._sortRank;
      }

      if (a._sortValue !== b._sortValue) {
        return a._sortValue - b._sortValue;
      }

      return a.name.localeCompare(b.name);
    })
    .map(({_sortRank, _sortValue, ...item}) => item);
};

export const buildAppointmentWidgetData = (
  appointments: Appointment[],
): AppointmentWidgetData | null => {
  const now = Date.now();

  const next = appointments
    .filter(item => new Date(item.dateTime).getTime() >= now)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    )[0];

  if (!next) {
    return null;
  }

  const date = new Date(next.dateTime);

  return {
    title: next.visitType,
    doctor: next.doctorName,
    specialty: next.specialty,
    dayOfWeek: date.toLocaleDateString(undefined, {weekday: 'long'}),
    dateTimeText: `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    recommendations: next.preparation.slice(0, 3),
  };
};

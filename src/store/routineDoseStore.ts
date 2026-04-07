import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RoutineDoseSlot} from '../types/routineDose';
import {toDateKey, parseTimeToDate} from '../utils/dateHelpers';

interface RoutineDoseStore {
  slots: RoutineDoseSlot[];

  upsertSlotsForDay: (newSlots: RoutineDoseSlot[]) => void;
  markSlotTaken: (slotId: string) => void;
  markMissedSlotsForToday: () => void;
  getSlotsForDate: (dateKey: string) => RoutineDoseSlot[];
  clearAllSlots: () => void;
}

const mergeSlots = (
  existing: RoutineDoseSlot[],
  incoming: RoutineDoseSlot[],
): RoutineDoseSlot[] => {
  const map = new Map(existing.map(slot => [slot.id, slot]));

  incoming.forEach(slot => {
    if (!map.has(slot.id)) {
      map.set(slot.id, slot);
    }
  });

  return Array.from(map.values());
};

export const useRoutineDoseStore = create<RoutineDoseStore>()(
  persist(
    (set, get) => ({
      slots: [],

      upsertSlotsForDay: newSlots =>
        set(state => ({
          slots: mergeSlots(state.slots, newSlots),
        })),

      markSlotTaken: slotId =>
        set(state => {
          const now = new Date();
          return {
            slots: state.slots.map(slot => {
              if (slot.id !== slotId) {
                return slot;
              }

              const scheduled = parseTimeToDate(now, slot.scheduledTime);
              const lateThreshold = scheduled.getTime() + 60 * 60 * 1000;

              const status =
                now.getTime() <= lateThreshold
                  ? 'taken_on_time'
                  : 'taken_late';

              return {
                ...slot,
                status,
                takenAt: now.toISOString(),
              };
            }),
          };
        }),

      markMissedSlotsForToday: () =>
        set(state => {
          const now = new Date();
          const todayKey = toDateKey(now);

          return {
            slots: state.slots.map(slot => {
              if (slot.date !== todayKey || slot.status !== 'pending') {
                return slot;
              }

              const scheduled = parseTimeToDate(now, slot.scheduledTime);

              if (now.getTime() > scheduled.getTime()) {
                return {
                  ...slot,
                  status: 'missed',
                };
              }

              return slot;
            }),
          };
        }),

      getSlotsForDate: dateKey =>
        get().slots.filter(slot => slot.date === dateKey),

      clearAllSlots: () => set({slots: []}),
    }),
    {
      name: 'routine-dose-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

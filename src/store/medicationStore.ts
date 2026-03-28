import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Medication} from '../types/medication';

interface MedicationStore {
  medications: Medication[];
  addMedication: (medication: Medication) => void;
  updateMedication: (updatedMedication: Medication) => void;
  removeMedication: (id: string) => void;
  markMedicationTaken: (id: string) => void;
  getMedicationById: (id: string) => Medication | undefined;
  clearAll: () => void;
}

export const useMedicationStore = create<MedicationStore>()(
  persist(
    (set, get) => ({
      medications: [],

      addMedication: medication =>
        set(state => ({
          medications: [medication, ...state.medications],
        })),

      updateMedication: updatedMedication =>
        set(state => ({
          medications: state.medications.map(item =>
            item.id === updatedMedication.id ? updatedMedication : item,
          ),
        })),

      removeMedication: id =>
        set(state => ({
          medications: state.medications.filter(item => item.id !== id),
        })),

      markMedicationTaken: id =>
        set(state => {
          const now = new Date().toISOString();

          return {
            medications: state.medications.map(item => {
              if (item.id !== id) {
                return item;
              }

              return {
                ...item,
                lastTakenAt: now,
                takenHistory: [now, ...item.takenHistory],
              };
            }),
          };
        }),

      getMedicationById: id => get().medications.find(item => item.id === id),

      clearAll: () => set({medications: []}),
    }),
    {
      name: 'medication-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

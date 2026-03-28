import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SymptomEntry} from '../types/symptom';

interface SymptomStore {
  symptoms: SymptomEntry[];
  addSymptom: (symptom: SymptomEntry) => void;
  updateSymptom: (updatedSymptom: SymptomEntry) => void;
  removeSymptom: (id: string) => void;
  getSymptomById: (id: string) => SymptomEntry | undefined;
  clearAllSymptoms: () => void;
}

export const useSymptomStore = create<SymptomStore>()(
  persist(
    (set, get) => ({
      symptoms: [],

      addSymptom: symptom =>
        set(state => ({
          symptoms: [symptom, ...state.symptoms].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        })),

      updateSymptom: updatedSymptom =>
        set(state => ({
          symptoms: state.symptoms
            .map(item => (item.id === updatedSymptom.id ? updatedSymptom : item))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
        })),

      removeSymptom: id =>
        set(state => ({
          symptoms: state.symptoms.filter(item => item.id !== id),
        })),

      getSymptomById: id => get().symptoms.find(item => item.id === id),

      clearAllSymptoms: () => set({symptoms: []}),
    }),
    {
      name: 'symptom-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

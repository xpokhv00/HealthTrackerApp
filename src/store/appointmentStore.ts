import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appointment} from '../types/appointment';

interface AppointmentStore {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (updatedAppointment: Appointment) => void;
  removeAppointment: (id: string) => void;
  getAppointmentById: (id: string) => Appointment | undefined;
  clearAllAppointments: () => void;
}

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: appointment =>
        set(state => ({
          appointments: [...state.appointments, appointment].sort(
            (a, b) =>
              new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
          ),
        })),

      updateAppointment: updatedAppointment =>
        set(state => ({
          appointments: state.appointments
            .map(item =>
              item.id === updatedAppointment.id ? updatedAppointment : item,
            )
            .sort(
              (a, b) =>
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
            ),
        })),

      removeAppointment: id =>
        set(state => ({
          appointments: state.appointments.filter(item => item.id !== id),
        })),

      getAppointmentById: id =>
        get().appointments.find(item => item.id === id),

      clearAllAppointments: () => set({appointments: []}),
    }),
    {
      name: 'appointment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

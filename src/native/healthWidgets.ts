import {NativeModules, Platform} from 'react-native';
import {WidgetAction} from '../types/widgetActions';

const {HealthWidgetsModule} = NativeModules;

export type RoutineWidgetItem = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: 'pending' | 'missed' | 'taken';
  scheduleProgress: number;
};

export type AsNeededWidgetItem = {
  id: string;
  name: string;
  dosage: string;
  available: boolean;
  availableInText: string;
  cooldownProgress: number;
};

export type AppointmentWidgetData = {
  title: string;
  doctor: string;
  specialty: string;
  dayOfWeek: string;
  dateTimeText: string;
  recommendations: string[];
};

const noop = async () => {};

export const syncRoutineWidget =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async (items: RoutineWidgetItem[]) =>
      HealthWidgetsModule.updateRoutineWidget(items)
    : noop;

export const syncAsNeededWidget =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async (items: AsNeededWidgetItem[]) =>
      HealthWidgetsModule.updateAsNeededWidget(items)
    : noop;

export const syncAppointmentWidget =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async (data: AppointmentWidgetData | null) =>
      HealthWidgetsModule.updateAppointmentWidget(data)
    : noop;

export const clearAllWidgets =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async () => HealthWidgetsModule.clearAllWidgets()
    : noop;

export const getPendingWidgetActions =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async (): Promise<WidgetAction[]> => {
      const actions = await HealthWidgetsModule.getPendingWidgetActions();
      return Array.isArray(actions) ? actions : [];
    }
    : async () => [];

export const clearPendingWidgetActions =
  Platform.OS === 'android' && HealthWidgetsModule
    ? async () => HealthWidgetsModule.clearPendingWidgetActions()
    : noop;

export type MedicationType = 'routine' | 'as_needed';
export type RoutineFrequencyType = 'daily' | 'interval_days';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form?: string;
  type: MedicationType;

  frequencyType?: RoutineFrequencyType;

  timesPerDay?: number;
  scheduledTimes?: string[];

  intervalDays?: number;

  minHoursBetweenDoses?: number;
  maxDailyDoses?: number;

  notes?: string;
  startDate: string;
  endDate?: string;

  lastTakenAt?: string;
  takenHistory: string[];
  isActive: boolean;
}

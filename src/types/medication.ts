export type MedicationType = 'routine' | 'as_needed';
export type RoutineFrequencyType = 'daily' | 'interval_days';

export interface Medication {
  id: string;
  patientName?: string;
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

  purpose?: string;
  usageInstructions?: string;
  startDate: string;
  endDate?: string;

  lastTakenAt?: string;
  takenHistory: string[];
  isActive: boolean;
}

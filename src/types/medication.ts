export type MedicationType = 'routine' | 'as_needed';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form?: string;
  type: MedicationType;

  timesPerDay?: number;
  scheduledTimes?: string[];

  minHoursBetweenDoses?: number;
  maxDailyDoses?: number;

  notes?: string;
  startDate: string;
  endDate?: string;

  lastTakenAt?: string;
  takenHistory: string[];
  isActive: boolean;
}

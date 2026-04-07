export type RoutineDoseStatus =
  | 'pending'
  | 'taken_on_time'
  | 'taken_late'
  | 'missed';

export interface RoutineDoseSlot {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: RoutineDoseStatus;
  takenAt?: string;
}

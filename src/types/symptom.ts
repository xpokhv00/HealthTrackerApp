export type SymptomCategory =
  | 'Pain'
  | 'Respiratory'
  | 'Digestive'
  | 'Mood'
  | 'Energy'
  | 'Skin'
  | 'Other';

export interface SymptomEntry {
  id: string;
  patientName?: string;
  symptom: string;
  severity: number;
  note?: string;
  category?: SymptomCategory;
  triggers?: string[];
  createdAt: string;
}

import {SymptomEntry} from '../types/symptom';
import {getCategoryForSymptom} from '../utils/symptom';

const now = new Date();

const hoursAgo = (hours: number) => {
  const d = new Date(now);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

export const seedSymptoms: SymptomEntry[] = [
  {
    id: 'sym-1',
    symptom: 'Fatigue',
    severity: 6,
    category: getCategoryForSymptom('Fatigue'),
    note: 'Feeling unusually tired since the afternoon, even after sleeping well.',
    createdAt: hoursAgo(6),
  },
  {
    id: 'sym-2',
    symptom: 'Headache',
    severity: 5,
    category: getCategoryForSymptom('Headache'),
    note: 'Mild pressure around forehead after long screen time.',
    createdAt: hoursAgo(12),
  },
  {
    id: 'sym-3',
    symptom: 'Dry eyes',
    severity: 4,
    category: getCategoryForSymptom('Dry eyes'),
    note: 'Eyes feel irritated in the evening after studying.',
    createdAt: hoursAgo(18),
  },
  {
    id: 'sym-4',
    symptom: 'Sore throat',
    severity: 6,
    category: getCategoryForSymptom('Sore throat'),
    note: 'Worse in the morning, improves after warm drinks.',
    createdAt: hoursAgo(24),
  },
  {
    id: 'sym-5',
    symptom: 'Nasal congestion',
    severity: 7,
    category: getCategoryForSymptom('Nasal congestion'),
    note: 'Blocked nose mostly at night, used nasal spray once.',
    createdAt: hoursAgo(30),
  },
  {
    id: 'sym-6',
    symptom: 'Cough',
    severity: 5,
    category: getCategoryForSymptom('Cough'),
    note: 'Dry cough, more noticeable in cold air.',
    createdAt: hoursAgo(36),
  },
  {
    id: 'sym-7',
    symptom: 'Headache',
    severity: 7,
    category: getCategoryForSymptom('Headache'),
    note: 'Stronger headache after sports training and poor hydration.',
    createdAt: hoursAgo(48),
  },
  {
    id: 'sym-8',
    symptom: 'Eye irritation',
    severity: 3,
    category: getCategoryForSymptom('Eye irritation'),
    note: 'Improved after using eye drops.',
    createdAt: hoursAgo(60),
  },
  {
    id: 'sym-9',
    symptom: 'Fatigue',
    severity: 5,
    category: getCategoryForSymptom('Fatigue'),
    note: 'Low energy in the morning before breakfast.',
    createdAt: hoursAgo(72),
  },
  {
    id: 'sym-10',
    symptom: 'Stomach pain',
    severity: 4,
    category: getCategoryForSymptom('Stomach pain'),
    note: 'Mild discomfort after eating too quickly.',
    createdAt: hoursAgo(84),
  },
  {
    id: 'sym-11',
    symptom: 'Sore throat',
    severity: 7,
    category: getCategoryForSymptom('Sore throat'),
    note: 'Throat pain during swallowing, lasted most of the day.',
    createdAt: hoursAgo(96),
  },
  {
    id: 'sym-12',
    symptom: 'Nasal congestion',
    severity: 6,
    category: getCategoryForSymptom('Nasal congestion'),
    note: 'More comfortable after saline rinse.',
    createdAt: hoursAgo(108),
  },
  {
    id: 'sym-13',
    symptom: 'Cough',
    severity: 4,
    category: getCategoryForSymptom('Cough'),
    note: 'Only occasional coughing during the day.',
    createdAt: hoursAgo(120),
  },
  {
    id: 'sym-14',
    symptom: 'Headache',
    severity: 3,
    category: getCategoryForSymptom('Headache'),
    note: 'Short mild headache resolved without medication.',
    createdAt: hoursAgo(132),
  },
  {
    id: 'sym-15',
    symptom: 'Dry eyes',
    severity: 5,
    category: getCategoryForSymptom('Dry eyes'),
    note: 'Strong screen irritation after 5 hours of laptop use.',
    createdAt: hoursAgo(144),
  },
];

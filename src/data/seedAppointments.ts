import {Appointment} from '../types/appointment';

const now = new Date();

const daysFromNow = (days: number, hour: number, minute: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const daysAgo = (days: number, hour: number, minute: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const seedAppointments: Appointment[] = [
  {
    id: 'app-1',
    doctorName: 'Dr. Novak',
    specialty: 'General practitioner',
    visitType: 'General practitioner',
    dateTime: daysFromNow(2, 9, 30),
    location: 'City Health Clinic, Room 204',
    preparation: [
      'Prepare symptom notes',
      'Bring current medication list',
      'Bring previous blood test report',
    ],
    notes: 'Discuss recent fatigue, sore throat, and recurring headaches.',
  },
  {
    id: 'app-2',
    doctorName: 'Dr. Svobodova',
    specialty: 'Laboratory',
    visitType: 'Blood test',
    dateTime: daysFromNow(5, 7, 45),
    location: 'Central Lab Department',
    preparation: [
      'Do not eat for 8–12 hours before the visit',
      'Drink water if allowed',
      'Avoid alcohol the day before',
      'Bring request form',
    ],
    notes: 'Routine blood panel and vitamin levels.',
  },
  {
    id: 'app-3',
    doctorName: 'Dr. Kral',
    specialty: 'Dentistry',
    visitType: 'Dentist',
    dateTime: daysFromNow(12, 14, 0),
    location: 'Smile Dental Clinic',
    preparation: [
      'Brush teeth before the visit',
      'Bring insurance card',
      'Arrive 10 minutes early',
    ],
    notes: 'Check sensitivity in upper right molar.',
  },
  {
    id: 'app-4',
    doctorName: 'Dr. Benes',
    specialty: 'Cardiology',
    visitType: 'Cardiology',
    dateTime: daysFromNow(18, 11, 15),
    location: 'University Hospital Cardio Building',
    preparation: [
      'Track blood pressure for 3 days before visit',
      'Bring medication list',
      'Bring previous ECG report',
    ],
    notes: 'Follow-up after occasional heart palpitations during exercise.',
  },
  {
    id: 'app-5',
    doctorName: 'Dr. Havel',
    specialty: 'Ophthalmology',
    visitType: 'Ophthalmology',
    dateTime: daysAgo(10, 15, 30),
    location: 'Eye Care Center',
    preparation: [
      'Bring glasses or lenses',
      'Bring previous eye exam results',
    ],
    notes: 'Evaluation for dry eye and screen-related irritation.',
  },
  {
    id: 'app-6',
    doctorName: 'Dr. Novak',
    specialty: 'General practitioner',
    visitType: 'General practitioner',
    dateTime: daysAgo(24, 10, 0),
    location: 'City Health Clinic, Room 204',
    preparation: [
      'Prepare symptom notes',
      'Bring medication list',
    ],
    notes: 'Consultation for sore throat and cough symptoms.',
  },
  {
    id: 'app-7',
    doctorName: 'Dr. Svobodova',
    specialty: 'Laboratory',
    visitType: 'Blood test',
    dateTime: daysAgo(45, 8, 0),
    location: 'Central Lab Department',
    preparation: [
      'Fasting for 10 hours',
      'Drink water',
    ],
    notes: 'Basic health screening.',
  },
  {
    id: 'app-8',
    doctorName: 'Dr. Vesela',
    specialty: 'ENT',
    visitType: 'General practitioner',
    dateTime: daysAgo(60, 13, 45),
    location: 'Regional Polyclinic',
    preparation: [
      'Prepare notes about congestion duration',
      'List nasal spray usage',
    ],
    notes: 'Persistent nasal congestion and sinus pressure.',
  },
];

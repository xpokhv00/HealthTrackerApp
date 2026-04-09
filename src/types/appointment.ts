export interface Appointment {
  id: string;
  patientName?: string;
  doctorName: string;
  specialty: string;
  visitType: string;
  dateTime: string;
  location?: string;
  preparation: string[];
  notes?: string;
}

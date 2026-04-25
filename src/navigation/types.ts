export type RootStackParamList = {
  Tabs: undefined;

  AddMedication:
    | {
    medicationId?: string;
  }
    | undefined;

  MedicationDetail: {
    medicationId: string;
  };

  AddAppointment:
    | {
    appointmentId?: string;
  }
    | undefined;

  AppointmentDetail: {
    appointmentId: string;
  };

  AddSymptom:
    | {
    symptomId?: string;
  }
    | undefined;

  SymptomDetail: {
    symptomId: string;
  };
};

export type RootTabParamList = {
  Home: undefined;
  Medications: undefined;
  Appointments: undefined;
  Symptoms: undefined;
  History: undefined;
};

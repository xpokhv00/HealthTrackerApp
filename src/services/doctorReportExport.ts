import {generatePDF} from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {SymptomEntry} from '../types/symptom';
import {buildDoctorReportHtml} from '../utils/doctorReportHtml';

interface Params {
  medications: Medication[];
  appointments: Appointment[];
  symptoms: SymptomEntry[];
}

export const exportDoctorReportPdf = async ({
                                              medications,
                                              appointments,
                                              symptoms,
                                            }: Params) => {
  const html = buildDoctorReportHtml({
    medications,
    appointments,
    symptoms,
  });

  const result = await generatePDF({
    html,
    fileName: `doctor-report-${Date.now()}`,
    directory: 'Documents',
    width: 612,
    height: 792,
  });

  if (!result.filePath) {
    throw new Error('PDF file path was not returned.');
  }

  const fileUrl = result.filePath.startsWith('file://')
    ? result.filePath
    : `file://${result.filePath}`;

  return {
    filePath: result.filePath,
    fileUrl,
  };
};

export const shareDoctorReportPdf = async (fileUrl: string) => {
  await Share.open({
    url: fileUrl,
    type: 'application/pdf',
    filename: 'doctor-report.pdf',
    failOnCancel: false,
  });
};

export const createDoctorReportPdf = async ({
                                              medications,
                                              appointments,
                                              symptoms,
                                            }: Params) => {
  return exportDoctorReportPdf({
    medications,
    appointments,
    symptoms,
  });
};

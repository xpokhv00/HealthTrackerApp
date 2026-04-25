import {generatePDF} from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {RoutineDoseSlot} from '../types/routineDose';
import {SymptomEntry} from '../types/symptom';
import {buildDoctorReportHtml} from '../utils/doctorReportHtml';
import {ReportWindow} from '../utils/report';

interface Params {
  medications: Medication[];
  appointments: Appointment[];
  symptoms: SymptomEntry[];
  routineSlots: RoutineDoseSlot[];
  reportWindow: ReportWindow;
}

export const exportDoctorReportPdf = async ({
                                              medications,
                                              appointments,
                                              symptoms,
                                              routineSlots,
                                              reportWindow,
                                            }: Params) => {
  const html = buildDoctorReportHtml({
    medications,
    appointments,
    symptoms,
    routineSlots,
    reportWindow,
  });

  const result = await generatePDF({
    html,
    fileName: `doctor-report-${Date.now()}`,
    width: 612,
    height: 792,
  });

  const rawPath = result.filePath ?? (result as any).uri ?? null;
  if (!rawPath) {
    throw new Error('PDF generation failed: no file path returned.');
  }

  const fileUrl = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;

  return {
    filePath: rawPath,
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

export const createDoctorReportPdf = async (params: Params) => {
  return exportDoctorReportPdf(params);
};

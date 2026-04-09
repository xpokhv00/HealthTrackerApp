import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {RoutineDoseSlot} from '../types/routineDose';
import {SymptomEntry} from '../types/symptom';
import {
  getActiveMedicationsForReport,
  getAverageSeverity,
  getMostFrequentSymptomForReport,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getReportWindowLabel,
  getRoutineAdherenceSummary,
  getStrongestSymptomForReport,
  getUpcomingAppointmentsForReport,
  groupSymptomsByName,
  ReportWindow,
} from './report';

const escapeHtml = (value?: string) => {
  if (!value) {
    return '';
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

interface Params {
  medications: Medication[];
  appointments: Appointment[];
  symptoms: SymptomEntry[];
  routineSlots: RoutineDoseSlot[];
  reportWindow: ReportWindow;
}

export const buildDoctorReportHtml = ({
                                        medications,
                                        appointments,
                                        symptoms,
                                        routineSlots,
                                        reportWindow,
                                      }: Params) => {
  const generatedAt = new Date();

  const activeMedications = getActiveMedicationsForReport(medications);
  const recentSymptoms = getRecentSymptomsForReport(symptoms, 12, reportWindow);
  const groupedSymptoms = groupSymptomsByName(recentSymptoms);
  const upcomingAppointments = getUpcomingAppointmentsForReport(appointments).slice(0, 3);
  const pastAppointments = getPastAppointmentsForReport(appointments, reportWindow).slice(0, 5);
  const mostFrequentSymptom = getMostFrequentSymptomForReport(recentSymptoms);
  const strongestSymptom = getStrongestSymptomForReport(recentSymptoms);
  const overallAverageSeverity = getAverageSeverity(recentSymptoms);
  const adherenceSummary = getRoutineAdherenceSummary(
    medications,
    routineSlots,
    reportWindow,
  );

  const symptomBlocks =
    recentSymptoms.length === 0
      ? `<p class="muted">No symptoms in this period.</p>`
      : Object.entries(groupedSymptoms)
        .map(([name, entries]) => {
          const latest = entries[0];

          return `
              <div class="item">
                <div class="item-title">${escapeHtml(name)}</div>
                <div class="item-meta">
                  Entries: ${entries.length} • Avg severity: ${getAverageSeverity(entries)}/10
                </div>
                <div class="item-meta">
                  Latest: ${formatDateTime(latest.createdAt)}
                </div>
                ${
            latest.note
              ? `<div class="item-note">Latest note: ${escapeHtml(latest.note)}</div>`
              : ''
          }
              </div>
            `;
        })
        .join('');

  const medicationBlocks =
    activeMedications.length === 0
      ? `<p class="muted">No active medications listed.</p>`
      : activeMedications
        .map(
          item => `
              <div class="item">
                <div class="item-title">${escapeHtml(item.name)}</div>
                <div class="item-meta">
                  ${escapeHtml(item.dosage)}${item.form ? ` • ${escapeHtml(item.form)}` : ''}
                </div>
                <div class="item-meta">
                  Type: ${item.type === 'routine' ? 'Routine' : 'As needed'}
                </div>
                ${
            item.purpose
              ? `<div class="item-note">Purpose: ${escapeHtml(item.purpose)}</div>`
              : ''
          }
                ${
            item.usageInstructions
              ? `<div class="item-note">Take: ${escapeHtml(item.usageInstructions)}</div>`
              : ''
          }
              </div>
            `,
        )
        .join('');

  const upcomingAppointmentBlocks =
    upcomingAppointments.length === 0
      ? `<p class="muted">No upcoming appointments.</p>`
      : upcomingAppointments
        .map(
          item => `
              <div class="item">
                <div class="item-title">${escapeHtml(item.visitType)}</div>
                <div class="item-meta">
                  ${escapeHtml(item.doctorName)} • ${escapeHtml(item.specialty)}
                </div>
                <div class="item-meta">${formatDateTime(item.dateTime)}</div>
                ${
            item.location
              ? `<div class="item-note">Location: ${escapeHtml(item.location)}</div>`
              : ''
          }
              </div>
            `,
        )
        .join('');

  const pastAppointmentBlocks =
    pastAppointments.length === 0
      ? `<p class="muted">No past appointments in this period.</p>`
      : pastAppointments
        .map(
          item => `
              <div class="item">
                <div class="item-title">${escapeHtml(item.visitType)}</div>
                <div class="item-meta">
                  ${escapeHtml(item.doctorName)} • ${escapeHtml(item.specialty)}
                </div>
                <div class="item-meta">${formatDateTime(item.dateTime)}</div>
                ${
            item.notes
              ? `<div class="item-note">Notes: ${escapeHtml(item.notes)}</div>`
              : ''
          }
              </div>
            `,
        )
        .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111827;
            background: #ffffff;
          }

          h1 {
            font-size: 28px;
            margin: 0 0 8px 0;
          }

          .subtitle {
            font-size: 14px;
            color: #667085;
            margin-bottom: 8px;
          }

          .period {
            font-size: 13px;
            color: #475467;
            margin-bottom: 24px;
          }

          .section {
            margin-bottom: 24px;
            border: 1px solid #E7ECF3;
            border-radius: 12px;
            padding: 16px;
          }

          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 12px;
          }

          .summary-grid {
            margin-top: 8px;
            margin-bottom: 8px;
          }

          .summary-item {
            margin-bottom: 8px;
            font-size: 14px;
            color: #344054;
          }

          .item {
            margin-bottom: 14px;
          }

          .item-title {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .item-meta {
            font-size: 13px;
            color: #475467;
            margin-bottom: 4px;
          }

          .item-note {
            font-size: 13px;
            color: #111827;
            margin-top: 4px;
          }

          .muted {
            color: #667085;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>Doctor Report</h1>
        <div class="subtitle">
          Generated: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}
        </div>
        <div class="period">Report period: ${escapeHtml(getReportWindowLabel(reportWindow))}</div>

        <div class="section">
          <div class="section-title">Overview</div>
          <div class="summary-grid">
            <div class="summary-item">
              Symptoms logged: ${recentSymptoms.length}
            </div>
            <div class="summary-item">
              Average symptom severity: ${recentSymptoms.length > 0 ? `${overallAverageSeverity}/10` : '—'}
            </div>
            <div class="summary-item">
              Routine adherence: ${
    adherenceSummary.total > 0
      ? `${adherenceSummary.adherencePercent}% (${adherenceSummary.taken} taken, ${adherenceSummary.missed} missed, ${adherenceSummary.pending} pending)`
      : 'No routine slots in this period'
  }
            </div>
            <div class="summary-item">
              Most frequent symptom: ${
    mostFrequentSymptom
      ? `${escapeHtml(mostFrequentSymptom.name)} (${mostFrequentSymptom.count}x)`
      : 'No symptom pattern available'
  }
            </div>
            <div class="summary-item">
              Strongest recent symptom: ${
    strongestSymptom
      ? `${escapeHtml(strongestSymptom.symptom)} (${strongestSymptom.severity}/10)`
      : 'No symptom entries'
  }
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Current symptoms summary</div>
          ${symptomBlocks}
        </div>

        <div class="section">
          <div class="section-title">Current medications</div>
          ${medicationBlocks}
        </div>

        <div class="section">
          <div class="section-title">Upcoming appointments</div>
          ${upcomingAppointmentBlocks}
        </div>

        <div class="section">
          <div class="section-title">Recent appointment history</div>
          ${pastAppointmentBlocks}
        </div>
      </body>
    </html>
  `;
};

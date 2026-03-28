import {Appointment} from '../types/appointment';
import {Medication} from '../types/medication';
import {SymptomEntry} from '../types/symptom';
import {
  getActiveMedicationsForReport,
  getAverageSeverity,
  getPastAppointmentsForReport,
  getRecentSymptomsForReport,
  getUpcomingAppointmentsForReport,
  groupSymptomsByName,
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
}

export const buildDoctorReportHtml = ({
                                        medications,
                                        appointments,
                                        symptoms,
                                      }: Params) => {
  const generatedAt = new Date();

  const activeMedications = getActiveMedicationsForReport(medications);
  const recentSymptoms = getRecentSymptomsForReport(symptoms, 10);
  const groupedSymptoms = groupSymptomsByName(recentSymptoms);
  const upcomingAppointments = getUpcomingAppointmentsForReport(appointments).slice(0, 3);
  const pastAppointments = getPastAppointmentsForReport(appointments).slice(0, 5);

  const symptomBlocks =
    recentSymptoms.length === 0
      ? `<p class="muted">No recent symptoms available.</p>`
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
            item.notes
              ? `<div class="item-note">Notes: ${escapeHtml(item.notes)}</div>`
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
      ? `<p class="muted">No past appointments recorded.</p>`
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

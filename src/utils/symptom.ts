import {SymptomEntry} from '../types/symptom';

export const formatSymptomDateTime = (iso: string) => {
  const date = new Date(iso);

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const getSeverityLabel = (severity: number) => {
  if (severity <= 2) {
    return 'Very mild';
  }

  if (severity <= 4) {
    return 'Mild';
  }

  if (severity <= 6) {
    return 'Moderate';
  }

  if (severity <= 8) {
    return 'Strong';
  }

  return 'Severe';
};

export const getRecentSymptoms = (symptoms: SymptomEntry[], limit = 3) => {
  return [...symptoms]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
};

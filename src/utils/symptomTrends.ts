import {SymptomEntry} from '../types/symptom';

export interface SymptomTrendPoint {
  dateKey: string;
  label: string;
  count: number;
  averageSeverity: number;
  maxSeverity: number;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toShortLabel = (date: Date) =>
  date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

export const buildSymptomTrendPoints = (
  symptoms: SymptomEntry[],
  days: number = 7,
): SymptomTrendPoint[] => {
  const now = new Date();
  const buckets = new Map<
    string,
    {
      label: string;
      count: number;
      totalSeverity: number;
      maxSeverity: number;
    }
  >();

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const key = toDateKey(date);

    buckets.set(key, {
      label: toShortLabel(date),
      count: 0,
      totalSeverity: 0,
      maxSeverity: 0,
    });
  }

  symptoms.forEach(item => {
    const date = new Date(item.createdAt);
    const key = toDateKey(date);
    const bucket = buckets.get(key);

    if (!bucket) {
      return;
    }

    bucket.count += 1;
    bucket.totalSeverity += item.severity;
    bucket.maxSeverity = Math.max(bucket.maxSeverity, item.severity);
  });

  return [...buckets.entries()].map(([dateKey, bucket]) => ({
    dateKey,
    label: bucket.label,
    count: bucket.count,
    averageSeverity:
      bucket.count > 0
        ? Number((bucket.totalSeverity / bucket.count).toFixed(1))
        : 0,
    maxSeverity: bucket.maxSeverity,
  }));
};

export const getTrendDirection = (
  points: SymptomTrendPoint[],
): 'improving' | 'worsening' | 'stable' | 'no_data' => {
  const nonEmpty = points.filter(point => point.count > 0);

  if (nonEmpty.length < 2) {
    return nonEmpty.length === 0 ? 'no_data' : 'stable';
  }

  const first = nonEmpty[0].averageSeverity;
  const last = nonEmpty[nonEmpty.length - 1].averageSeverity;
  const diff = Number((last - first).toFixed(1));

  if (diff >= 1) {
    return 'worsening';
  }

  if (diff <= -1) {
    return 'improving';
  }

  return 'stable';
};

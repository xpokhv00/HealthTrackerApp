import {SymptomCategory, SymptomEntry} from '../types/symptom';

const SYMPTOM_CATEGORY_MAP: Record<string, SymptomCategory> = {
  // Pain
  headache: 'Pain',
  migraine: 'Pain',
  'back pain': 'Pain',
  'muscle pain': 'Pain',
  'chest pain': 'Pain',
  'stomach pain': 'Pain',
  'joint pain': 'Pain',
  'ear pain': 'Pain',
  // Respiratory
  cough: 'Respiratory',
  'sore throat': 'Respiratory',
  'nasal congestion': 'Respiratory',
  'runny nose': 'Respiratory',
  sneezing: 'Respiratory',
  'shortness of breath': 'Respiratory',
  wheezing: 'Respiratory',
  'stuffy nose': 'Respiratory',
  // Digestive
  nausea: 'Digestive',
  vomiting: 'Digestive',
  diarrhea: 'Digestive',
  constipation: 'Digestive',
  bloating: 'Digestive',
  heartburn: 'Digestive',
  'loss of appetite': 'Digestive',
  // Mood
  anxiety: 'Mood',
  depression: 'Mood',
  irritability: 'Mood',
  'mood swings': 'Mood',
  stress: 'Mood',
  // Energy
  fatigue: 'Energy',
  'low energy': 'Energy',
  insomnia: 'Energy',
  dizziness: 'Energy',
  weakness: 'Energy',
  // Skin
  rash: 'Skin',
  itching: 'Skin',
  hives: 'Skin',
  'dry skin': 'Skin',
  'skin irritation': 'Skin',
  'eye irritation': 'Skin',
  'dry eyes': 'Skin',
  // Other
  fever: 'Other',
  chills: 'Other',
  'night sweats': 'Other',
};

export const getCategoryForSymptom = (
  name: string,
): SymptomCategory | undefined =>
  SYMPTOM_CATEGORY_MAP[name.toLowerCase().trim()];

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

export const sortSymptomsNewestFirst = (symptoms: SymptomEntry[]) => {
  return [...symptoms].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getRecentSymptoms = (symptoms: SymptomEntry[], limit = 3) => {
  return sortSymptomsNewestFirst(symptoms).slice(0, limit);
};

export const filterSymptomsByDays = (
  symptoms: SymptomEntry[],
  days: number | 'all',
) => {
  if (days === 'all') {
    return sortSymptomsNewestFirst(symptoms);
  }

  const now = Date.now();
  const windowStart = now - days * 24 * 60 * 60 * 1000;

  return sortSymptomsNewestFirst(symptoms).filter(
    item => new Date(item.createdAt).getTime() >= windowStart,
  );
};

export const filterSymptomsByCategory = (
  symptoms: SymptomEntry[],
  category: string | 'all',
) => {
  if (category === 'all') {
    return symptoms;
  }

  return symptoms.filter(item => item.category === category);
};

export const getAverageSeverity = (symptoms: SymptomEntry[]) => {
  if (symptoms.length === 0) {
    return 0;
  }

  const total = symptoms.reduce((sum, item) => sum + item.severity, 0);
  return Math.round((total / symptoms.length) * 10) / 10;
};

export const getMostCommonSymptom = (symptoms: SymptomEntry[]) => {
  if (symptoms.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();

  symptoms.forEach(item => {
    const key = item.symptom.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  let bestSymptom: string | null = null;
  let bestCount = 0;

  counts.forEach((count, symptom) => {
    if (count > bestCount) {
      bestSymptom = symptom;
      bestCount = count;
    }
  });

  return bestSymptom
    ? {
      symptom: bestSymptom,
      count: bestCount,
    }
    : null;
};

export const getStrongestRecentSymptom = (symptoms: SymptomEntry[]) => {
  if (symptoms.length === 0) {
    return null;
  }

  return [...symptoms].sort((a, b) => {
    if (b.severity !== a.severity) {
      return b.severity - a.severity;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
};

export const getTopTriggers = (
  symptoms: SymptomEntry[],
  limit = 3,
): Array<{trigger: string; count: number}> => {
  const counts = new Map<string, number>();

  symptoms.forEach(item => {
    (item.triggers ?? []).forEach(trigger => {
      counts.set(trigger, (counts.get(trigger) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([trigger, count]) => ({trigger, count}))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.trigger.localeCompare(b.trigger);
    })
    .slice(0, limit);
};

export const getCategoryCounts = (symptoms: SymptomEntry[]) => {
  const counts = new Map<string, number>();

  symptoms.forEach(item => {
    const key = item.category ?? 'Uncategorized';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([category, count]) => ({category, count}))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.category.localeCompare(b.category);
    });
};

export const getSymptomSummary = (symptoms: SymptomEntry[]) => {
  return {
    total: symptoms.length,
    averageSeverity: getAverageSeverity(symptoms),
    mostCommon: getMostCommonSymptom(symptoms),
    strongest: getStrongestRecentSymptom(symptoms),
    topTriggers: getTopTriggers(symptoms),
    categoryCounts: getCategoryCounts(symptoms),
  };
};

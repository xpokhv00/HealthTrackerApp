export const colors = {
  // Base
  background: '#F6F8FB',
  surface: '#FFFFFF',
  primary: '#4C7EFF',
  text: '#111827',
  textSecondary: '#667085',
  textMuted: '#94A3B8',
  border: '#E7ECF3',
  borderMuted: '#F2F4F7',
  neutral: '#F2F4F7',
  neutralText: '#475467',
  danger: '#B42318',

  // Teal — as-needed medications
  teal: '#0BA5A4',
  tealLight: '#ECFDF9',

  // Severity — low (≤3), mid (4–6), high (>6)
  severityLowBg: '#ECFDF5',
  severityLowText: '#027A48',
  severityLowBar: '#12B76A',
  severityMidBg: '#FFFAEB',
  severityMidText: '#B54708',
  severityMidBar: '#F79009',
  severityHighBg: '#FEF3F2',
  severityHighText: '#B42318',
  severityHighBar: '#F04438',

  // Countdown badge — today/tomorrow, this week, later
  countdownUrgentBg: '#FEF3F2',
  countdownUrgentText: '#B42318',
  countdownSoonBg: '#FFFAEB',
  countdownSoonText: '#B54708',
  countdownLaterBg: '#EEF4FF',
  countdownLaterText: '#3538CD',

  // Symptom categories
  categoryPainBg: '#FEE4E2',
  categoryPainText: '#912018',
  categoryRespBg: '#E0F2FE',
  categoryRespText: '#0369A1',
  categoryDigestBg: '#FEF9C3',
  categoryDigestText: '#854D0E',
  categoryMoodBg: '#F3E8FF',
  categoryMoodText: '#6B21A8',
  categoryEnergyBg: '#FFF7ED',
  categoryEnergyText: '#9A3412',
  categorySkinBg: '#FCE7F3',
  categorySkinText: '#9D174D',
  categoryOtherBg: '#F2F4F7',
  categoryOtherText: '#475467',
};

export function severityColors(severity: number) {
  if (severity <= 3) {
    return {bg: colors.severityLowBg, text: colors.severityLowText, bar: colors.severityLowBar};
  }
  if (severity <= 6) {
    return {bg: colors.severityMidBg, text: colors.severityMidText, bar: colors.severityMidBar};
  }
  return {bg: colors.severityHighBg, text: colors.severityHighText, bar: colors.severityHighBar};
}

export function countdownColors(dateTime: string): {bg: string; text: string} {
  const days = (new Date(dateTime).getTime() - Date.now()) / 86400000;
  if (days <= 1) {return {bg: colors.countdownUrgentBg, text: colors.countdownUrgentText};}
  if (days <= 7) {return {bg: colors.countdownSoonBg, text: colors.countdownSoonText};}
  return {bg: colors.countdownLaterBg, text: colors.countdownLaterText};
}

export const CATEGORY_COLORS: Record<string, string> = {
  Pain: colors.categoryPainBg,
  Respiratory: colors.categoryRespBg,
  Digestive: colors.categoryDigestBg,
  Mood: colors.categoryMoodBg,
  Energy: colors.categoryEnergyBg,
  Skin: colors.categorySkinBg,
  Other: colors.categoryOtherBg,
};

export const CATEGORY_TEXT: Record<string, string> = {
  Pain: colors.categoryPainText,
  Respiratory: colors.categoryRespText,
  Digestive: colors.categoryDigestText,
  Mood: colors.categoryMoodText,
  Energy: colors.categoryEnergyText,
  Skin: colors.categorySkinText,
  Other: colors.categoryOtherText,
};

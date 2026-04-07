export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseTimeToDate = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
};

export const isSameDateKey = (a: string, b: string) => a === b;

type DatePartsOptions = {
  timeZone?: string;
};

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

export const getDateParts = (date: Date, options: DatePartsOptions = {}) => {
  const { timeZone } = options;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? date.getUTCMonth() + 1);
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? date.getUTCDate());
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? date.getUTCFullYear());

  return {
    month,
    day,
    year,
    isoDate: `${year}-${toTwoDigits(month)}-${toTwoDigits(day)}`,
  };
};

export const parseIsoDate = (isoDate: string | null | undefined) => {
  if (!isoDate) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  return { year, month, day };
};

export const formatIsoDateLabel = (
  isoDate: string | null | undefined,
  options: { locale?: string; timeZone?: string } = {}
) => {
  if (!isoDate) {
    return '';
  }

  const { locale = 'en-US', timeZone } = options;

  const date = new Date(`${isoDate}T00:00:00Z`);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return formatter.format(date);
};

export const getIsoWeekKey = (date: Date, options: DatePartsOptions = {}) => {
  const { timeZone } = options;
  const parts = getDateParts(date, { timeZone });
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  // ISO week starts on Monday. Adjust date to nearest Thursday.
  const dayOfWeek = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);

  const isoYear = utcDate.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const weekNumber =
    1 + Math.round((utcDate.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${isoYear}-${toTwoDigits(weekNumber)}`;
};

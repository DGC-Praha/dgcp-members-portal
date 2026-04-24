import i18n from './index';

const LOCALE_MAP: Record<string, string> = {
  cs: 'cs-CZ',
  en: 'en-GB',
};

export function dateLocale(): string {
  return LOCALE_MAP[i18n.language] ?? 'cs-CZ';
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(dateLocale(), options);
}

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(dateLocale(), options);
}

/**
 * Short relative string picking the largest sensible unit ("2 h ago" / "in 3 min").
 * Past timestamps come back with the past phrasing for the locale; future ones with
 * the future phrasing. `numeric: 'auto'` means a zero-diff renders as "now"/"nyní".
 */
export function formatRelativeTime(value: string | Date): string {
  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(target)) return '';
  const diffSec = Math.round((target - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(dateLocale(), { numeric: 'auto', style: 'short' });
  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  const min = Math.round(diffSec / 60);
  if (Math.abs(min) < 60) return rtf.format(min, 'minute');
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, 'hour');
  const day = Math.round(hr / 24);
  return rtf.format(day, 'day');
}

/** Back-compat alias for the "past only" call sites. */
export const formatRelativeFromNow = formatRelativeTime;

/**
 * Date/time formatting helpers.
 *
 * Dates always format against the browser's default locale (passing `undefined`
 * to the Intl APIs) — deliberately decoupled from the UI language. A Czech user
 * reading the English UI still expects Czech-style date formatting because that
 * matches the rest of their OS, and vice versa.
 */

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, options);
}

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, options);
}

/**
 * Short relative string picking the largest sensible unit ("2 h ago" / "in 3 min").
 * Uses the browser's default locale. `numeric: 'auto'` means a zero-diff renders as
 * the locale's "now" phrase.
 */
export function formatRelativeTime(value: string | Date): string {
  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(target)) return '';
  const diffSec = Math.round((target - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' });
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

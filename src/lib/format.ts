/** Formatting helpers. Pure — no React, no i18n; callers pass the locale. */

/** {@code 09:14} — the timestamp form the mockup uses in every list. */
export function formatTime(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatDateLong(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** ISO date (yyyy-mm-dd) in the *local* zone — toISOString would shift across midnight. */
export function toIsoDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

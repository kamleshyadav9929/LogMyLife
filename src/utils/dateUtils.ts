/**
 * Date utility functions for local timezone-safe calculations.
 * Prevents UTC shift bugs (e.g. toISOString() returning yesterday/tomorrow date string).
 */

/**
 * Returns a "YYYY-MM-DD" string in local timezone for a given Date or current date.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts an ISO date string (e.g. "2026-08-16T19:30:00.000Z") to local "YYYY-MM-DD".
 */
export function getLocalDateFromISO(isoStr: string): string {
  if (!isoStr) return getLocalDateStr();
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return getLocalDateStr();
  return getLocalDateStr(date);
}

/**
 * Formats a Date object to "HH:MM AM/PM" in local timezone.
 */
export function formatLocalTime(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minsStr = minutes < 10 ? '0' + minutes : minutes;
  const hrsStr = hours < 10 ? '0' + hours : hours;
  return `${hrsStr}:${minsStr} ${ampm}`;
}

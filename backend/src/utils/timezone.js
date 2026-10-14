/**
 * Timezone and Date-Key utilities for Orbitus.
 *
 * Default platform timezone is Asia/Kolkata (IST, UTC+5:30).
 * Consistent dateKey (YYYY-MM-DD) computation across database, backend services,
 * activity rewards, dashboard/profile queries, and frontend rendering.
 */

export const DEFAULT_APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns formatted calendar date 'YYYY-MM-DD' in the given timezone.
 * Uses Intl.DateTimeFormat with 'en-CA' locale which guarantees standard ISO YYYY-MM-DD format.
 */
export const getDateKey = (date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    // Fallback if timezone string is unrecognized
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  }
};

/**
 * Returns the 4-digit calendar year in the given timezone.
 */
export const getYearInTimezone = (date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return new Date().getUTCFullYear();
  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric'
    });
    return parseInt(formatter.format(d), 10);
  } catch {
    return d.getUTCFullYear();
  }
};

/**
 * Returns readable timezone abbreviation or label (e.g. 'IST', 'UTC').
 */
export const getTimezoneLabel = (timeZone = DEFAULT_APP_TIMEZONE) => {
  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IST';
  if (tz === 'UTC' || tz === 'Etc/UTC') return 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz;
  } catch {
    return tz;
  }
};

/**
 * Checks whether two dates/timestamps fall on the same calendar day in the given timezone.
 */
export const isSameDayInTimezone = (date1, date2, timeZone = DEFAULT_APP_TIMEZONE) => {
  if (!date1 || !date2) return false;
  return getDateKey(date1, timeZone) === getDateKey(date2, timeZone);
};

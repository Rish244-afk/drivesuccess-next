export const TARGET_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses a date string ("YYYY-MM-DD") and 12-hour time slot ("10:00 AM")
 * explicitly as Asia/Kolkata (IST, UTC+05:30) wall-clock time, returning an
 * absolute UTC Date object.
 *
 * Example:
 *   parseSlotToUTC('2026-08-15', '10:00 AM') => 2026-08-15T04:30:00.000Z
 */
export function parseSlotToUTC(dateStr: string, timeSlot: string): Date {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string format: "${dateStr}". Expected "YYYY-MM-DD".`);
  }

  if (!timeSlot || typeof timeSlot !== 'string') {
    throw new Error(`Invalid time slot input: "${timeSlot}".`);
  }

  const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    throw new Error(`Invalid time slot format: "${timeSlot}". Expected format like "10:00 AM" or "03:30 PM".`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid hours/minutes in time slot: "${timeSlot}".`);
  }

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const pad = (n: number) => String(n).padStart(2, '0');
  const isoString = `${dateStr}T${pad(hours)}:${pad(minutes)}:00.000+05:30`;
  const parsedDate = new Date(isoString);

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Failed to parse slot datetime for date "${dateStr}" and slot "${timeSlot}".`);
  }

  return parsedDate;
}

/**
 * Returns the exact UTC Date range representing the full Asia/Kolkata calendar day
 * for a given "YYYY-MM-DD" date string (00:00:00.000 IST to 23:59:59.999 IST).
 *
 * Example for '2026-08-15':
 *   startOfDay => 2026-08-14T18:30:00.000Z
 *   endOfDay   => 2026-08-15T18:29:59.999Z
 */
export function getISTDayRangeUTC(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string format for day range: "${dateStr}". Expected "YYYY-MM-DD".`);
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
    throw new Error(`Failed to calculate IST day range for date "${dateStr}".`);
  }

  return { startOfDay, endOfDay };
}

/**
 * Formats a Date / string / number into a 12-hour time string ("10:00 AM") in Asia/Kolkata timezone.
 */
export function formatISTTime(dateInput: Date | string | number): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleTimeString('en-US', {
    timeZone: TARGET_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a Date / string / number into a date string in Asia/Kolkata timezone.
 */
export function formatISTDate(
  dateInput: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-US', {
    timeZone: TARGET_TIMEZONE,
    ...(options || { month: 'short', day: 'numeric', year: 'numeric' }),
  });
}

/**
 * Formats a Date / string / number into a full date-time string in Asia/Kolkata timezone.
 */
export function formatISTDateTime(
  dateInput: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleString('en-US', {
    timeZone: TARGET_TIMEZONE,
    ...(options || {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  });
}

/**
 * Returns the current calendar date string ("YYYY-MM-DD") in Asia/Kolkata timezone.
 */
export function getISTDateString(dateInput: Date | string | number = new Date()): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TARGET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Returns a future calendar date string ("YYYY-MM-DD") in Asia/Kolkata timezone for today + daysAhead.
 */
export function getFutureISTDateString(daysAhead: number): string {
  const futureTimestamp = Date.now() + daysAhead * 86400000;
  return getISTDateString(futureTimestamp);
}

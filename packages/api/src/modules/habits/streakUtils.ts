/**
 * Utility functions for habit streak calculation.
 *
 * Requirements: 3.8, 6.5
 */

/**
 * Returns the current calendar date in the given IANA timezone as YYYY-MM-DD.
 * Uses Intl.DateTimeFormat to convert the current instant to a locale-specific date.
 *
 * @param timezone - IANA timezone identifier (e.g. 'UTC', 'Asia/Kolkata')
 * @returns Date string in YYYY-MM-DD format
 */
export function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Subtracts `n` days from a YYYY-MM-DD string and returns the result
 * as a YYYY-MM-DD string. Pure arithmetic operation — no timezone risk.
 *
 * @param dateStr - Base date string in YYYY-MM-DD format
 * @param n - Number of days to subtract
 * @returns Resulting date string in YYYY-MM-DD format
 */
export function subtractDay(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`); // noon UTC avoids DST edge cases
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0] as string;
}

/**
 * Computes the current consecutive-day streak from habit completion timestamps.
 *
 * A streak is the number of consecutive calendar days — ending today or
 * yesterday — on which the habit was completed at least once.
 *
 * @param completionDates - Array of 'YYYY-MM-DD' strings or Date objects
 * @param today - Today's date in caller's timezone (defaults to today in UTC)
 * @returns The length of the current streak in days (0 if no streak)
 */
export function computeStreak(
  completionDates: (string | Date)[],
  today?: string,
): number {
  if (completionDates.length === 0) return 0;

  // Normalize inputs to YYYY-MM-DD strings
  const strDates: string[] = completionDates.map((d) =>
    typeof d === 'string' ? d : (d.toISOString().split('T')[0] as string),
  );

  const todayStr = today ?? (new Date().toISOString().split('T')[0] as string);

  // Deduplicate and sort descending (most recent first)
  const uniqueDays = [...new Set(strDates)].sort().reverse();

  // Anchor: streak must start on today or yesterday
  const anchor = uniqueDays[0];
  const yesterday = subtractDay(todayStr, 1);
  if (anchor !== todayStr && anchor !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expected = anchor;

  for (const day of uniqueDays) {
    if (day === expected) {
      streak++;
      expected = subtractDay(expected, 1);
    } else {
      break;
    }
  }

  return streak;
}


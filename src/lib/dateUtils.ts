/**
 * Many bank/CSV exports carry a date with no time-of-day, which parses to
 * exactly midnight. Treat that as "no reliable time" so time-of-day heuristics
 * (late-night anomaly detection, evening-spend insights) don't misfire on
 * every single row of a date-only statement.
 */
export function hasReliableTime(d: Date): boolean {
  return !(d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0);
}

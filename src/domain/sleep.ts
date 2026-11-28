import { startOfDay } from "date-fns";
import { SleepSession, SleepPeriod } from "@/db/types";

export function sleepSecondsToday(sessions: SleepSession[], now: Date): number {
  return sleepSecondsBetween(sessions, startOfDay(now), now);
}
export function sleepSecondsBetween(sessions: SleepSession[], from: Date, now: Date): number {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(now.getTime()) || from >= now) return 0;
  const intervals = sessions.flatMap(session => {
    const rawStart = new Date(session.startedAt).getTime();
    const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : now.getTime();
    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) return [];
    const start = Math.max(from.getTime(), rawStart), end = Math.min(now.getTime(), rawEnd);
    return end > start ? [{ start, end }] : [];
  }).sort((a,b) => a.start-b.start);
  // Imported or legacy overlapping logs count once, never inflate sleep totals.
  let total = 0, current: {start:number;end:number} | undefined;
  for (const interval of intervals) {
    if (current && interval.start <= current.end) current.end = Math.max(current.end, interval.end);
    else { if (current) total += current.end-current.start; current = {...interval}; }
  }
  if (current) total += current.end-current.start;
  return Math.floor(total/1000);
}
export function validSleepRange(start: Date, end: Date, now = new Date()): boolean {
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start < end && end <= now;
}

/** Legacy records get a display default only; caregivers can explicitly override it. */
export function defaultSleepPeriod(start: Date): SleepPeriod {
  const hour = start.getHours();
  return hour >= 19 || hour < 7 ? "night" : "nap";
}
export function sleepPeriod(session: Pick<SleepSession, "period" | "startedAt">): SleepPeriod {
  return session.period ?? defaultSleepPeriod(new Date(session.startedAt));
}

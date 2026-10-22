import { startOfDay } from "date-fns";
import { SleepSession } from "@/db/types";

export function sleepSecondsToday(sessions: SleepSession[], now: Date): number {
  return sleepSecondsBetween(sessions, startOfDay(now), now);
}
export function sleepSecondsBetween(sessions: SleepSession[], from: Date, now: Date): number {
  const dayStart = from.getTime();
  return Math.floor(sessions.reduce((total, session) => {
    const start = Math.max(dayStart, new Date(session.startedAt).getTime());
    const end = Math.min(now.getTime(), session.endedAt ? new Date(session.endedAt).getTime() : now.getTime());
    return total + Math.max(0, end - start);
  }, 0) / 1000);
}
export function validSleepRange(start: Date, end: Date, now = new Date()): boolean {
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start < end && end <= now;
}

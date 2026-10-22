const DAY = 86400000;
export interface Forecast { at: Date; samples: number }
const median = (values: number[]) => {
  const sorted = [...values].sort((a,b) => a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};
/** Observed patterns only: no clinical feeding schedule or sleep target. */
export function forecastNext(times: Date[], now: Date): Forecast | null {
  const sorted = times.filter(t => Number.isFinite(t.getTime()) && t <= now && now.getTime() - t.getTime() <= 7 * DAY).sort((a,b) => a.getTime() - b.getTime());
  const last = sorted[sorted.length - 1];
  if (sorted.length < 3 || !last || now.getTime() - last.getTime() > DAY) return null;
  const gaps = sorted.slice(1).map((time, i) => time.getTime() - sorted[i]!.getTime()).filter(gap => gap > 0).slice(-6);
  if (gaps.length < 2) return null;
  return { at: new Date(last.getTime() + median(gaps)), samples: gaps.length };
}
export function forecastSleep(sessions: { startedAt: string; endedAt: string | null }[], now: Date): Forecast | null {
  const sorted = sessions.filter(s => s.endedAt && new Date(s.endedAt) <= now && now.getTime() - new Date(s.startedAt).getTime() <= 7 * DAY).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const last = sorted[sorted.length - 1];
  if (sorted.length < 3 || !last?.endedAt || now.getTime() - new Date(last.endedAt).getTime() > DAY) return null;
  const gaps = sorted.slice(1).map((s,i) => new Date(s.startedAt).getTime() - new Date(sorted[i]!.endedAt!).getTime()).filter(gap => gap > 0).slice(-6);
  return gaps.length >= 2 ? { at: new Date(new Date(last.endedAt).getTime() + median(gaps)), samples: gaps.length } : null;
}
export function countdown(at: Date, now: Date): string {
  const seconds = Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
}

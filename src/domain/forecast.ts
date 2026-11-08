const DAY = 86400000;
export interface Forecast {
  at: Date;
  earliest: Date;
  latest: Date;
  samples: number;
  confidence: "early" | "established";
}
function quantile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  return sorted[lower]! + (sorted[Math.ceil(index)]! - sorted[lower]!) * (index - lower);
}
function estimate(anchor: Date, intervals: { gap: number; hour: number }[]): Forecast | null {
  // Compare similar times of day when there are enough examples; never mix
  // a sparse overnight sample into a well-observed daytime pattern.
  const nearby = intervals.filter(i => Math.min(Math.abs(i.hour - anchor.getHours()), 24 - Math.abs(i.hour - anchor.getHours())) <= 4);
  const gaps = (nearby.length >= 3 ? nearby : intervals).slice(-20).map(i => i.gap);
  if (gaps.length < 2) return null;
  const middle = quantile(gaps, .5);
  const low = quantile(gaps, .25);
  const high = quantile(gaps, .75);
  if ((high - low) / middle > .65) return null;
  return {
    at: new Date(anchor.getTime() + middle),
    earliest: new Date(anchor.getTime() + low),
    latest: new Date(anchor.getTime() + high),
    samples: gaps.length,
    confidence: gaps.length >= 5 ? "established" : "early",
  };
}
/** Personal observed routine, not a feeding recommendation or medical schedule. */
export function forecastNext(times: Date[], now: Date): Forecast | null {
  const sorted = [...new Set(times.filter(t => Number.isFinite(t.getTime()) && t <= now && now.getTime() - t.getTime() <= 7 * DAY).map(t => t.getTime()))].sort((a,b) => a-b).map(t => new Date(t));
  const last = sorted[sorted.length - 1];
  if (!last || now.getTime() - last.getTime() > DAY) return null;
  return estimate(last, sorted.slice(1).map((time, i) => ({ gap: time.getTime() - sorted[i]!.getTime(), hour: sorted[i]!.getHours() })));
}
export function forecastSleep(sessions: { startedAt: string; endedAt: string | null }[], now: Date): Forecast | null {
  if (sessions.some(s => !s.endedAt)) return null;
  const sorted = sessions.filter(s => s.endedAt && Number.isFinite(new Date(s.startedAt).getTime()) && new Date(s.startedAt) < new Date(s.endedAt) && new Date(s.endedAt) <= now && now.getTime() - new Date(s.startedAt).getTime() <= 7 * DAY).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const last = sorted[sorted.length - 1];
  if (!last?.endedAt || now.getTime() - new Date(last.endedAt).getTime() > DAY) return null;
  // Overlapping records make the sleep history ambiguous; ask for correction.
  if (sorted.some((s,i) => i > 0 && new Date(s.startedAt) < new Date(sorted[i-1]!.endedAt!))) return null;
  const intervals = sorted.slice(1).map((s,i) => ({ gap: new Date(s.startedAt).getTime() - new Date(sorted[i]!.endedAt!).getTime(), hour: new Date(sorted[i]!.endedAt!).getHours() })).filter(i => i.gap > 0);
  return estimate(new Date(last.endedAt), intervals);
}
export function countdown(at: Date, now: Date): string {
  const seconds = Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
}

/** Walk-forward evaluation: every prediction sees only events before its target.
 * Results measure recorded behaviour, not clinical correctness or future accuracy.
 */
export function evaluateForecast(times: Date[]): { samples: number; attempted: number; meanAbsoluteErrorMinutes: number | null; withinWindow: number } {
  const sorted = [...new Set(times.filter(d => Number.isFinite(d.getTime())).map(d => d.getTime()))].sort((a,b) => a-b).map(t => new Date(t));
  let error = 0, samples = 0, withinWindow = 0, attempted = 0;
  for (let i = Math.max(3, sorted.length - 30); i < sorted.length; i++) {
    attempted++;
    const prediction = forecastNext(sorted.slice(0,i), sorted[i-1]!);
    if (!prediction) continue;
    const actual = sorted[i]!.getTime();
    error += Math.abs(actual - prediction.at.getTime()) / 60000;
    samples++;
    if (actual >= prediction.earliest.getTime() && actual <= prediction.latest.getTime()) withinWindow++;
  }
  return { samples, attempted, meanAbsoluteErrorMinutes: samples ? error / samples : null, withinWindow };
}

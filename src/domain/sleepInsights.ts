import { format } from "date-fns";
import { SleepSession } from "@/db/types";
import { forecastSleep, Forecast } from "./forecast";
import { sleepReferenceHours } from "./ageReference";
import { sleepSecondsBetween } from "./sleep";

const HOUR = 3600000;
const DAY = 24 * HOUR;
type Pair = { anchor: Date; previousHours: number; gap: number };
export type SleepInsightState = "sleeping" | "learning" | "ready" | "review" | "stale";
export interface SleepInsights {
  state: SleepInsightState;
  forecast: Forecast | null;
  method: "baseline" | "adaptive";
  completedSessions: number;
  loggedDays: number;
  loggedSeconds24h: number;
  typicalSessionMinutes: number | null;
  awakeMinutes: number | null;
  reference: { min: number; max: number } | null;
  validation: { samples: number; adaptiveErrorMinutes: number; baselineErrorMinutes: number } | null;
}

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  const i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i]! : (a[i - 1]! + a[i]!) / 2;
};
function clockDistance(a: Date, b: Date) {
  const diff = Math.abs(a.getHours() + a.getMinutes() / 60 - b.getHours() - b.getMinutes() / 60);
  return Math.min(diff, 24 - diff);
}
/** Weighted nearest-neighbour regression; fitted only to this baby's past awake intervals. */
function predict(pairs: Pair[], anchor: Date, previousHours: number): { middle: number; low: number; high: number; count: number } | null {
  const neighbors = pairs.filter(p => p.anchor < anchor).map(p => ({
    ...p,
    distance: clockDistance(p.anchor, anchor) / 4 + Math.min(3, Math.abs(p.previousHours - previousHours)) / 2,
  })).sort((a, b) => a.distance - b.distance).slice(0, 7);
  if (neighbors.length < 4 || new Set(neighbors.map(p => format(p.anchor, "yyyy-MM-dd"))).size < 3) return null;
  const weighted = neighbors.map(p => ({ value: p.gap, weight: Math.exp(-(anchor.getTime() - p.anchor.getTime()) / (7 * DAY)) / (0.3 + p.distance) })).sort((a, b) => a.value - b.value);
  const total = weighted.reduce((s, p) => s + p.weight, 0);
  const quantile = (q: number) => {
    let sum = 0;
    for (const p of weighted) { sum += p.weight; if (sum >= total * q) return p.value; }
    return weighted[weighted.length - 1]!.value;
  };
  const middle = quantile(.5), low = quantile(.25), high = quantile(.75);
  if ((high - low) / middle > .65) return null;
  return { middle, low, high, count: neighbors.length };
}

/** On-device experiment: an adaptive estimate is used only after chronological wins over a median baseline. */
export function getSleepInsights(sessions: SleepSession[], now: Date, dateOfBirth?: string): SleepInsights {
  const recent = sessions.filter(s => {
    const start = new Date(s.startedAt).getTime();
    return Number.isFinite(start) && start <= now.getTime() && (start >= now.getTime() - 14 * DAY || !s.endedAt);
  });
  const unique = [...new Map(recent.map(s => [`${s.startedAt}|${s.endedAt}`, s])).values()];
  const active = unique.filter(s => !s.endedAt);
  const completed = unique.filter(s => s.endedAt && Number.isFinite(new Date(s.endedAt).getTime()) && new Date(s.endedAt) <= now && new Date(s.endedAt) > new Date(s.startedAt)).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const overlapping = [...completed, ...active].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()).some((s, i, all) => i > 0 && (!all[i - 1]!.endedAt || new Date(s.startedAt) < new Date(all[i - 1]!.endedAt!)));
  // A day-long timer or invalid/overlapping record needs caregiver review; never silently correct it.
  const suspicious = overlapping || active.length > 1 || unique.length !== completed.length + active.length || unique.some(s => (s.endedAt ? new Date(s.endedAt).getTime() : now.getTime()) - new Date(s.startedAt).getTime() > DAY);
  const latest = completed[completed.length - 1];
  const anchor = latest?.endedAt ? new Date(latest.endedAt) : null;
  const result: SleepInsights = {
    state: suspicious ? "review" : active.length ? "sleeping" : "learning", forecast: null, method: "baseline",
    completedSessions: completed.length,
    loggedDays: new Set(completed.map(s => format(new Date(s.startedAt), "yyyy-MM-dd"))).size,
    loggedSeconds24h: suspicious ? 0 : sleepSecondsBetween(unique, new Date(now.getTime() - DAY), now),
    typicalSessionMinutes: completed.length ? Math.round(median(completed.map(s => (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000))) : null,
    awakeMinutes: !active.length && anchor ? Math.floor((now.getTime() - anchor.getTime()) / 60000) : null,
    reference: dateOfBirth ? sleepReferenceHours(dateOfBirth, now) : null,
    validation: null,
  };
  if (suspicious || active.length || !anchor) return result;
  if (now.getTime() - anchor.getTime() > DAY) return { ...result, state: "stale", awakeMinutes: null };
  const pairs = completed.slice(1).map((s, i) => ({ anchor: new Date(completed[i]!.endedAt!), previousHours: (new Date(completed[i]!.endedAt!).getTime() - new Date(completed[i]!.startedAt).getTime()) / HOUR, gap: new Date(s.startedAt).getTime() - new Date(completed[i]!.endedAt!).getTime() })).filter(p => p.gap > 0 && p.gap <= 12 * HOUR);
  let errors = 0, baselineErrors = 0, samples = 0;
  for (let i = Math.max(4, pairs.length - 8); i < pairs.length; i++) {
    const target = pairs[i]!;
    const history = pairs.slice(0, i);
    const candidate = predict(history, target.anchor, target.previousHours);
    if (!candidate) continue;
    samples++;
    errors += Math.abs(candidate.middle - target.gap) / 60000;
    baselineErrors += Math.abs(median(history.map(p => p.gap)) - target.gap) / 60000;
  }
  if (samples) result.validation = { samples, adaptiveErrorMinutes: errors / samples, baselineErrorMinutes: baselineErrors / samples };
  const candidate = predict(pairs, anchor, (anchor.getTime() - new Date(latest!.startedAt).getTime()) / HOUR);
  const baseline = forecastSleep(completed, now);
  if (candidate && samples >= 3 && errors < baselineErrors * .95) {
    result.method = "adaptive";
    result.forecast = { at: new Date(anchor.getTime() + candidate.middle), earliest: new Date(anchor.getTime() + candidate.low), latest: new Date(anchor.getTime() + candidate.high), samples: candidate.count, confidence: "established" };
  } else result.forecast = baseline;
  if (result.forecast) result.state = "ready";
  return result;
}

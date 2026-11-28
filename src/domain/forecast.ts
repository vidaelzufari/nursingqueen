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

export interface ProjectedWindow extends Forecast { step: number }
/** Later windows reuse observed intervals only; simulated events never become training data. */
export function projectFeedWindows(times: Date[], now: Date, count = 3): ProjectedWindow[] {
  if (count < 1) return [];
  const first = forecastNext(times, now);
  if (!first || first.latest < now || first.at <= now) return [];
  const sorted = [...new Set(times.filter(t => Number.isFinite(t.getTime()) && t<=now && now.getTime()-t.getTime()<=7*DAY).map(t=>t.getTime()))].sort((a,b)=>a-b);
  const intervals = sorted.slice(1).map((time,i)=>({gap:time-sorted[i]!,hour:new Date(sorted[i]!).getHours()}));
  const result:ProjectedWindow[]=[{...first,step:1}];
  for(let step=2;step<=Math.min(3,count);step++) {
    // Farther projections need a stronger history than a single next-event estimate.
    if(first.samples<5)break;
    const previous=result[result.length-1]!;
    const next=estimate(previous.at,intervals);
    if(!next || next.at.getTime()-now.getTime()>12*3600000)break;
    const spread=Math.max(15*60000,(next.latest.getTime()-next.earliest.getTime())/2)*step;
    result.push({...next,step,earliest:new Date(next.at.getTime()-spread),latest:new Date(next.at.getTime()+spread),confidence:"early"});
  }
  return result;
}
/** Alternates awake and sleep intervals from completed daytime logs. No extrapolated bedtime. */
export function projectSleepWindows(sessions: {startedAt:string;endedAt:string|null;period?:string|null}[], first:Forecast|null, now:Date):ProjectedWindow[] {
  if(!first || first.at<=now || first.latest<now || sessions.some(s=>!s.endedAt))return [];
  const result:ProjectedWindow[]=[{...first,step:1}];
  const naps=sessions.filter(s=>s.endedAt && s.period==="nap" && new Date(s.endedAt)<=now && new Date(s.startedAt)<new Date(s.endedAt) && now.getTime()-new Date(s.startedAt).getTime()<=7*DAY).sort((a,b)=>Date.parse(a.startedAt)-Date.parse(b.startedAt));
  if(naps.length<6 || new Set(naps.map(s=>new Date(s.startedAt).toDateString())).size<3)return result;
  const durations=naps.map(s=>Date.parse(s.endedAt!)-Date.parse(s.startedAt)).filter(d=>d>0&&d<=4*3600000);
  const gaps=naps.slice(1).map((s,i)=>Date.parse(s.startedAt)-Date.parse(naps[i]!.endedAt!)).filter(g=>g>=15*60000&&g<=6*3600000);
  if(durations.length<5||gaps.length<4)return result;
  const cycle=quantile(durations,.5)+quantile(gaps,.5);
  for(let step=2;step<=3;step++) {
    const at=new Date(first.at.getTime()+(step-1)*cycle);
    // Avoid turning a daytime nap pattern into a nighttime prediction.
    if(at.getHours()<7||at.getHours()>=19||at.getTime()-now.getTime()>12*3600000)break;
    const spread=Math.max(20*60000,(quantile(gaps,.75)-quantile(gaps,.25))/2)*step;
    result.push({...first,at,step,earliest:new Date(at.getTime()-spread),latest:new Date(at.getTime()+spread),confidence:"early"});
  }
  return result;
}

import { addDays, startOfDay } from "date-fns";
import { NursingSession, BottleEvent, PumpEvent, SleepSession } from "@/db/types";
import { Moment } from "@/db/repositories/momentRepository";
import { SolidMeal } from "@/db/repositories/foodRepository";
import { sleepPeriod, sleepSecondsBetween } from "./sleep";
export type DayEventKind = "nursing" | "bottle" | "pump" | "nap" | "night" | "solids" | "moment";
export interface DayEvent { id: string; kind: DayEventKind; at: Date; end: Date | null; running: boolean; minutes: number | null; ml: number | null; foodIds?: string[]; title?:string; photoUri?:string|null; route: string }
export function summarizeDay(day: Date, now: Date, nursing: NursingSession[], bottles: BottleEvent[], pumps: PumpEvent[], sleep: SleepSession[], meals: SolidMeal[], moments: Moment[] = []) {
  const from = startOfDay(day), until = new Date(Math.min(addDays(from, 1).getTime(), now.getTime()));
  const inside = (value: string) => { const time = new Date(value); return time >= from && time < addDays(from, 1) && time <= now; };
  const events: DayEvent[] = [];
  for (const s of nursing.filter(s => inside(s.startedAt))) events.push({ id:s.id, kind:"nursing", at:new Date(s.startedAt), end:s.endedAt?new Date(s.endedAt):null, running:!s.endedAt, minutes:s.endedAt ? Math.max(0,(new Date(s.endedAt).getTime()-new Date(s.startedAt).getTime())/60000) : null, ml:s.milkMl??null, route:`/entry/nursing/${s.id}` });
  for (const s of bottles.filter(s => inside(s.occurredAt))) events.push({id:s.id,kind:"bottle",at:new Date(s.occurredAt),end:null,running:false,minutes:null,ml:s.ml,route:`/entry/bottle/${s.id}`});
  for (const s of pumps.filter(s => inside(s.startedAt))) events.push({id:s.id,kind:"pump",at:new Date(s.startedAt),end:null,running:false,minutes:null,ml:s.totalMl,route:`/entry/pump/${s.id}`});
  for (const s of sleep) {
    const at=new Date(s.startedAt), end=s.endedAt?new Date(s.endedAt):null;
    if (!Number.isFinite(at.getTime()) || at>now || (end && (!Number.isFinite(end.getTime()) || end<=at || end>now))) continue;
    if (at<until && (!end || end>from)) events.push({id:s.id,kind:sleepPeriod(s),at,end,running:!end,minutes:sleepSecondsBetween([s],from,until)/60,ml:null,route:`/sleep?id=${s.id}`});
  }
  for (const s of meals.filter(s => inside(s.occurredAt))) events.push({id:s.id,kind:"solids",at:new Date(s.occurredAt),end:null,running:false,minutes:null,ml:s.ml,foodIds:s.foodIds,route:`/modals/meal-entry?id=${s.id}`});
  for (const m of moments.filter(m=>inside(m.occurredAt))) events.push({id:m.id,kind:"moment",at:new Date(m.occurredAt),end:null,running:false,minutes:null,ml:null,title:m.title,photoUri:m.photoUri,route:`/moments?id=${m.id}`});
  events.sort((a,b)=>a.at.getTime()-b.at.getTime());
  return {events,feeds:events.filter(e=>e.kind==="nursing"||e.kind==="bottle").length,
    bottleMl:events.filter(e=>e.kind==="bottle").reduce((s,e)=>s+(e.ml??0),0),
    pumpMl:events.filter(e=>e.kind==="pump").reduce((s,e)=>s+(e.ml??0),0),
    nursingMinutes:events.filter(e=>e.kind==="nursing").reduce((s,e)=>s+(e.minutes??0),0),
    napMinutes:events.filter(e=>e.kind==="nap").reduce((s,e)=>s+(e.minutes??0),0),
    nightMinutes:events.filter(e=>e.kind==="night").reduce((s,e)=>s+(e.minutes??0),0),
    meals:events.filter(e=>e.kind==="solids").length};
}

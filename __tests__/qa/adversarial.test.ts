import { forecastNext } from '@/domain/forecast';
import { getSleepInsights } from '@/domain/sleepInsights';
import { parseWeightKg } from '@/domain/weight';
import { parseAmount } from '@/domain/units';
import { SleepSession } from '@/db/types';

it.each(['', ' ', '-1', '0', 'NaN', 'Infinity', '1e3', '5.2.3', '5kg', '<script>', '99999999999999999999', '5,1234'])('rejects malformed weight %j', input => { expect(parseWeightKg(input)).toBeNull(); });
it.each(['', '-5', '0', 'NaN', 'Infinity', '2e5', '5.5.5', '<script>', '1/2'])('rejects malformed bottle/pump amount %j', input => { expect(parseAmount(input,'ml')).toBeNull(); expect(parseAmount(input,'oz')).toBeNull(); });
it('keeps forecasts finite, ordered and immutable across 1000 deterministic dirty histories', () => {
 let seed=25112026;
 const random=() => { seed=(1664525*seed+1013904223)>>>0; return seed/4294967296; };
 const now=new Date('2026-11-25T12:00:00Z');
 for(let run=0;run<1000;run++) {
  const sessions: SleepSession[]=[]; const dates: Date[]=[];
  for(let i=0;i<20;i++) {
   const start=new Date(now.getTime()+(random()*18-16)*86400000);
   const end=random()<.15 ? null : new Date(start.getTime()+(random()*30-2)*3600000).toISOString();
   dates.push(random()<.1 ? new Date('invalid') : start);
   const entry:SleepSession={id:`qa-${i}`,babyId:'qa',startedAt:random()<.1?'invalid':start.toISOString(),endedAt:end,createdAt:now.toISOString(),updatedAt:now.toISOString()};
   sessions.push(entry); if(random()<.1) sessions.push({...entry});
  }
  const original=JSON.stringify(sessions);
  const personal=forecastNext(dates,now); const sleep=getSleepInsights(sessions,now,'2026-06-01');
  for(const prediction of [personal,sleep.forecast]) if(prediction) {
   expect(Number.isFinite(prediction.at.getTime())).toBe(true);
   expect(prediction.earliest.getTime()).toBeLessThanOrEqual(prediction.at.getTime());
   expect(prediction.at.getTime()).toBeLessThanOrEqual(prediction.latest.getTime());
  }
  expect(Number.isFinite(sleep.loggedSeconds24h)).toBe(true);
  expect(sleep.loggedSeconds24h).toBeGreaterThanOrEqual(0);
  expect(sleep.loggedSeconds24h).toBeLessThanOrEqual(86400);
  if(['review','stale','sleeping','learning'].includes(sleep.state)) expect(sleep.forecast).toBeNull();
  expect(JSON.stringify(sessions)).toBe(original);
 }
});
it.each(['٩٥','۹۵','95'])('accepts localized digits %s for volume entry', input => { expect(parseAmount(input,'ml')).toBe(95); });
it.each(['٣٫٥','۳٫۵','3,5'])('accepts localized decimal ounces %s', input => { expect(parseAmount(input,'oz')).toBe(104); });

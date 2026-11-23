import { getSleepInsights } from "@/domain/sleepInsights";
import { SleepSession } from "@/db/types";
const now = new Date("2026-11-20T12:00:00Z");
const session = (start: string | Date, end: string | Date | null): SleepSession => ({ id: String(start), babyId: "baby", startedAt: new Date(start).toISOString(), endedAt: end ? new Date(end).toISOString() : null, createdAt: now.toISOString(), updatedAt: now.toISOString() });
const hours = (day: number, hour: number) => new Date(Date.UTC(2026, 10, day, hour));

it("shows a learning state without inventing a nap time or infant age target", () => {
  const result = getSleepInsights([], now, "2026-10-01");
  expect(result.state).toBe("learning");
  expect(result.forecast).toBeNull();
  expect(result.reference).toBeNull();
  expect(result.typicalSessionMinutes).toBeNull();
});
it("uses age only for daily context, never to manufacture a next-sleep countdown", () => {
  const result = getSleepInsights([], now, "2026-04-01");
  expect(result.reference).toEqual({ min: 12, max: 16 });
  expect(result.forecast).toBeNull();
});
it("counts only the portion inside the last 24 hours and reports awake time", () => {
  const result = getSleepInsights([session(hours(19,10), hours(19,13)), session(hours(20,9), hours(20,10))], now);
  expect(result.loggedSeconds24h).toBe(7200);
  expect(result.awakeMinutes).toBe(120);
  expect(result.typicalSessionMinutes).toBe(120);
});
it("updates active-sleep totals while withholding a new sleep estimate", () => {
  const result = getSleepInsights([session(hours(20,11), null)], now);
  expect(result.state).toBe("sleeping");
  expect(result.loggedSeconds24h).toBe(3600);
  expect(result.awakeMinutes).toBeNull();
  expect(result.forecast).toBeNull();
});
it("catches a timer left running even when it began before the training lookback", () => {
  expect(getSleepInsights([session(hours(1,10), null)], now).state).toBe("review");
});
it("requests review of overlaps, invalid end times and unusually long sessions", () => {
  expect(getSleepInsights([session(hours(20,8), hours(20,10)), session(hours(20,9), hours(20,11))], now).state).toBe("review");
  expect(getSleepInsights([session(hours(20,10), hours(20,9))], now).state).toBe("review");
  expect(getSleepInsights([session(hours(18,10), hours(20,9))], now).state).toBe("review");
  expect(getSleepInsights([session(hours(20,10), null), session(hours(20,11), null)], now).state).toBe("review");
});
it("ignores future or invalid starts, deduplicates records and withholds stale predictions", () => {
  const record = session(hours(18,8), hours(18,9));
  const result = getSleepInsights([record, record, session(hours(21,8), hours(21,9)), { ...record, startedAt: "invalid" }], now);
  expect(result.completedSessions).toBe(1);
  expect(result.state).toBe("stale");
  expect(result.forecast).toBeNull();
});
it("falls back to the simple personal baseline for a sparse but consistent history", () => {
  const result = getSleepInsights([session(hours(20,4), hours(20,5)), session(hours(20,7), hours(20,8)), session(hours(20,10), hours(20,11))], now);
  expect(result.state).toBe("ready");
  expect(result.method).toBe("baseline");
  expect(result.forecast?.at.toISOString()).toBe("2026-11-20T13:00:00.000Z");
});
it("does not promote an adaptive model when it cannot beat a regular median baseline", () => {
  const records: SleepSession[] = [];
  for (let day = 10; day <= 20; day++) records.push(session(hours(day,8), hours(day,9)), session(hours(day,11), hours(day,12)), session(hours(day,14), hours(day,15)));
  const result = getSleepInsights(records, new Date("2026-11-20T16:00Z"));
  expect(result.method).toBe("baseline");
  expect(result.validation?.samples).toBeGreaterThanOrEqual(3);
});
it("learns time-of-day patterns and promotes only after chronological holdouts improve", () => {
  const records: SleepSession[] = [];
  for (let day = 10; day <= 20; day++) records.push(session(hours(day,6), hours(day,7)), session(hours(day,8), hours(day,9)), session(hours(day,12), hours(day,13)), session(hours(day,17), hours(day,18)));
  const result = getSleepInsights(records, new Date("2026-11-20T19:00Z"));
  expect(result.validation!.samples).toBeGreaterThanOrEqual(3);
  expect(result.validation!.adaptiveErrorMinutes).toBeLessThan(result.validation!.baselineErrorMinutes);
  expect(result.method).toBe("adaptive");
  expect(result.forecast).not.toBeNull();
});
it("does not train on a future outcome", () => {
  const records = [session(hours(20,4), hours(20,5)), session(hours(20,7), hours(20,8)), session(hours(20,10), hours(20,11))];
  expect(getSleepInsights([...records, session(hours(20,15), hours(20,16))], now)).toEqual(getSleepInsights(records, now));
});

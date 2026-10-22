import { countdown, forecastNext, forecastSleep } from "@/domain/forecast";
import { sleepSecondsToday, sleepSecondsBetween, validSleepRange } from "@/domain/sleep";
import { SleepSession } from "@/db/types";
const now = new Date("2026-10-22T12:00:00Z");
const sleep = (start: string, end: string | null): SleepSession => ({ id: start, babyId: "a", startedAt: start, endedAt: end, createdAt: start, updatedAt: start });

it("uses the median observed interval and needs enough recent data", () => {
  expect(forecastNext([new Date("2026-10-22T06:00:00Z"), new Date("2026-10-22T08:00:00Z"), new Date("2026-10-22T10:00:00Z")], now)?.at.toISOString()).toBe("2026-10-22T12:00:00.000Z");
  expect(forecastNext([new Date("2026-10-22T10:00:00Z")], now)).toBeNull();
  expect(forecastNext([new Date("2026-10-10"), new Date("2026-10-11"), new Date("2026-10-12")], now)).toBeNull();
});
it("estimates sleep from observed awake gaps, never from sleep duration", () => {
  const result = forecastSleep([sleep("2026-10-22T04:00:00Z", "2026-10-22T05:00:00Z"), sleep("2026-10-22T07:00:00Z", "2026-10-22T08:00:00Z"), sleep("2026-10-22T10:00:00Z", "2026-10-22T11:00:00Z")], now);
  expect(result?.at.toISOString()).toBe("2026-10-22T13:00:00.000Z");
});
it("clips overnight and active sleep to today's local midnight", () => {
  const localNow = new Date(2026, 9, 22, 2, 0, 0);
  const overnight = sleep(new Date(2026, 9, 21, 23).toISOString(), new Date(2026, 9, 22, 1).toISOString());
  expect(sleepSecondsToday([overnight], localNow)).toBe(3600);
  expect(sleepSecondsToday([sleep(new Date(2026, 9, 22, 1).toISOString(), null)], localNow)).toBe(3600);
  expect(sleepSecondsBetween([overnight], new Date(2026, 9, 21), new Date(2026, 9, 22))).toBe(3600);
});
it("validates manual sleep ranges and never displays a negative countdown", () => {
  expect(validSleepRange(new Date("2026-10-22T10:00Z"), new Date("2026-10-22T11:00Z"), now)).toBe(true);
  expect(validSleepRange(now, new Date("2026-10-22T11:00Z"), now)).toBe(false);
  expect(validSleepRange(now, new Date("2026-10-23T11:00Z"), now)).toBe(false);
  expect(countdown(new Date("2026-10-22T13:02:03Z"), now)).toBe("01:02:03");
  expect(countdown(new Date("2026-10-22T11:00Z"), now)).toBe("00:00:00");
});

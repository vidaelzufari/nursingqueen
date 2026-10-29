import { nursingRepository } from "@/db/repositories/nursingRepository";
import { sleepRepository } from "@/db/repositories/sleepRepository";
import { pumpRepository } from "@/db/repositories/pumpRepository";
import { migrations } from "@/db/schema";

let mockDatabase: object;
jest.mock("@/db/client", () => ({ getDatabase: () => mockDatabase }));

// sql.js exposes its bundled engine as untyped CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require("sql.js/dist/sql-asm.js");
let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  const db = new SQL.Database();
  for (const migration of migrations) for (const statement of migration.statements) db.run(statement);
  const query = (sql: string, params: unknown[] = []) => {
    const statement = db.prepare(sql);
    try {
      statement.bind(params);
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally { statement.free(); }
  };
  mockDatabase = {
    runSync: (sql: string, params: unknown[]) => db.run(sql, params),
    getFirstSync: (sql: string, params: unknown[]) => query(sql, params)[0] ?? null,
    getAllSync: query,
  };
});

it("stores a quick pump total without inventing left/right amounts", () => {
  const event = pumpRepository.logPending("preview-baby");
  pumpRepository.addTotal(event.id, 120);
  expect(pumpRepository.listByBaby("preview-baby")[0]).toMatchObject({ totalMl: 120, leftMl: null, rightMl: null, needsDetail: false });
  pumpRepository.update(event.id, { note: "Later edit" });
  expect(pumpRepository.listByBaby("preview-baby")[0]).toMatchObject({ totalMl: 120, note: "Later edit", needsDetail: false });
});

it("can replace a quick total with an explicit side breakdown", () => {
  const event = pumpRepository.logPending("preview-baby");
  pumpRepository.addTotal(event.id, 120);
  pumpRepository.addDetail(event.id, 40, 70);
  expect(pumpRepository.listByBaby("preview-baby")[0]).toMatchObject({ totalMl: 110, leftMl: 40, rightMl: 70 });
});

it.each([NaN, Infinity, -1, 0])("rejects an invalid total %s", amount => {
  const event = pumpRepository.logPending("preview-baby");
  expect(() => pumpRepository.addTotal(event.id, amount)).toThrow("Invalid pump amount");
  expect(pumpRepository.listByBaby("preview-baby")[0]?.needsDetail).toBe(true);
});

it("persists one active sleep per baby and isolates baby histories", () => {
  sleepRepository.start("baby-a"); sleepRepository.start("baby-a"); sleepRepository.start("baby-b");
  expect(sleepRepository.list("baby-a")).toHaveLength(1);
  const active = sleepRepository.list("baby-a")[0]!;
  sleepRepository.stop(active.id);
  expect(sleepRepository.list("baby-a")[0]?.endedAt).not.toBeNull();
  expect(sleepRepository.list("baby-b")[0]?.endedAt).toBeNull();
});
it("allows editing sleep without duplicates and rejects overlapping sessions", () => {
  const start = new Date("2026-01-01T10:00Z"); const end = new Date("2026-01-01T11:00Z");
  sleepRepository.save("baby-a", start, end);
  const entry = sleepRepository.list("baby-a")[0]!;
  sleepRepository.save("baby-a", start, new Date("2026-01-01T11:30Z"), entry.id);
  expect(sleepRepository.list("baby-a")).toHaveLength(1);
  expect(() => sleepRepository.save("baby-a", new Date("2026-01-01T11:00Z"), new Date("2026-01-01T12:00Z"))).toThrow("Overlapping sleep");
  sleepRepository.delete(entry.id);
  expect(sleepRepository.list("baby-a")).toHaveLength(0);
});

it("saves a forgotten nursing session at its actual earlier times", () => {
  const end = new Date("2026-01-01T00:10:00Z");
  nursingRepository.logCompletedSession("baby-a", 20 * 60, "left", end);
  const saved = nursingRepository.listByBaby("baby-a")[0]!;
  expect(saved.startedAt).toBe("2025-12-31T23:50:00.000Z");
  expect(saved.endedAt).toBe(end.toISOString());
  expect(saved.durationSeconds).toBe(1200);
  expect(saved.side).toBe("left");
});
it("rejects invalid and future nursing entries", () => {
  expect(() => nursingRepository.logCompletedSession("baby-a", -60)).toThrow();
  expect(() => nursingRepository.logCompletedSession("baby-a", 60, "unknown", new Date(Date.now() + 86400000))).toThrow();
});

it("adjusts an active sleep start time without ending or duplicating the session", () => {
  sleepRepository.start("baby-a");
  const active = sleepRepository.list("baby-a")[0]!;
  sleepRepository.adjustStart(active.id, -60);
  const adjusted = sleepRepository.list("baby-a")[0]!;
  expect(new Date(adjusted.startedAt).getTime()).toBe(new Date(active.startedAt).getTime() - 60000);
  expect(adjusted.endedAt).toBeNull();
  expect(sleepRepository.list("baby-a")).toHaveLength(1);
  expect(() => sleepRepository.adjustStart(active.id, 120)).toThrow("Invalid sleep range");
});
it("rejects a sleep adjustment overlapping a previous session", () => {
  sleepRepository.save("baby-a", new Date("2026-01-01T10:00Z"), new Date("2026-01-01T11:00Z"));
  sleepRepository.save("baby-a", new Date("2026-01-01T11:01Z"), new Date("2026-01-01T12:00Z"));
  const later = sleepRepository.list("baby-a")[0]!;
  expect(() => sleepRepository.adjustStart(later.id, -120)).toThrow("Overlapping sleep");
});

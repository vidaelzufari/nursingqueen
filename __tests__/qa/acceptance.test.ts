import { migrations } from "@/db/schema";
import { sleepRepository } from "@/db/repositories/sleepRepository";
import { nursingRepository } from "@/db/repositories/nursingRepository";
import { bottleRepository } from "@/db/repositories/bottleRepository";
import { weightRepository } from "@/db/repositories/weightRepository";
import { parseWeightKg } from "@/domain/weight";

let mockDatabase: object;
jest.mock("@/db/client", () => ({ getDatabase: () => mockDatabase }));
// Real SQLite engine, with synthetic data only.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require("sql.js/dist/sql-asm.js");
let SQL: Awaited<ReturnType<typeof initSqlJs>>;
let db: any; // eslint-disable-line @typescript-eslint/no-explicit-any
beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  db = new SQL.Database();
  for (const migration of migrations) for (const statement of migration.statements) db.run(statement);
  const query = (sql: string, params: unknown[] = []) => {
    const statement = db.prepare(sql);
    try { statement.bind(params); const rows = []; while (statement.step()) rows.push(statement.getAsObject()); return rows; }
    finally { statement.free(); }
  };
  mockDatabase = { runSync: (sql: string, params: unknown[]) => db.run(sql, params), getFirstSync: (sql: string, params: unknown[]) => query(sql, params)[0] ?? null, getAllSync: query };
});
afterEach(() => db.close());

it.each([1, 2, 3, 4])("preserves an installed version %i profile and weight through all later migrations", version => {
  const old = new SQL.Database();
  for (const m of migrations.filter(m => m.version <= version)) for (const s of m.statements) old.run(s);
  old.run("INSERT INTO babies VALUES ('qa-baby','Test','file:///local.jpg','2026-06-01',0,'2026-06-01')");
  old.run("INSERT INTO weight_entries VALUES ('qa-weight','qa-baby',5250,'2026-07-01','2026-07-01')");
  for (const m of migrations.filter(m => m.version > version)) for (const s of m.statements) old.run(s);
  expect(old.exec("SELECT name,photo_uri,date_of_birth FROM babies")[0].values[0]).toEqual(['Test','file:///local.jpg','2026-06-01']);
  expect(old.exec("SELECT weight_grams FROM weight_entries")[0].values[0][0]).toBe(5250);
  expect(old.exec("PRAGMA integrity_check")[0].values[0][0]).toBe('ok');
  old.close();
});
it.each(['5,25', '5.25', '٥٫٢٥', '۵٫۲۵'])("persists kg input %s as 5250 g", input => {
  weightRepository.create('qa-baby', parseWeightKg(input)!);
  expect(weightRepository.listByBaby('qa-baby')[0]?.weightGrams).toBe(5250);
});
it.each(['nap', 'night'] as const)("retains explicit %s through stop and subsequent edit", period => {
  sleepRepository.start('qa-baby', period);
  const id = sleepRepository.list('qa-baby')[0]!.id;
  sleepRepository.stop(id);
  expect(sleepRepository.list('qa-baby')[0]?.period).toBe(period);
  sleepRepository.save('qa-baby', new Date('2026-01-01T09:00Z'), new Date('2026-01-01T10:00Z'), id, period);
  expect(sleepRepository.list('qa-baby')).toHaveLength(1);
  expect(sleepRepository.list('qa-baby')[0]?.period).toBe(period);
});
it("edits nursing volume without changing the live timer or side", () => {
  const session = nursingRepository.startSession('qa-baby', 'left');
  nursingRepository.update(session.id, { milkMl: 95 });
  expect(nursingRepository.getOpenSession('qa-baby')).toMatchObject({ id: session.id, side:'left', startedAt:session.startedAt, endedAt:null, milkMl:95 });
});
it("supports a pending bottle amount, a later amount correction and an exact stored timestamp", () => {
  const event = bottleRepository.create({babyId:'qa-baby', ml:null, milkType:'breast_milk', occurredAt:new Date('2026-01-01T10:15:37.123Z')});
  bottleRepository.update(event.id, {ml:110});
  bottleRepository.update(event.id, {ml:95});
  expect(bottleRepository.listByBaby('qa-baby')[0]).toMatchObject({ml:95,needsDetail:false,occurredAt:'2026-01-01T10:15:37.123Z'});
});
it('does not duplicate nursing on repeated starts and preserves the first stop', () => {
  const first=nursingRepository.startSession('qa','left');
  const second=nursingRepository.startSession('qa','right');
  expect(second.id).toBe(first.id);
  const stopped=nursingRepository.stopSession(first.id)!;
  const retried=nursingRepository.stopSession(first.id)!;
  expect(retried.endedAt).toBe(stopped.endedAt);
  expect(nursingRepository.listByBaby('qa')).toHaveLength(1);
});
it.each([new Date('invalid'),new Date('2099-01-01'),new Date('2000-01-01')])('rejects invalid, future or reversed nursing stop %s', end => {
  const first=nursingRepository.startSession('qa');
  expect(()=>nursingRepository.stopSession(first.id,end)).toThrow('Invalid nursing time range');
  expect(nursingRepository.getOpenSession('qa')?.id).toBe(first.id);
});
it.each([0,-20,NaN,Infinity])('rejects invalid bottle amount %s on both create and update', ml => {
  expect(()=>bottleRepository.create({babyId:'qa',ml,milkType:'formula'})).toThrow('Invalid bottle amount');
  const entry=bottleRepository.create({babyId:'qa',ml:null,milkType:'formula'});
  expect(()=>bottleRepository.update(entry.id,{ml})).toThrow('Invalid bottle amount');
  expect(bottleRepository.listByBaby('qa')[0]?.ml).toBeNull();
});
it('rejects a second open nursing row at the SQLite boundary, including reopening a completed row', () => {
  const live = nursingRepository.startSession('qa', 'left');
  expect(() => db.run("INSERT INTO nursing_sessions SELECT 'other',baby_id,side,started_at,ended_at,duration_seconds,note,created_at,updated_at,milk_ml FROM nursing_sessions WHERE id=?", [live.id])).toThrow('nursing_session_already_active');
  const old = nursingRepository.logCompletedSession('qa', 60);
  expect(() => nursingRepository.update(old.id, { endedAt: null })).toThrow('nursing_session_already_active');
  expect(nursingRepository.getOpenSession('qa')?.id).toBe(live.id);
});
it('upgrades legacy duplicate timers without deleting or inventing end times', () => {
  const old = new SQL.Database();
  for (const m of migrations.filter(m => m.version < 7)) for (const s of m.statements) old.run(s);
  for (const id of ['a','b']) old.run("INSERT INTO nursing_sessions (id,baby_id,side,started_at,created_at,updated_at) VALUES (?,'qa','left','2026-01-01','2026-01-01','2026-01-01')", [id]);
  for (const s of migrations.find(m => m.version === 7)!.statements) old.run(s);
  expect(old.exec('SELECT COUNT(*) FROM nursing_sessions WHERE ended_at IS NULL')[0].values[0][0]).toBe(2);
  expect(() => old.run("INSERT INTO nursing_sessions (id,baby_id,side,started_at,created_at,updated_at) VALUES ('c','qa','right','2026-01-01','2026-01-01','2026-01-01')")).toThrow();
  old.run("UPDATE nursing_sessions SET ended_at='2026-01-02' WHERE id='a'");
  expect(old.exec('PRAGMA integrity_check')[0].values[0][0]).toBe('ok');
  old.close();
});

import { getDatabase } from "../client";
import { generateId } from "../id";
import { SleepSession, SleepPeriod } from "../types";
import { validSleepRange, defaultSleepPeriod } from "@/domain/sleep";
interface Row { period: SleepPeriod | null; id: string; baby_id: string; started_at: string; ended_at: string | null; created_at: string; updated_at: string }
const fromRow = (r: Row): SleepSession => ({ period: r.period, id: r.id, babyId: r.baby_id, startedAt: r.started_at, endedAt: r.ended_at, createdAt: r.created_at, updatedAt: r.updated_at });
export const sleepRepository = {
  list(babyId: string): SleepSession[] {
    return getDatabase().getAllSync<Row>("SELECT * FROM sleep_sessions WHERE baby_id = ? ORDER BY started_at DESC;", [babyId]).map(fromRow);
  },
  start(babyId: string, period: SleepPeriod = defaultSleepPeriod(new Date())): void {
    const now = new Date().toISOString();
    getDatabase().runSync("INSERT OR IGNORE INTO sleep_sessions (id, baby_id, started_at, ended_at, created_at, updated_at, period) VALUES (?, ?, ?, NULL, ?, ?, ?);", [generateId(), babyId, now, now, now, period]);
  },
  setPeriod(id: string, period: SleepPeriod): void {
    getDatabase().runSync("UPDATE sleep_sessions SET period = ?, updated_at = ? WHERE id = ?;", [period, new Date().toISOString(), id]);
  },
  stop(id: string): void {
    const now = new Date().toISOString();
    getDatabase().runSync("UPDATE sleep_sessions SET ended_at = ?, updated_at = ? WHERE id = ? AND ended_at IS NULL;", [now, now, id]);
  },
  adjustStart(id: string, offsetSeconds: number): void {
    if (!Number.isFinite(offsetSeconds)) throw new Error("Invalid sleep adjustment");
    const db = getDatabase();
    const row = db.getFirstSync<Row>("SELECT * FROM sleep_sessions WHERE id = ?;", [id]);
    if (!row) return;
    const proposed = new Date(new Date(row.started_at).getTime() + offsetSeconds * 1000);
    const end = row.ended_at ? new Date(row.ended_at) : new Date();
    if (proposed >= end) throw new Error("Invalid sleep range");
    const overlap = db.getFirstSync<{ id: string }>("SELECT id FROM sleep_sessions WHERE baby_id = ? AND id != ? AND started_at < ? AND (ended_at IS NULL OR ended_at > ?) LIMIT 1;", [row.baby_id, id, end.toISOString(), proposed.toISOString()]);
    if (overlap) throw new Error("Overlapping sleep");
    db.runSync("UPDATE sleep_sessions SET started_at = ?, updated_at = ? WHERE id = ?;", [proposed.toISOString(), new Date().toISOString(), id]);
  },
  updateRunning(babyId: string, id: string, start: Date, period: SleepPeriod): void {
    const now = new Date();
    if (!Number.isFinite(start.getTime()) || start > now) throw new Error("Invalid sleep range");
    const db = getDatabase();
    const row = db.getFirstSync<Row>("SELECT * FROM sleep_sessions WHERE id = ? AND baby_id = ?;", [id, babyId]);
    // Do not reopen a session that was stopped on another surface while editing.
    if (!row || row.ended_at) throw new Error("Sleep is no longer running");
    const overlap = db.getFirstSync<{ id: string }>("SELECT id FROM sleep_sessions WHERE baby_id = ? AND id != ? AND (ended_at IS NULL OR ended_at > ?) LIMIT 1;", [babyId, id, start.toISOString()]);
    if (overlap) throw new Error("Overlapping sleep");
    db.runSync("UPDATE sleep_sessions SET started_at = ?, period = ?, updated_at = ? WHERE id = ? AND baby_id = ? AND ended_at IS NULL;", [start.toISOString(), period, now.toISOString(), id, babyId]);
  },
  save(babyId: string, start: Date, end: Date, id?: string, period: SleepPeriod = defaultSleepPeriod(start)): void {
    if (!validSleepRange(start, end)) throw new Error("Invalid sleep range");
    const db = getDatabase();
    const overlap = db.getFirstSync<{ id: string }>("SELECT id FROM sleep_sessions WHERE baby_id = ? AND id != ? AND started_at < ? AND (ended_at IS NULL OR ended_at > ?) LIMIT 1;", [babyId, id ?? "", end.toISOString(), start.toISOString()]);
    if (overlap) throw new Error("Overlapping sleep");
    const now = new Date().toISOString();
    if (id) db.runSync("UPDATE sleep_sessions SET started_at = ?, ended_at = ?, updated_at = ?, period = ? WHERE id = ? AND baby_id = ?;", [start.toISOString(), end.toISOString(), now, period, id, babyId]);
    else db.runSync("INSERT INTO sleep_sessions (id, baby_id, started_at, ended_at, created_at, updated_at, period) VALUES (?, ?, ?, ?, ?, ?, ?);", [generateId(), babyId, start.toISOString(), end.toISOString(), now, now, period]);
  },
  delete(id: string): void { getDatabase().runSync("DELETE FROM sleep_sessions WHERE id = ?;", [id]); },
};

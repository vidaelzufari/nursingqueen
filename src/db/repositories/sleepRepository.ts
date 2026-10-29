import { getDatabase } from "../client";
import { generateId } from "../id";
import { SleepSession } from "../types";
import { validSleepRange } from "@/domain/sleep";
interface Row { id: string; baby_id: string; started_at: string; ended_at: string | null; created_at: string; updated_at: string }
const fromRow = (r: Row): SleepSession => ({ id: r.id, babyId: r.baby_id, startedAt: r.started_at, endedAt: r.ended_at, createdAt: r.created_at, updatedAt: r.updated_at });
export const sleepRepository = {
  list(babyId: string): SleepSession[] {
    return getDatabase().getAllSync<Row>("SELECT * FROM sleep_sessions WHERE baby_id = ? ORDER BY started_at DESC;", [babyId]).map(fromRow);
  },
  start(babyId: string): void {
    const now = new Date().toISOString();
    getDatabase().runSync("INSERT OR IGNORE INTO sleep_sessions (id, baby_id, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?);", [generateId(), babyId, now, now, now]);
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
  save(babyId: string, start: Date, end: Date, id?: string): void {
    if (!validSleepRange(start, end)) throw new Error("Invalid sleep range");
    const db = getDatabase();
    const overlap = db.getFirstSync<{ id: string }>("SELECT id FROM sleep_sessions WHERE baby_id = ? AND id != ? AND started_at < ? AND (ended_at IS NULL OR ended_at > ?) LIMIT 1;", [babyId, id ?? "", end.toISOString(), start.toISOString()]);
    if (overlap) throw new Error("Overlapping sleep");
    const now = new Date().toISOString();
    if (id) db.runSync("UPDATE sleep_sessions SET started_at = ?, ended_at = ?, updated_at = ? WHERE id = ? AND baby_id = ?;", [start.toISOString(), end.toISOString(), now, id, babyId]);
    else db.runSync("INSERT INTO sleep_sessions (id, baby_id, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);", [generateId(), babyId, start.toISOString(), end.toISOString(), now, now]);
  },
  delete(id: string): void { getDatabase().runSync("DELETE FROM sleep_sessions WHERE id = ?;", [id]); },
};

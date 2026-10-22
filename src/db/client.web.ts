import type { SQLiteDatabase } from "expo-sqlite";
import { migrations, LATEST_SCHEMA_VERSION } from "./schema";

type Value = string | number | null;
interface SqlDatabase {
  run(sql: string, params?: Value[]): void;
  prepare(sql: string): { bind(params: Value[]): void; step(): boolean; getAsObject(): object; free(): void };
  export(): Uint8Array;
  getRowsModified(): number;
}
interface SqlModule { Database: new (data?: Uint8Array) => SqlDatabase }
const STORAGE_KEY = "nursing-queen-preview-database";
let database: SQLiteDatabase | null = null;
let initialization: Promise<void> | null = null;

/** Browser preview uses SQLite compiled to JavaScript, stored only in this browser. */
export function initializeDatabase(): Promise<void> {
  if (initialization) return initialization;
  initialization = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/sql-asm.js";
    script.onerror = () => reject(new Error("Could not load preview database."));
    script.onload = () => {
      const init = (window as unknown as { initSqlJs: () => Promise<SqlModule> }).initSqlJs;
      void init().then((SQL) => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const sql = new SQL.Database(saved ? Uint8Array.from(atob(saved), c => c.charCodeAt(0)) : undefined);
        let transaction = false;
        const persist = () => {
          const bytes = sql.export();
          let binary = "";
          for (const byte of bytes) binary += String.fromCharCode(byte);
          localStorage.setItem(STORAGE_KEY, btoa(binary));
        };
        const query = <T,>(statement: string, params: Value[] = []): T[] => {
          const prepared = sql.prepare(statement);
          try {
            prepared.bind(params);
            const rows: T[] = [];
            while (prepared.step()) rows.push(prepared.getAsObject() as T);
            return rows;
          } finally { prepared.free(); }
        };
        const adapter = {
          execSync(statement: string) { sql.run(statement); if (!transaction) persist(); },
          runSync(statement: string, params: Value[] = []) {
            sql.run(statement, params);
            const changes = sql.getRowsModified();
            const lastInsertRowId = query<{ id: number }>("SELECT last_insert_rowid() AS id")[0]?.id ?? 0;
            if (!transaction) persist();
            return { changes, lastInsertRowId };
          },
          getAllSync: query,
          getFirstSync<T>(statement: string, params: Value[] = []): T | null { return query<T>(statement, params)[0] ?? null; },
          withTransactionSync(callback: () => void) {
            sql.run("BEGIN"); transaction = true;
            try { callback(); sql.run("COMMIT"); } catch (error) { sql.run("ROLLBACK"); throw error; }
            finally { transaction = false; }
            persist();
          },
        };
        sql.run("PRAGMA foreign_keys = ON;");
        const version = query<{ user_version: number }>("PRAGMA user_version;")[0]?.user_version ?? 0;
        if (version < LATEST_SCHEMA_VERSION) {
          for (const migration of migrations.filter(m => m.version > version)) {
            adapter.withTransactionSync(() => {
              for (const statement of migration.statements) sql.run(statement);
              sql.run(`PRAGMA user_version = ${migration.version}`);
            });
          }
        }
        database = adapter as unknown as SQLiteDatabase;
        resolve();
      }).catch(reject);
    };
    document.head.appendChild(script);
  });
  return initialization;
}

export function getDatabase(): SQLiteDatabase {
  if (!database) throw new Error("Preview database is not initialized.");
  return database;
}

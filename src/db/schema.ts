/**
 * Versioned migrations, applied in order via PRAGMA user_version. Never edit
 * a migration that has shipped — append a new one instead, so upgrades from
 * every prior installed version stay correct.
 */
export interface Migration {
  version: number;
  statements: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS babies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        photo_uri TEXT,
        date_of_birth TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS weight_entries (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        weight_grams INTEGER NOT NULL,
        measured_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_weight_entries_baby ON weight_entries(baby_id, measured_at);`,
      `CREATE TABLE IF NOT EXISTS nursing_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        side TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_nursing_baby_started ON nursing_sessions(baby_id, started_at);`,
      `CREATE TABLE IF NOT EXISTS pump_events (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        left_ml REAL,
        right_ml REAL,
        total_ml REAL,
        needs_detail INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_pump_baby_started ON pump_events(baby_id, started_at);`,
      `CREATE TABLE IF NOT EXISTS bottle_events (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        ml REAL,
        milk_type TEXT NOT NULL,
        needs_detail INTEGER NOT NULL DEFAULT 0,
        stash_item_id TEXT REFERENCES stash_items(id) ON DELETE SET NULL,
        note TEXT,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_bottle_baby_occurred ON bottle_events(baby_id, occurred_at);`,
      `CREATE TABLE IF NOT EXISTS stash_items (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        ml REAL NOT NULL,
        milk_type TEXT NOT NULL,
        pumped_at TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        thawed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_stash_baby_status ON stash_items(baby_id, status, pumped_at);`,
    ],
  },
  {
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS sleep_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_sleep_baby_started ON sleep_sessions(baby_id, started_at);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_one_active ON sleep_sessions(baby_id) WHERE ended_at IS NULL;`,
    ],
  },
  { version: 3, statements: [`ALTER TABLE nursing_sessions ADD COLUMN milk_ml REAL CHECK (milk_ml IS NULL OR milk_ml > 0);`] },
  { version: 4, statements: [`ALTER TABLE sleep_sessions ADD COLUMN period TEXT CHECK (period IS NULL OR period IN ('nap', 'night'));`] },
  { version: 5, statements: [`CREATE TABLE IF NOT EXISTS external_commands (id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL);`] },
  { version: 6, statements: [
    `CREATE TABLE foods (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT REFERENCES babies(id) ON DELETE CASCADE, catalog_key TEXT UNIQUE, name TEXT, normalized_name TEXT, photo_uri TEXT, created_at TEXT NOT NULL, UNIQUE(baby_id, normalized_name));`,
    `CREATE TABLE food_plans (baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE, food_id TEXT NOT NULL REFERENCES foods(id), PRIMARY KEY(baby_id,food_id));`,
    `CREATE TABLE solid_meals (id TEXT PRIMARY KEY NOT NULL,baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,occurred_at TEXT NOT NULL,note TEXT,spoons REAL CHECK(spoons IS NULL OR spoons>0),ml REAL CHECK(ml IS NULL OR ml>0),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`,
    `CREATE TABLE meal_foods (meal_id TEXT NOT NULL REFERENCES solid_meals(id) ON DELETE CASCADE,food_id TEXT NOT NULL REFERENCES foods(id),position INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(meal_id,food_id));`,
    `CREATE INDEX idx_solid_meals_baby_time ON solid_meals(baby_id,occurred_at);`,
    `CREATE INDEX idx_meal_foods_food ON meal_foods(food_id,meal_id);`
  ] },
  { version: 7, statements: [
    // Keep legacy rows untouched while enforcing exclusivity for all new writes,
    // including writes from the Watch bridge's separate SQLite connection.
    `CREATE TRIGGER nursing_one_active_insert BEFORE INSERT ON nursing_sessions
     WHEN NEW.ended_at IS NULL AND EXISTS(SELECT 1 FROM nursing_sessions WHERE baby_id=NEW.baby_id AND ended_at IS NULL)
     BEGIN SELECT RAISE(ABORT,'nursing_session_already_active'); END;`,
    `CREATE TRIGGER nursing_one_active_update BEFORE UPDATE OF baby_id,ended_at ON nursing_sessions
     WHEN NEW.ended_at IS NULL AND EXISTS(SELECT 1 FROM nursing_sessions WHERE baby_id=NEW.baby_id AND ended_at IS NULL AND id<>NEW.id)
     BEGIN SELECT RAISE(ABORT,'nursing_session_already_active'); END;`
  ] },

  { version: 8, statements: [`ALTER TABLE solid_meals ADD COLUMN meal_type TEXT CHECK(meal_type IS NULL OR meal_type IN ('breakfast','lunch','snack','dinner'));`] },

  { version: 9, statements: [
    `CREATE TABLE moments (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE, kind TEXT NOT NULL, title TEXT NOT NULL, occurred_at TEXT NOT NULL, note TEXT, photo_uri TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
    `CREATE INDEX idx_moments_baby_time ON moments(baby_id, occurred_at);`
  ] },
  { version: 10, statements: [`ALTER TABLE foods ADD COLUMN allergens_json TEXT NOT NULL DEFAULT '[]';`] },
];

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1]?.version ?? 0;

"""Create a new disposable SQLite fixture; never opens an existing database."""
from pathlib import Path
import re
import sqlite3
import sys

fixture = Path(sys.argv[1])
if fixture.exists():
    raise SystemExit("Refusing to replace an existing database")
fixture.touch(exist_ok=False)
with sqlite3.connect(fixture) as connection:
    schema = Path(__file__).resolve().parents[2] / "src/db/schema.ts"
    for statement in re.findall(r"`([^`]+)`", schema.read_text()):
        connection.execute(statement)
    connection.execute("INSERT INTO babies(id,name,date_of_birth,created_at) VALUES(?,?,?,?)", ("qa-baby", "Watch Test", "2026-06-01", "2026-11-26T00:00:00.000Z"))

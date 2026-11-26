import Foundation
import SQLite3

/// Uses the phone's existing database. Commands are atomic and safe to retry.
final class AppleSessionStore {
  let path: String
  init(path: String) { self.path = path }
  private var db: OpaquePointer?
  private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
  private func query(_ sql: String, _ args: [String] = []) throws -> [[String: Any]] {
    var statement: OpaquePointer?
    guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else { throw failure() }
    defer { sqlite3_finalize(statement) }
    for (i, value) in args.enumerated() { sqlite3_bind_text(statement, Int32(i + 1), value, -1, transient) }
    var rows: [[String: Any]] = []
    while true {
      let status = sqlite3_step(statement)
      if status == SQLITE_DONE { return rows }
      guard status == SQLITE_ROW else { throw failure() }
      var row: [String: Any] = [:]
      for index in 0..<sqlite3_column_count(statement) {
        if sqlite3_column_type(statement, index) != SQLITE_NULL, let text = sqlite3_column_text(statement, index) {
          row[String(cString: sqlite3_column_name(statement, index))] = String(cString: text)
        }
      }
      rows.append(row)
    }
  }
  private func failure() -> NSError { NSError(domain: "NursingQueen", code: 1, userInfo: [NSLocalizedDescriptionKey: "Open Nursing Queen on your iPhone, then try again."]) }
  private func open() throws {
    guard FileManager.default.fileExists(atPath: path), sqlite3_open_v2(path, &db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK else { throw failure() }
    sqlite3_busy_timeout(db, 5000)
  }
  private func close() { sqlite3_close(db); db = nil }
  func snapshot(babyID: String) throws -> [String: Any] {
    try open(); defer { close() }
    return try readSnapshot(babyID: babyID)
  }
  private func readSnapshot(babyID: String) throws -> [String: Any] {
    guard let baby = try query("SELECT name FROM babies WHERE id = ?", [babyID]).first else { throw failure() }
    var result: [String: Any] = ["babyName": baby["name"] ?? "", "updatedAt": Date().timeIntervalSince1970]
    for (key, table) in [("nursing", "nursing_sessions"), ("sleep", "sleep_sessions")] {
      if let row = try query("SELECT * FROM \(table) WHERE baby_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1", [babyID]).first {
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = iso.date(from: row["started_at"] as? String ?? "") ?? ISO8601DateFormatter().date(from: row["started_at"] as? String ?? "")
        result[key] = ["id": row["id"] ?? "", "startedAt": date?.timeIntervalSince1970 ?? 0, "period": row["period"] ?? "night", "side": row["side"] ?? "unknown"]
      }
    }
    return result
  }
  func perform(_ command: [String: Any], babyID: String) throws -> [String: Any] {
    try open(); defer { close() }
    guard let action = command["action"] as? String, let commandID = command["commandID"] as? String, UUID(uuidString: commandID) != nil,
      ["startNursing", "stopNursing", "startSleep", "stopSleep"].contains(action) else { throw failure() }
    _ = try query("BEGIN IMMEDIATE")
    do {
      guard try query("SELECT id FROM babies WHERE id = ?", [babyID]).first != nil else { throw failure() }
      if try query("SELECT id FROM external_commands WHERE id = ?", [commandID]).isEmpty {
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = iso.string(from: Date())
        let table = action.contains("Nursing") ? "nursing_sessions" : "sleep_sessions"
        if action.hasPrefix("start") {
          if try query("SELECT id FROM \(table) WHERE baby_id = ? AND ended_at IS NULL", [babyID]).isEmpty {
            if table == "nursing_sessions" {
              let side = ["left", "right"].contains(command["side"] as? String ?? "") ? command["side"] as! String : "unknown"
              _ = try query("INSERT INTO nursing_sessions(id,baby_id,side,started_at,created_at,updated_at) VALUES(?,?,?,?,?,?)", [UUID().uuidString, babyID, side, now, now, now])
            } else {
              let period = command["period"] as? String == "nap" ? "nap" : "night"
              _ = try query("INSERT INTO sleep_sessions(id,baby_id,started_at,created_at,updated_at,period) VALUES(?,?,?,?,?,?)", [UUID().uuidString, babyID, now, now, now, period])
            }
          }
        } else {
          guard let sessionID = command["sessionID"] as? String, !sessionID.isEmpty else { throw failure() }
          if table == "nursing_sessions" {
            _ = try query("UPDATE nursing_sessions SET ended_at=?,duration_seconds=MAX(0,CAST(ROUND((julianday(?) - julianday(started_at))*86400) AS INTEGER)),updated_at=? WHERE id=? AND baby_id=? AND ended_at IS NULL", [now, now, now, sessionID, babyID])
          } else { _ = try query("UPDATE sleep_sessions SET ended_at=?,updated_at=? WHERE id=? AND baby_id=? AND ended_at IS NULL", [now, now, sessionID, babyID]) }
        }
        _ = try query("INSERT INTO external_commands(id,created_at) VALUES(?,?)", [commandID, now])
      }
      _ = try query("COMMIT")
    } catch { _ = try? query("ROLLBACK"); throw error }
    return try readSnapshot(babyID: babyID)
  }
}

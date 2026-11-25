import Foundation
import SQLite3
// Compiled together with AppleSessionStore.swift; only uses the temporary fixture passed on the command line.
@main struct Check {
 static func main() throws {
  let store = AppleSessionStore(path:CommandLine.arguments[1]); var count = 0
  func check(_ condition: Bool, _ name: String) { precondition(condition, name); count += 1; print("PASS \(name)") }
  let startID=UUID().uuidString
  let first=try store.perform(["action":"startNursing","commandID":startID,"side":"left"],babyID:"qa-baby")
  let nurse=first["nursing"] as! [String:Any]; let id=nurse["id"] as! String
  let retry=try store.perform(["action":"startNursing","commandID":startID,"side":"left"],babyID:"qa-baby")
  check((retry["nursing"] as? [String:Any])?["id"] as? String == id,"duplicate command does not duplicate nursing")
  let again=try store.perform(["action":"startNursing","commandID":UUID().uuidString,"side":"right"],babyID:"qa-baby")
  check((again["nursing"] as? [String:Any])?["id"] as? String == id,"second start preserves existing nursing")
  let wrong=try store.perform(["action":"stopNursing","commandID":UUID().uuidString,"sessionID":"wrong"],babyID:"qa-baby")
  check(wrong["nursing"] != nil,"wrong session id cannot stop current nursing")
  let stopped=try store.perform(["action":"stopNursing","commandID":UUID().uuidString,"sessionID":id],babyID:"qa-baby")
  check(stopped["nursing"] == nil,"correct stop ends current nursing")
  for period in ["nap","night"] {
   let value=try store.perform(["action":"startSleep","commandID":UUID().uuidString,"period":period],babyID:"qa-baby")
   let sleep=value["sleep"] as! [String:Any]
   check(sleep["period"] as? String == period,"persists \(period) selection")
   let end=try store.perform(["action":"stopSleep","commandID":UUID().uuidString,"sessionID":sleep["id"]!],babyID:"qa-baby")
   check(end["sleep"] == nil,"ends \(period) session")
  }
  do { _=try store.perform(["action":"startSleep","commandID":"invalid"],babyID:"qa-baby"); fatalError("invalid command accepted") } catch { check(true,"rejects malformed command id") }
  do { _=try store.perform(["action":"startSleep","commandID":UUID().uuidString],babyID:"missing"); fatalError("missing child accepted") } catch { check(true,"rejects missing child") }
  print("\(count) native SQLite checks passed")
 }
}

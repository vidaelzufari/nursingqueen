import SwiftUI
import WatchConnectivity

@MainActor final class WatchSessions: NSObject, ObservableObject, WCSessionDelegate {
  @Published var state: [String: Any] = [:]
  @Published var busy = false
  @Published var error: String?
  private var timeout: DispatchWorkItem?
  private var pendingCommandID: String?
  var labels: [String: String] { state["labels"] as? [String: String] ?? [:] }
  func text(_ key: String, _ fallback: String) -> String { labels[key] ?? fallback }
  override init() {
    super.init()
    state = UserDefaults.standard.dictionary(forKey: "nq-snapshot") ?? [:]
    if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
  }
  private func receive(_ context: [String: Any]) {
    if context["ok"] as? Bool == true { state = context; UserDefaults.standard.set(context, forKey: "nq-snapshot"); error = nil }
    else { error = context["error"] as? String ?? text("phoneRequired", "Open the app on iPhone, then try again.") }
  }
  func send(_ action: String, sessionID: String? = nil, side: String? = nil, period: String? = nil) {
    guard !busy, WCSession.default.activationState == .activated else { error = text("phoneRequired", "Open the app on iPhone, then try again."); return }
    busy = true; error = nil
    var message: [String: Any] = ["action": action, "commandID": UUID().uuidString]
    let commandID = message["commandID"] as! String
    pendingCommandID = commandID
    message["sessionID"] = sessionID; message["side"] = side; message["period"] = period
    let timeout = DispatchWorkItem { [weak self] in
      guard let self, self.pendingCommandID == commandID else { return }
      self.pendingCommandID = nil; self.busy = false
      self.error = self.text("notConfirmed", "Not confirmed. Refresh before trying again.")
    }
    self.timeout = timeout; DispatchQueue.main.asyncAfter(deadline: .now() + 12, execute: timeout)
    WCSession.default.sendMessage(message, replyHandler: { value in Task { @MainActor in self.finish(commandID, context: value) } }, errorHandler: { _ in Task { @MainActor in self.finish(commandID, context: ["ok": false]) } })
  }
  private func finish(_ commandID: String, context: [String: Any]) {
    guard pendingCommandID == commandID else { return }
    pendingCommandID = nil; busy = false; timeout?.cancel(); timeout = nil
    receive(context)
  }
  nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    Task { @MainActor in self.receive(session.receivedApplicationContext); if activationState == .activated { self.send("refresh") } }
  }
  nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) { Task { @MainActor in self.receive(applicationContext) } }
}

@main struct NursingQueenWatchApp: App {
  @StateObject var sessions = WatchSessions()
  var body: some Scene { WindowGroup { WatchHome().environmentObject(sessions) } }
}
struct WatchHome: View {
  @EnvironmentObject var sessions: WatchSessions
  let plum = Color(red: 149.0/255, green: 61.0/255, blue: 139.0/255)
  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        Text(sessions.state["babyName"] as? String ?? "Nursing Queen").font(.headline)
        if let nursing = sessions.state["nursing"] as? [String: Any] { active(nursing, title: sessions.text("nursing", "Nursing"), stop: "stopNursing", symbol: "heart.fill") }
        else {
          Text(sessions.text("startNursing", "Start nursing")).font(.caption).foregroundStyle(.secondary)
          HStack { Button(sessions.text("left", "Left")) { sessions.send("startNursing", side: "left") }; Button(sessions.text("right", "Right")) { sessions.send("startNursing", side: "right") } }.tint(plum)
        }
        if let sleep = sessions.state["sleep"] as? [String: Any] { active(sleep, title: sessions.text(sleep["period"] as? String == "nap" ? "nap" : "night", "Sleep"), stop: "stopSleep", symbol: sleep["period"] as? String == "nap" ? "sun.max.fill" : "moon.stars.fill") }
        else {
          HStack { Button { sessions.send("startSleep", period: "nap") } label: { Label(sessions.text("nap", "Nap"), systemImage: "sun.max.fill") }; Button { sessions.send("startSleep", period: "night") } label: { Label(sessions.text("night", "Night"), systemImage: "moon.stars.fill") } }.tint(plum)
        }
        if sessions.busy { ProgressView(sessions.text("confirming", "Confirming on iPhone…")).font(.caption2) }
        if let error = sessions.error { Text(error).font(.caption2).foregroundStyle(.orange) }
        Button { sessions.send("refresh") } label: { Label(sessions.text("refresh", "Refresh"), systemImage: "arrow.clockwise") }.font(.caption)
      }.padding(.horizontal, 4)
    }.disabled(sessions.busy).navigationTitle("Nursing Queen")
      .environment(\.layoutDirection, (sessions.state["language"] as? String ?? "en").hasPrefix("ar") ? .rightToLeft : .leftToRight)
  }
  func active(_ session: [String: Any], title: String, stop: String, symbol: String) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Label(title, systemImage: symbol).font(.caption).foregroundStyle(.secondary)
      Text(Date(timeIntervalSince1970: session["startedAt"] as? Double ?? Date().timeIntervalSince1970), style: .timer).font(.system(.title2, design: .rounded).monospacedDigit())
      Button(sessions.text("stop", "Finish")) { sessions.send(stop, sessionID: session["id"] as? String) }.tint(plum)
    }.padding(12).frame(maxWidth: .infinity, alignment: .leading).background(plum.opacity(0.18), in: RoundedRectangle(cornerRadius: 16))
  }
}

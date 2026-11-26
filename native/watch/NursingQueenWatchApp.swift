import Foundation

/// Independent labels for each activity; older iPhone snapshots only include a generic feed label.
struct WatchLabels {
  let values: [String: String]
  let language: String
  private var code: String { language.lowercased().components(separatedBy: CharacterSet(charactersIn: "-_"))[0] }
  func text(_ key: String, _ fallback: String) -> String {
    guard let value = values[key], !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return fallback }
    return value
  }
  func finish(sleep: Bool) -> String {
    let fallback: String
    switch (code, sleep) {
    case ("fr", true): fallback = "Terminer le sommeil"
    case ("fr", false): fallback = "Terminer la tétée"
    case ("ar", true): fallback = "إنهاء النوم"
    case ("ar", false): fallback = "إنهاء الرضعة"
    default: fallback = sleep ? "Stop sleep" : "Finish feed"
    }
    return text(sleep ? "stopSleep" : "stopNursing", fallback)
  }
  var startNursing: String {
    text("startNursingAction", code == "fr" ? "Allaitement" : code == "ar" ? "الرضاعة" : "Nursing")
  }
}

#if !NQ_WATCH_LOGIC_TEST
import SwiftUI
import WatchConnectivity

@MainActor final class WatchSessions: NSObject, ObservableObject, WCSessionDelegate {
  @Published var state: [String: Any] = [:]
  @Published var busy = false
  @Published var error: String?
  private var timeout: DispatchWorkItem?
  private var pendingCommandID: String?
  var labels: [String: String] { state["labels"] as? [String: String] ?? [:] }
  var copy: WatchLabels { WatchLabels(values: labels, language: state["language"] as? String ?? Locale.current.identifier) }
  func text(_ key: String, _ fallback: String) -> String { copy.text(key, fallback) }
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
    guard !busy else { return }
    guard WCSession.default.activationState == .activated else { error = text("phoneRequired", "Open the app on iPhone, then try again."); return }
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
  var body: some Scene {
    WindowGroup { NavigationStack { WatchHome().environmentObject(sessions) } }
  }
}

/// Explicit foreground/background colours avoid watchOS's automatic tinted text on a tinted button.
private struct WatchActionStyle: ButtonStyle {
  var color: Color
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(.body, design: .rounded).weight(.semibold))
      .multilineTextAlignment(.center)
      .fixedSize(horizontal: false, vertical: true)
      .frame(maxWidth: .infinity, minHeight: 44)
      .padding(.horizontal, 6)
      .padding(.vertical, 4)
      .foregroundStyle(.white)
      .background(color.opacity(configuration.isPressed ? 0.7 : 1), in: RoundedRectangle(cornerRadius: 14))
      .contentShape(RoundedRectangle(cornerRadius: 14))
  }
}

struct WatchHome: View {
  @EnvironmentObject var sessions: WatchSessions
  let plum = Color(red: 149.0/255, green: 61.0/255, blue: 139.0/255)
  let nap = Color(red: 154.0/255, green: 99.0/255, blue: 34.0/255)

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 14) {
        nursingSection
        sleepSection
        if sessions.busy {
          ProgressView(sessions.text("confirming", "Confirming on iPhone…"))
            .font(.caption2).frame(maxWidth: .infinity)
        }
        if let error = sessions.error {
          Text(error).font(.caption).foregroundStyle(.orange).fixedSize(horizontal: false, vertical: true)
        }
        Button { sessions.send("refresh") } label: {
          Label(sessions.text("refresh", "Refresh"), systemImage: "arrow.clockwise")
            .font(.caption).frame(maxWidth: .infinity, minHeight: 44)
        }.buttonStyle(.bordered).disabled(sessions.busy)
      }
      .padding(.horizontal, 4).padding(.top, 4).padding(.bottom, 16)
    }
    .navigationTitle(sessions.state["babyName"] as? String ?? "Nursing Queen")
    .environment(\.layoutDirection, (sessions.state["language"] as? String ?? "en").hasPrefix("ar") ? .rightToLeft : .leftToRight)
  }

  private var nursingSection: some View {
    VStack(alignment: .leading, spacing: 10) {
      Label(sessions.copy.startNursing, systemImage: "heart.fill").font(.headline)
      if let nursing = sessions.state["nursing"] as? [String: Any] {
        timer(nursing)
        if let side = nursing["side"] as? String, ["left", "right"].contains(side) {
          Text(sessions.text(side, side == "left" ? "Left" : "Right")).font(.caption).foregroundStyle(.secondary)
        }
        finish(nursing, sleep: false, color: plum)
      } else {
        HStack(spacing: 8) {
          Button(sessions.text("left", "Left")) { sessions.send("startNursing", side: "left") }
          Button(sessions.text("right", "Right")) { sessions.send("startNursing", side: "right") }
        }.buttonStyle(WatchActionStyle(color: plum)).disabled(sessions.busy)
      }
    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
      .background(plum.opacity(0.18), in: RoundedRectangle(cornerRadius: 18))
  }

  private var sleepSection: some View {
    VStack(alignment: .leading, spacing: 10) {
      if let sleep = sessions.state["sleep"] as? [String: Any] {
        let isNap = sleep["period"] as? String == "nap"
        Label(sessions.text(isNap ? "nap" : "night", isNap ? "Nap" : "Night sleep"), systemImage: isNap ? "sun.max.fill" : "moon.stars.fill").font(.headline)
        timer(sleep)
        finish(sleep, sleep: true, color: isNap ? nap : plum)
      } else {
        Label(sessions.text("sleep", "Sleep"), systemImage: "moon.stars.fill").font(.headline)
        // Full-width choices remain readable on small watches and with larger text.
        Button { sessions.send("startSleep", period: "nap") } label: { Label(sessions.text("nap", "Nap"), systemImage: "sun.max.fill") }
          .buttonStyle(WatchActionStyle(color: nap))
        Button { sessions.send("startSleep", period: "night") } label: { Label(sessions.text("night", "Night sleep"), systemImage: "moon.stars.fill") }
          .buttonStyle(WatchActionStyle(color: plum))
      }
    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
      .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 18)).disabled(sessions.busy)
  }

  private func timer(_ session: [String: Any]) -> some View {
    Group {
      if let timestamp = session["startedAt"] as? Double, timestamp.isFinite, timestamp > 0 {
        Text(Date(timeIntervalSince1970: timestamp), style: .timer)
          .font(.system(.title2, design: .rounded).monospacedDigit())
          .lineLimit(1).minimumScaleFactor(0.65)
      } else {
        Text("—").font(.title2).accessibilityLabel(sessions.text("notConfirmed", "Refresh to confirm the time"))
      }
    }
  }

  private func finish(_ session: [String: Any], sleep: Bool, color: Color) -> some View {
    Button {
      sessions.send(sleep ? "stopSleep" : "stopNursing", sessionID: session["id"] as? String)
    } label: {
      Label(sessions.copy.finish(sleep: sleep), systemImage: "stop.fill")
    }.buttonStyle(WatchActionStyle(color: color)).disabled(sessions.busy)
  }
}
#endif

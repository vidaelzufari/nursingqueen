import ExpoModulesCore
import WatchConnectivity
import WidgetKit
import UIKit

final class NursingQueenAppleCoordinator: NSObject, WCSessionDelegate {
  static let shared = NursingQueenAppleCoordinator()
  static let group = "group.nursingqueen.shared"
  private let work = DispatchQueue(label: "nursingqueen.apple.sessions")
  private var defaults: UserDefaults { UserDefaults.standard }
  private var labels: [String: String] { defaults.dictionary(forKey: "nq-apple-labels") as? [String: String] ?? [:] }
  func start() {
    if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
  }
  func configure(_ config: [String: Any]) -> [String: Any] {
    work.sync {
      defaults.set(config["babyID"], forKey: "nq-apple-baby")
      defaults.set(config["labels"], forKey: "nq-apple-labels")
      defaults.set(config["language"], forKey: "nq-apple-language")
      return (try? publish(snapshot())) ?? [:]
    }
  }
  private func store() throws -> (AppleSessionStore, String) {
    guard let babyID = defaults.string(forKey: "nq-apple-baby"), !babyID.isEmpty else { throw NSError(domain: "NursingQueen", code: 1) }
    let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    return (AppleSessionStore(path: documents.appendingPathComponent("SQLite/nursing_queen.db").path), babyID)
  }
  private func snapshot() throws -> [String: Any] { let (store, baby) = try store(); return try store.snapshot(babyID: baby) }
  @discardableResult private func publish(_ value: [String: Any], notify: Bool = false) -> [String: Any] {
    var result = value; result["labels"] = labels; result["language"] = defaults.string(forKey: "nq-apple-language") ?? "en"; result["ok"] = true
    UserDefaults(suiteName: Self.group)?.set(result, forKey: "nq-snapshot")
    WidgetCenter.shared.reloadTimelines(ofKind: "NursingQueenWidget")
    if WCSession.isSupported(), WCSession.default.activationState == .activated { try? WCSession.default.updateApplicationContext(result) }
    if notify { DispatchQueue.main.async { NotificationCenter.default.post(name: NSNotification.Name("NQAppleChanged"), object: nil) } }
    return result
  }
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    work.async { if let snapshot = try? self.snapshot() { self.publish(snapshot) } }
  }
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    work.async {
      do {
        let value: [String: Any]
        if message["action"] as? String == "refresh" { value = try self.snapshot() }
        else { let (store, baby) = try self.store(); value = try store.perform(message, babyID: baby) }
        replyHandler(self.publish(value, notify: message["action"] as? String != "refresh"))
      } catch { replyHandler(["ok": false, "error": self.labels["phoneRequired"] ?? "Open Nursing Queen on your iPhone, then try again."]) }
    }
  }
}

public class NursingQueenAppleSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    NursingQueenAppleCoordinator.shared.start(); return true
  }
}
public class NursingQueenAppleModule: Module {
  private var observer: NSObjectProtocol?
  public func definition() -> ModuleDefinition {
    Name("NursingQueenApple")
    Events("onSessionsChanged")
    OnCreate {
      NursingQueenAppleCoordinator.shared.start()
      self.observer = NotificationCenter.default.addObserver(forName: NSNotification.Name("NQAppleChanged"), object: nil, queue: .main) { [weak self] _ in self?.sendEvent("onSessionsChanged", [:]) }
    }
    OnDestroy { if let observer = self.observer { NotificationCenter.default.removeObserver(observer) } }
    AsyncFunction("sync") { (config: [String: Any]) in NursingQueenAppleCoordinator.shared.configure(config) }
  }
}

import Foundation

// Compile with the actual Watch source and -D NQ_WATCH_LOGIC_TEST.
@main struct WatchLabelsCheck {
  static func main() {
    var count = 0
    func check(_ condition: Bool, _ message: String) {
      precondition(condition, message); count += 1; print("PASS \(message)")
    }
    for (language, feed, sleep, title) in [
      ("en-US", "Finish feed", "Stop sleep", "Nursing"),
      ("fr-FR", "Terminer la tétée", "Terminer le sommeil", "Allaitement"),
      ("ar_AE", "إنهاء الرضعة", "إنهاء النوم", "الرضاعة")
    ] {
      // Old TestFlight phone payloads used the feed label for every activity.
      let oldPhone = WatchLabels(values: ["stop": feed, "startNursing": "Left / right timer"], language: language)
      check(oldPhone.finish(sleep: true) == sleep, "\(language) nap/night never reuse the old feed stop label")
      check(oldPhone.finish(sleep: false) == feed, "\(language) nursing keeps a feeding-specific stop label")
      check(oldPhone.startNursing == title, "\(language) nursing section has a title instead of a timer hint")
      let updatedPhone = WatchLabels(values: ["stopSleep": sleep, "stopNursing": feed, "startNursingAction": title], language: language)
      check(updatedPhone.finish(sleep: true) == sleep && updatedPhone.finish(sleep: false) == feed, "\(language) updated phone labels remain activity-specific")
    }
    let blank = WatchLabels(values: ["stopSleep": "  "], language: "fr")
    check(blank.finish(sleep: true) == "Terminer le sommeil", "empty sleep label falls back to readable text")
    check(WatchLabels(values: [:], language: "es").finish(sleep: true) == "Stop sleep", "unsupported language has a readable sleep fallback")
    print("\(count) Watch label checks passed")
  }
}

import SwiftUI
import WidgetKit

struct NursingQueenEntry: TimelineEntry { let date: Date; let snapshot: [String: Any] }
struct NursingQueenProvider: TimelineProvider {
  func placeholder(in context: Context) -> NursingQueenEntry { NursingQueenEntry(date: Date(), snapshot: [:]) }
  func getSnapshot(in context: Context, completion: @escaping (NursingQueenEntry) -> Void) { completion(entry()) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<NursingQueenEntry>) -> Void) { completion(Timeline(entries: [entry()], policy: .after(Date().addingTimeInterval(900)))) }
  private func entry() -> NursingQueenEntry { NursingQueenEntry(date: Date(), snapshot: UserDefaults(suiteName: "group.nursingqueen.shared")?.dictionary(forKey: "nq-snapshot") ?? [:]) }
}
struct NursingQueenWidgetView: View {
  let entry: NursingQueenEntry
  @Environment(\.widgetFamily) var family
  let plum = Color(red: 149.0/255, green: 61.0/255, blue: 139.0/255)
  var labels: [String: String] { entry.snapshot["labels"] as? [String: String] ?? [:] }
  func text(_ key: String, _ fallback: String) -> String { labels[key] ?? fallback }
  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text(entry.snapshot["babyName"] as? String ?? "Nursing Queen").font(.headline).lineLimit(1)
      if let nursing = entry.snapshot["nursing"] as? [String: Any] { session(nursing, title: text("nursing", "Nursing"), symbol: "heart.fill", route: "nursingqueen:///entry/nursing/\(nursing["id"] as? String ?? "")") }
      if let sleep = entry.snapshot["sleep"] as? [String: Any] { session(sleep, title: text(sleep["period"] as? String == "nap" ? "nap" : "night", "Sleep"), symbol: sleep["period"] as? String == "nap" ? "sun.max.fill" : "moon.stars.fill", route: "nursingqueen:///sleep") }
      if entry.snapshot["nursing"] == nil && entry.snapshot["sleep"] == nil {
        Text(text("logMoment", "Log a moment")).font(.caption).foregroundStyle(.secondary)
      }
      Spacer(minLength: 0)
      HStack(spacing: 12) {
        Link(destination: URL(string: "nursingqueen:///quick-log?action=nurse")!) { Label(text("nursing", "Nursing"), systemImage: "heart.fill").font(.caption).lineLimit(1) }
        if family != .systemSmall { Link(destination: URL(string: "nursingqueen:///modals/bottle-entry")!) { Image(systemName: "waterbottle.fill") } }
        Link(destination: URL(string: "nursingqueen:///sleep")!) { Label(text("sleep", "Sleep"), systemImage: "moon.stars.fill").font(.caption).lineLimit(1) }
      }.foregroundStyle(plum)
    }.padding(2).foregroundStyle(Color(red: 50.0/255, green: 26.0/255, blue: 53.0/255))
      .environment(\.layoutDirection, (entry.snapshot["language"] as? String ?? "en").hasPrefix("ar") ? .rightToLeft : .leftToRight)
      .modifier(NursingQueenWidgetBackground())
  }
  func session(_ value: [String: Any], title: String, symbol: String, route: String) -> some View {
    Link(destination: URL(string: route)!) {
      HStack { Image(systemName: symbol).foregroundStyle(plum); Text(title).font(.caption); Spacer(minLength: 0); Text(Date(timeIntervalSince1970: value["startedAt"] as? Double ?? entry.date.timeIntervalSince1970), style: .timer).font(.system(.body, design: .rounded).monospacedDigit()) }
    }
  }
}
struct NursingQueenWidgetBackground: ViewModifier {
  @ViewBuilder func body(content: Content) -> some View {
    if #available(iOS 17.0, *) { content.containerBackground(for: .widget) { Color(red: 0.973, green: 0.969, blue: 0.984) } }
    else { content.padding().background(Color(red: 0.973, green: 0.969, blue: 0.984)) }
  }
}
struct NursingQueenWidget: Widget {
  let kind = "NursingQueenWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: NursingQueenProvider()) { entry in NursingQueenWidgetView(entry: entry) }
      .configurationDisplayName("Nursing Queen")
      .description("Your current sessions and quick access to logging.")
      .supportedFamilies([.systemSmall, .systemMedium])
  }
}

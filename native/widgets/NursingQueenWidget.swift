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
  private let ink = Color(red: 50.0/255, green: 26.0/255, blue: 53.0/255)
  private let plum = Color(red: 149.0/255, green: 61.0/255, blue: 139.0/255)
  private let rose = Color(red: 0.72, green: 0.34, blue: 0.50)
  private let teal = Color(red: 0.17, green: 0.49, blue: 0.41)
  private let amber = Color(red: 0.65, green: 0.39, blue: 0.13)
  var labels: [String: String] { entry.snapshot["labels"] as? [String: String] ?? [:] }
  func text(_ key: String, _ fallback: String) -> String { labels[key] ?? fallback }
  var body: some View {
    VStack(alignment: .leading, spacing: family == .systemSmall ? 7 : 5) {
      HStack(spacing: 6) {
        Image(systemName: "heart.circle.fill").foregroundStyle(plum).font(.caption)
        Text(entry.snapshot["babyName"] as? String ?? "Nursing Queen").font(.subheadline.weight(.semibold)).lineLimit(1).privacySensitive()
        Spacer(minLength: 0)
      }
      if let nursing = entry.snapshot["nursing"] as? [String: Any] {
        session(nursing, title: text("nursing", "Nursing"), symbol: "heart.fill", color: rose, route: "nursingqueen:///entry/nursing/\(nursing["id"] as? String ?? "")")
      }
      if let sleep = entry.snapshot["sleep"] as? [String: Any] {
        let nap = sleep["period"] as? String == "nap"
        session(sleep, title: text(nap ? "nap" : "night", nap ? "Nap" : "Night sleep"), symbol: nap ? "sun.max.fill" : "moon.stars.fill", color: nap ? amber : plum, route: "nursingqueen:///sleep")
      }
      Spacer(minLength: 0)
      if family == .systemSmall {
        // Small widgets have a single system tap destination: don't promise independent buttons.
        HStack(spacing: 5) { Text(text("logMoment", "Log a moment")).font(.caption.weight(.medium)).lineLimit(1).minimumScaleFactor(0.7); Spacer(minLength: 0); Image(systemName: "arrow.up.right").font(.caption2) }.foregroundStyle(plum)
      } else {
        HStack(spacing: 8) {
          action(title: text("nursing", "Nursing"), symbol: "heart.fill", color: rose, route: "nursingqueen:///quick-log?action=nurse")
          action(title: text("bottle", "Bottle"), symbol: "waterbottle.fill", color: teal, route: "nursingqueen:///modals/bottle-entry")
          action(title: text("sleep", "Sleep"), symbol: "moon.stars.fill", color: plum, route: "nursingqueen:///sleep")
        }
      }
    }.foregroundStyle(ink)
      .environment(\.layoutDirection, (entry.snapshot["language"] as? String ?? "en").hasPrefix("ar") ? .rightToLeft : .leftToRight)
      .modifier(NursingQueenWidgetBackground())
      .widgetURL(URL(string: "nursingqueen:///"))
  }
  @ViewBuilder private func session(_ value: [String: Any], title: String, symbol: String, color: Color, route: String) -> some View {
    if family == .systemSmall { sessionContent(value, title: title, symbol: symbol, color: color) }
    else { Link(destination: URL(string: route)!) { sessionContent(value, title: title, symbol: symbol, color: color) } }
  }
  private func sessionContent(_ value: [String: Any], title: String, symbol: String, color: Color) -> some View {
    HStack(spacing: 6) {
      Image(systemName: symbol).font(.caption2).foregroundStyle(color).frame(width: 16).accessibilityLabel(title)
      if family != .systemSmall { Text(title).font(.caption).lineLimit(1).minimumScaleFactor(0.7) }
      Spacer(minLength: 0)
      Text(Date(timeIntervalSince1970: value["startedAt"] as? Double ?? entry.date.timeIntervalSince1970), style: .timer)
        .font(.system(size: family == .systemSmall ? 19 : 20, weight: .semibold, design: .rounded)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.65)
        .frame(width: family == .systemSmall ? 84 : 100, alignment: .trailing)
    }.padding(.horizontal, 8).padding(.vertical, 3).background(color.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
      .accessibilityElement(children: .combine)
  }
  private func action(title: String, symbol: String, color: Color, route: String) -> some View {
    Link(destination: URL(string: route)!) {
      HStack(spacing: 4) { Image(systemName: symbol).font(.caption2); Text(title).font(.caption2.weight(.medium)).lineLimit(1).minimumScaleFactor(0.6) }
        .foregroundStyle(color).frame(maxWidth: .infinity, minHeight: 28).background(color.opacity(0.09), in: Capsule())
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

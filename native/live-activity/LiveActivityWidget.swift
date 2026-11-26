import ActivityKit
import SwiftUI
import WidgetKit

struct LiveActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var title: String
    var subtitle: String?
    var timerEndDateInMilliseconds: Double?
    var progress: Double?
    var imageName: String?
    var dynamicIslandImageName: String?
  }

  var name: String
  var backgroundColor: String?
  var titleColor: String?
  var subtitleColor: String?
  var progressViewTint: String?
  var progressViewLabelColor: String?
  var deepLinkUrl: String?
  var timerType: DynamicIslandTimerType?
  var padding: Int?
  var paddingDetails: PaddingDetails?
  var imagePosition: String?
  var imageWidth: Int?
  var imageHeight: Int?
  var imageWidthPercent: Double?
  var imageHeightPercent: Double?
  var imageAlign: String?
  var contentFit: String?

  enum DynamicIslandTimerType: String, Codable {
    case circular
    case digital
  }

  struct PaddingDetails: Codable, Hashable {
    var top: Int?
    var bottom: Int?
    var left: Int?
    var right: Int?
    var vertical: Int?
    var horizontal: Int?
  }
}


struct LiveActivityWidget: Widget {
  private let ink = Color(red: 50.0/255, green: 26.0/255, blue: 53.0/255)
  private func isSleep(_ attributes: LiveActivityAttributes) -> Bool { attributes.deepLinkUrl?.contains("/sleep") == true }
  private func isNap(_ attributes: LiveActivityAttributes) -> Bool {
    URLComponents(string: attributes.deepLinkUrl ?? "")?.queryItems?.first(where: { $0.name == "period" })?.value == "nap"
  }
  private func accent(_ attributes: LiveActivityAttributes) -> Color {
    isSleep(attributes) ? (isNap(attributes) ? Color(red: 0.65, green: 0.39, blue: 0.13) : Color(red: 0.58, green: 0.24, blue: 0.55)) : Color(red: 0.72, green: 0.34, blue: 0.50)
  }
  private func symbol(_ attributes: LiveActivityAttributes) -> String {
    isSleep(attributes) ? (isNap(attributes) ? "sun.max.fill" : "moon.stars.fill") : "heart.fill"
  }
  private func timer(_ state: LiveActivityAttributes.ContentState) -> some View {
    Text(Date(timeIntervalSince1970: (state.timerEndDateInMilliseconds ?? Date().timeIntervalSince1970 * 1000) / 1000), style: .timer)
      .monospacedDigit().lineLimit(1).minimumScaleFactor(0.65)
  }
  private func glyph(_ attributes: LiveActivityAttributes, size: CGFloat = 44) -> some View {
    Image(systemName: symbol(attributes)).font(.system(size: size * 0.42, weight: .medium))
      .foregroundStyle(accent(attributes)).frame(width: size, height: size)
      .background(accent(attributes).opacity(0.10), in: RoundedRectangle(cornerRadius: size * 0.34))
  }
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      HStack(alignment: .center, spacing: 14) {
        glyph(context.attributes, size: 48)
        VStack(alignment: .leading, spacing: 5) {
          HStack(spacing: 6) {
            Circle().fill(accent(context.attributes)).frame(width: 5, height: 5)
            Text(context.state.title).font(.system(.subheadline, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.8)
          }.foregroundStyle(accent(context.attributes))
          timer(context.state).font(.system(size: 30, weight: .semibold, design: .rounded)).foregroundStyle(ink)
          if let subtitle = context.state.subtitle {
            Text(subtitle).font(.caption2).foregroundStyle(ink.opacity(0.65)).lineLimit(1).minimumScaleFactor(0.8)
          }
        }.frame(maxWidth: .infinity, alignment: .leading)
        Image(systemName: "arrow.up.right").font(.system(size: 14, weight: .medium))
          .foregroundStyle(accent(context.attributes)).frame(width: 32, height: 32)
          .background(Color.white.opacity(0.8), in: Circle())
      }.padding(.horizontal, 18).padding(.vertical, 16)
        .activityBackgroundTint(Color(red: 0.975, green: 0.966, blue: 0.980))
        .activitySystemActionForegroundColor(accent(context.attributes))
        .widgetURL(URL(string: context.attributes.deepLinkUrl ?? "nursingqueen:///"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) { glyph(context.attributes, size: 36) }
        DynamicIslandExpandedRegion(.trailing) {
          timer(context.state).font(.system(.title2, design: .rounded).weight(.semibold)).frame(maxWidth: 150)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack {
            Text(context.state.title).font(.subheadline.weight(.semibold))
            Spacer(minLength: 8)
            Image(systemName: "arrow.up.right").font(.caption)
          }.foregroundStyle(accent(context.attributes))
        }
      } compactLeading: {
        Image(systemName: symbol(context.attributes)).foregroundStyle(accent(context.attributes))
      } compactTrailing: {
        timer(context.state).font(.caption.weight(.semibold)).frame(maxWidth: 70)
      } minimal: {
        Image(systemName: symbol(context.attributes)).foregroundStyle(accent(context.attributes))
      }.widgetURL(URL(string: context.attributes.deepLinkUrl ?? "nursingqueen:///"))
    }
  }
}

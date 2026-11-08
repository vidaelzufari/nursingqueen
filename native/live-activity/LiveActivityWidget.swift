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
  func timer(_ state: LiveActivityAttributes.ContentState) -> some View {
    Text(Date(timeIntervalSince1970: (state.timerEndDateInMilliseconds ?? Date().timeIntervalSince1970 * 1000) / 1000), style: .timer)
      .monospacedDigit()
  }
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      HStack {
        Image(systemName: "clock").font(.title2)
        VStack(alignment: .leading) {
          Text(context.state.title).font(.headline)
          if let subtitle = context.state.subtitle { Text(subtitle).font(.caption) }
        }
        Spacer()
        timer(context.state).font(.title2.bold())
      }.padding(18)
        .activityBackgroundTint(Color(red: 0.95, green: 0.93, blue: 0.97))
        .activitySystemActionForegroundColor(Color(red: 0.44, green: 0.32, blue: 0.56))
        .widgetURL(URL(string: context.attributes.deepLinkUrl ?? "nursingqueen:///"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) { Text(context.state.title).font(.headline) }
        DynamicIslandExpandedRegion(.trailing) { timer(context.state) }
        DynamicIslandExpandedRegion(.bottom) { Text(context.state.subtitle ?? "").font(.caption) }
      } compactLeading: {
        Image(systemName: "clock")
      } compactTrailing: {
        timer(context.state).frame(maxWidth: 65)
      } minimal: {
        Image(systemName: "clock")
      }.widgetURL(URL(string: context.attributes.deepLinkUrl ?? "nursingqueen:///"))
    }
  }
}

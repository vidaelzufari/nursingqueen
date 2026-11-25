const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const destination = path.join(root, "node_modules/expo-live-activity/ios-files/LiveActivityWidget.swift");
if (fs.existsSync(path.dirname(destination))) fs.copyFileSync(path.join(root, "native/live-activity/LiveActivityWidget.swift"), destination);

const widgetFiles = path.dirname(destination);
if (fs.existsSync(widgetFiles)) {
  fs.copyFileSync(path.join(root, "native/widgets/NursingQueenWidget.swift"), path.join(widgetFiles, "NursingQueenWidget.swift"));
  fs.writeFileSync(path.join(widgetFiles, "LiveActivityWidgetBundle.swift"), `import SwiftUI
import WidgetKit
@main struct LiveActivityWidgetBundle: WidgetBundle { var body: some Widget { LiveActivityWidget(); NursingQueenWidget() } }
`);
}

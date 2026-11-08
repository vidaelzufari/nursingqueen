const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const destination = path.join(root, "node_modules/expo-live-activity/ios-files/LiveActivityWidget.swift");
if (fs.existsSync(path.dirname(destination))) fs.copyFileSync(path.join(root, "native/live-activity/LiveActivityWidget.swift"), destination);

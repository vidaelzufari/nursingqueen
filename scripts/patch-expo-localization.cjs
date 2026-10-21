// SDK 51's calendar switch predates the calendar cases added by Xcode 26.
// Keep this compatibility patch until the Expo SDK is upgraded.
// https://github.com/expo/expo/issues/40009
const fs = require("node:fs");
const path = require("node:path");
function patch(source) {
  const original = '    case .iso8601:\n      return "iso8601"\n    }';
  const replacement = '    case .iso8601:\n      return "iso8601"\n    @unknown default:\n      return "iso8601"\n    }';
  if (source.includes(replacement)) return source;
  if (!source.includes(original)) throw new Error("expo-localization source changed; review/remove the Xcode calendar patch.");
  return source.replace(original, replacement);
}
function patchDevice(source) {
  const original = "    return TARGET_OS_SIMULATOR != 0";
  const replacement = "    #if targetEnvironment(simulator)\n    return true\n    #else\n    return false\n    #endif";
  if (source.includes(replacement)) return source;
  if (!source.includes(original)) throw new Error("expo-device source changed; review/remove the simulator compatibility patch.");
  return source.replace(original, replacement);
}
module.exports = { patch, patchDevice };
if (require.main === module) {
  const target = path.join(path.dirname(require.resolve("expo-localization/package.json")), "ios/LocalizationModule.swift");
  const source = fs.readFileSync(target, "utf8");
  const result = patch(source);
  if (source !== result) fs.writeFileSync(target, result);
  const deviceTarget = path.join(path.dirname(require.resolve("expo-device/package.json")), "ios/UIDevice.swift");
  const deviceSource = fs.readFileSync(deviceTarget, "utf8");
  const deviceResult = patchDevice(deviceSource);
  if (deviceSource !== deviceResult) fs.writeFileSync(deviceTarget, deviceResult);
  console.log("Verified expo-localization Xcode calendar compatibility.");
}

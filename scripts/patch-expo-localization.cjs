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
module.exports = { patch };
if (require.main === module) {
  const target = path.join(path.dirname(require.resolve("expo-localization/package.json")), "ios/LocalizationModule.swift");
  const source = fs.readFileSync(target, "utf8");
  const result = patch(source);
  if (source !== result) fs.writeFileSync(target, result);
  console.log("Verified expo-localization Xcode calendar compatibility.");
}

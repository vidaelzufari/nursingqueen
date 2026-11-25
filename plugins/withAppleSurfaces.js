const { withEntitlementsPlist, withXcodeProject, withInfoPlist } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");
const plist = require("@expo/plist");
const GROUP = "group.nursingqueen.shared";
module.exports = function withAppleSurfaces(config) {
  const parent = config.ios.bundleIdentifier;
  const targetName = "NursingQueenWatch";
  const bundle = `${parent}.watchkitapp`;
  config.extra = { ...config.extra, eas: { ...config.extra?.eas, build: { ...config.extra?.eas?.build, experimental: { ...config.extra?.eas?.build?.experimental, ios: { ...config.extra?.eas?.build?.experimental?.ios,
    appExtensions: [
      { targetName, bundleIdentifier: bundle, entitlements: {} },
      { targetName: "LiveActivity", bundleIdentifier: `${parent}.LiveActivity`, entitlements: { "com.apple.security.application-groups": [GROUP] } },
    ],
  } } } } };
  config = withEntitlementsPlist(config, result => {
    result.modResults["com.apple.security.application-groups"] = [...new Set([...(result.modResults["com.apple.security.application-groups"] || []), GROUP])];
    return result;
  });
  // Info.plist mods run after Xcode mods; run after the vendor clears this file.
  config = withInfoPlist(config, result => {
    const extension = path.join(result.modRequest.platformProjectRoot, "LiveActivity/LiveActivity.entitlements");
    fs.mkdirSync(path.dirname(extension), { recursive: true });
    fs.writeFileSync(extension, plist.default.build({ "com.apple.security.application-groups": [GROUP] }));
    return result;
  });
  return withXcodeProject(config, result => {
    const root = result.modRequest.platformProjectRoot;
    const project = result.modResults;
    const watchFolder = path.join(root, targetName);
    fs.mkdirSync(watchFolder, { recursive: true });
    fs.copyFileSync(path.join(result.modRequest.projectRoot, "native/watch/NursingQueenWatchApp.swift"), path.join(watchFolder, "NursingQueenWatchApp.swift"));
    fs.writeFileSync(path.join(watchFolder, `${targetName}-Info.plist`), plist.default.build({ CFBundleDisplayName: "Nursing Queen", CFBundleName: "NursingQueenWatch", CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)", CFBundleExecutable: "$(EXECUTABLE_NAME)", CFBundlePackageType: "APPL", CFBundleShortVersionString: "$(MARKETING_VERSION)", CFBundleVersion: "$(CURRENT_PROJECT_VERSION)", WKApplication: true, WKCompanionAppBundleIdentifier: parent, WKRunsIndependentlyOfCompanionApp: false }));
    const asset = path.join(watchFolder, "Assets.xcassets/AppIcon.appiconset"); fs.mkdirSync(asset, { recursive: true });
    fs.copyFileSync(path.join(result.modRequest.projectRoot, "assets/icon.png"), path.join(asset, "AppIcon.png"));
    fs.writeFileSync(path.join(asset, "Contents.json"), JSON.stringify({ images: [{ filename: "AppIcon.png", idiom: "universal", platform: "watchos", size: "1024x1024" }], info: { author: "xcode", version: 1 } }));
    let watch = Object.entries(project.pbxNativeTargetSection()).find(([, target]) => target && typeof target === "object" && String(target.name).replace(/"/g, "") === targetName);
    if (!watch) {
      const target = project.addTarget(targetName, "watch2_app", targetName, bundle);
      project.addBuildPhase([`${targetName}/NursingQueenWatchApp.swift`], "PBXSourcesBuildPhase", "Sources", target.uuid);
      project.addBuildPhase([`${targetName}/Assets.xcassets`], "PBXResourcesBuildPhase", "Resources", target.uuid);
      project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
      watch = [target.uuid, target.pbxNativeTarget];
    }
    const watchTarget = watch[1];
    // Modern single-target SwiftUI Watch app; watchapp2 adds a conflicting legacy stub.
    watchTarget.productType = '"com.apple.product-type.application"';
    const list = project.pbxXCConfigurationList()[watchTarget.buildConfigurationList];
    for (const entry of list.buildConfigurations) {
      const settings = project.pbxXCBuildConfigurationSection()[entry.value].buildSettings;
      Object.assign(settings, { SDKROOT: "watchos", SUPPORTED_PLATFORMS: '"watchos watchsimulator"', WATCHOS_DEPLOYMENT_TARGET: "9.0", TARGETED_DEVICE_FAMILY: '"4"', SWIFT_VERSION: "5.0", GENERATE_INFOPLIST_FILE: "NO", MARKETING_VERSION: result.version || "1.0.0", CURRENT_PROJECT_VERSION: result.ios.buildNumber || "1", ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon", CODE_SIGN_STYLE: "Automatic", PRODUCT_BUNDLE_IDENTIFIER: bundle, INFOPLIST_FILE: `${targetName}/${targetName}-Info.plist`, SKIP_INSTALL: "YES" });
      delete settings.IPHONEOS_DEPLOYMENT_TARGET;
    }
    // This mod runs after expo-live-activity has created its extension.
    const extension = path.join(root, "LiveActivity/LiveActivity.entitlements");
    if (!fs.existsSync(path.dirname(extension))) throw new Error("Live Activity target must be generated before Apple surfaces");
    fs.writeFileSync(extension, plist.default.build({ "com.apple.security.application-groups": [GROUP] }));
    return result;
  });
};

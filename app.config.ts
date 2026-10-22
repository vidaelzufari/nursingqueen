import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * These five values are intentionally literal, not imported from
 * src/config/app.json (the single source of truth every app screen reads).
 * Node's config-loading step for app.config.ts has proven unable to reliably
 * resolve *any* cross-file import for these values across different Expo
 * CLI/Node/build-image combinations — a plain `.ts` import failed with
 * "Cannot use import statement outside a module", and a `.json` import
 * failed with 'needs an import attribute of "type: json"' on a newer image.
 * A self-contained app.config.ts has no such failure mode. Drift between
 * these literals and src/config/app.json is caught by
 * __tests__/appConfig.test.ts, not by a runtime import.
 */
const APP_NAME = "The Nursing Queen";
const APP_SLUG = "nursing-queen"; // must match the slug EAS registered for extra.eas.projectId
const APP_SCHEME = "nursingqueen";
const IOS_BUNDLE_ID = "nursingqueen";
const ANDROID_PACKAGE = "com.nursingqueen.app";
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? "ce5adcd3-f209-4df0-9709-02ab9fce3323";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "vida.elzufari",
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FBF7F4",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IOS_BUNDLE_ID,
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
      ],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTracking: false,
    },
    infoPlist: {
      // Concrete fallback strings are required by App Store Connect.
      // Xcode expands undefined $(KEY) references to empty strings.
      NSPhotoLibraryUsageDescription: "Choose a photo from your library to personalize your baby's profile. The photo is stored only on this device.",
      NSCameraUsageDescription: "Take a photo to personalize your baby's profile. The photo is stored only on this device.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon-foreground.png",
      backgroundColor: "#FBF7F4",
    },
    permissions: ["READ_MEDIA_IMAGES", "CAMERA"],
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    ["expo-build-properties", { ios: { deploymentTarget: "15.1" }, android: { minSdkVersion: 24 } }],
    // expo-sqlite is intentionally NOT listed here: it has no config plugin
    // (no app.plugin.js) and autolinks natively without one. Listing it
    // makes Expo's resolver import the package to probe whether its main
    // export happens to be a plugin, which trips an internal ESM-resolution
    // bug in this expo-sqlite version and fails the whole config read.
    "expo-updates",
    ["expo-image-picker", {
      photosPermission: "Choose a photo from your library to personalize your baby's profile. The photo is stored only on this device.",
      cameraPermission: "Take a photo to personalize your baby's profile. The photo is stored only on this device.",
    }],
    "./plugins/withLocalizedPermissions.js",
    [
      "sentry-expo",
      {
        organization: process.env.SENTRY_ORG ?? "",
        project: process.env.SENTRY_PROJECT ?? "",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  updates: {
    url: process.env.EAS_UPDATE_URL ?? `https://u.expo.dev/${EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: "fingerprint",
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});

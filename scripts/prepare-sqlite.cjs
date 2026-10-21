// Prefetch SDK 51's SQLite archive over IPv4 before Gradle's network step.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
if (process.env.EAS_BUILD_PLATFORM) {
  const appShell = path.join(__dirname, "../src/navigation/AppShell.tsx");
  if (!fs.existsSync(appShell)) throw new Error("EAS archive is missing src/navigation/AppShell.tsx");
  console.log("Verified AppShell is present in the native build archive.");
}
if (process.env.EAS_BUILD_PLATFORM === "android") {
  const version = "3450300";
  const expected = "ea170e73e447703e8359308ca2e4366a3ae0c4304a8665896f068c736781c651";
  const root = path.resolve(path.dirname(require.resolve("expo-sqlite")), "..");
  const gradle = fs.readFileSync(path.join(root, "android/build.gradle"), "utf8");
  if (!gradle.includes(`def SQLITE_VERSION = '${version}'`)) {
    throw new Error("SQLite version changed; review/remove the prefetched archive hook.");
  }
  const directory = process.env.REACT_NATIVE_DOWNLOADS_DIR || path.join(root, "android/build/downloads");
  const archive = path.join(directory, `sqlite-amalgamation-${version}.zip`);
  fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(archive)) {
    execFileSync("curl", ["--ipv4", "--fail", "--location", "--retry", "3",
      "--retry-all-errors", "--connect-timeout", "20", "--max-time", "180",
      `https://www.sqlite.org/2024/sqlite-amalgamation-${version}.zip`,
      "--output", archive], { stdio: "inherit" });
  }
  const digest = createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
  if (digest !== expected) throw new Error("SQLite archive checksum mismatch; refusing to build.");
  // Gradle's onlyIfNewer performs a HEAD request even for a cached archive.
  // The verified local file is authoritative for this pinned SQLite version.
  const original = "  onlyIfNewer(true)";
  const replacement = "  onlyIf { !dest.exists() }\n  onlyIfNewer(false)";
  if (gradle.includes(original)) {
    fs.writeFileSync(path.join(root, "android/build.gradle"), gradle.replace(original, replacement));
  } else if (!gradle.includes(replacement)) {
    throw new Error("SQLite download task changed; review/remove the offline Gradle patch.");
  }
  console.log("Verified official SQLite archive for Android native build.");
}

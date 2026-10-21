// Prefetch SDK 51's SQLite archive over IPv4 before Gradle's network step.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
if (process.env.EAS_BUILD_PLATFORM === "android") {
  const version = "3450300";
  const expected = "ea170e73e447703e8359308ca2e4366a3ae0c4304a8665896f068c736781c651";
  const root = path.resolve(path.dirname(require.resolve("expo-sqlite")), "..");
  const gradle = fs.readFileSync(path.join(root, "android/build.gradle"), "utf8");
  if (!gradle.includes(`def SQLITE_VERSION = '${version}'`)) {
    throw new Error("SQLite version changed; review/remove the prefetched archive hook.");
  }
  const directory = path.join(root, "android/build/downloads");
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
  console.log("Verified official SQLite archive for Android native build.");
}

// Resolve the non-secret App Store app ID without committing account placeholders.
const fs = require("node:fs");
const cp = require("node:child_process");
const tag = process.env.GITHUB_REF_NAME;
const version = require("../package.json").version;
const app = JSON.parse(cp.execFileSync("npx", ["expo", "config", "--json"], { encoding: "utf8" }));
if (tag !== `v${version}` || app.version !== version) {
  throw new Error("Release tag, package.json version and app.config.ts version must match exactly.");
}
const appId = process.env.ASC_APP_ID;
if (!appId || !/^\d+$/.test(appId)) {
  throw new Error("Set the numeric ASC_APP_ID repository Actions variable before releasing.");
}
const config = JSON.parse(fs.readFileSync("eas.json", "utf8"));
for (const profile of Object.values(config.submit)) profile.ios.ascAppId = appId;
fs.writeFileSync("eas.json", JSON.stringify(config, null, 2) + "\n");
console.log(`Validated release ${tag}; configured App Store submission.`);

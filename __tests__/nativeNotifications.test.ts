import { execFileSync } from "child_process";
import path from "path";
it("keeps local reminders compatible with the existing iOS signing profile", () => {
  const root = path.resolve(__dirname, "..");
  const config = JSON.parse(execFileSync(process.execPath, [path.join(root, "node_modules/expo/bin/cli"), "config", "--type", "introspect", "--json"], {
    cwd: root, encoding: "utf8", env: { ...process.env, EXPO_OFFLINE: "1" },
  }));
  expect(config._internal.modResults.ios.entitlements["aps-environment"]).toBeUndefined();
  expect(config._internal.modResults.ios.infoPlist.NSSupportsLiveActivities).toBe(true);
});

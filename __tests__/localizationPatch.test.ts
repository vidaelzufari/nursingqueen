// The npm postinstall entry point must also run directly in Node as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { patch, patchDevice, patchDevMenu } = require("../scripts/patch-expo-localization.cjs");

describe("Xcode calendar compatibility patch", () => {
  const original = '    case .iso8601:\n      return "iso8601"\n    }';
  it("handles new calendar identifiers and is safe to rerun", () => {
    const result = patch(original);
    expect(result).toContain('@unknown default:\n      return "iso8601"');
    expect(patch(result)).toBe(result);
  });
  it("fails visibly when an SDK upgrade changes the source", () => {
    expect(() => patch("changed implementation")).toThrow("source changed");
  });
  it("uses Swift simulator detection and is safe to rerun", () => {
    const result = patchDevice("    return TARGET_OS_SIMULATOR != 0");
    expect(result).toContain("#if targetEnvironment(simulator)");
    expect(patchDevice(result)).toBe(result);
    expect(() => patchDevice("changed implementation")).toThrow("source changed");
  });
  it("updates the developer menu's removed simulator macro", () => {
    const result = patchDevMenu("    let isSimulator = TARGET_IPHONE_SIMULATOR > 0");
    expect(result).toContain("#if targetEnvironment(simulator)");
    expect(patchDevMenu(result)).toBe(result);
    expect(() => patchDevMenu("changed implementation")).toThrow("source changed");
  });
});

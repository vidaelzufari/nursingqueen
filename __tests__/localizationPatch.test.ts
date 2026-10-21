// The npm postinstall entry point must also run directly in Node as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { patch } = require("../scripts/patch-expo-localization.cjs");

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
});

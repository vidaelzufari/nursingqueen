import { displayToMl, formatVolume, mlToDisplay, parseAmount } from "@/domain/units";

describe("units", () => {
  describe("mlToDisplay", () => {
    it("rounds ml to the nearest whole number", () => {
      expect(mlToDisplay(120.4, "ml")).toBe(120);
      expect(mlToDisplay(120.6, "ml")).toBe(121);
    });

    it("converts ml to oz with one decimal place", () => {
      expect(mlToDisplay(29.5735, "oz")).toBe(1);
      expect(mlToDisplay(0, "oz")).toBe(0);
      expect(mlToDisplay(150, "oz")).toBeCloseTo(5.1, 1);
    });
  });

  describe("displayToMl", () => {
    it("rounds ml input to whole numbers", () => {
      expect(displayToMl(120.4, "ml")).toBe(120);
    });

    it("converts oz input to ml", () => {
      expect(displayToMl(1, "oz")).toBe(30); // 29.5735 rounds to 30
      expect(displayToMl(5, "oz")).toBe(148); // 147.8675 rounds to 148
    });

    it("round-trips a whole-ounce value back to the same ounce display", () => {
      const ml = displayToMl(4, "oz");
      expect(mlToDisplay(ml, "oz")).toBe(4);
    });
  });

  describe("formatVolume", () => {
    it("formats with the unit suffix", () => {
      expect(formatVolume(90, "ml")).toBe("90 ml");
      expect(formatVolume(29.5735, "oz")).toBe("1 oz");
    });
  });
});

describe("quick amount input", () => {
  it("accepts decimal commas and converts the selected unit", () => {
    expect(parseAmount(" 2,5 ", "oz")).toBe(74);
    expect(parseAmount("120", "ml")).toBe(120);
  });
  it.each(["", "0", "-10", "NaN", "Infinity", "1e9", "1.2.3", "10abc", "0.001"])("rejects invalid or zero ml amounts: %s", text => {
    expect(parseAmount(text, "ml")).toBeNull();
  });
});

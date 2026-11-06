import { parseBirthDate, validBirthDate } from "@/domain/birthDate";
import { computeAge } from "@/domain/dateMath";
import { createInstance } from "i18next";
import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";
import ar from "@/i18n/locales/ar.json";

it("rejects ambiguous, impossible and future birth dates", () => {
  const now = new Date(2026, 10, 6);
  for (const value of ["06/05/2026", "2026-02-30", "invalid", "", "2027-01-01"]) expect(validBirthDate(value, now)).toBe(false);
  expect(validBirthDate("2024-02-29", now)).toBe(true);
});
it("computes age from a local calendar date", () => {
  const date = parseBirthDate("2026-05-06");
  expect(date?.getDate()).toBe(6);
  expect(computeAge(date!, new Date(2026, 10, 6)).months).toBe(6);
});
it.each(["en", "fr", "ar"])("provides readable age text and a base fallback in %s", async language => {
  const resources = { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } };
  const i18n = createInstance();
  await i18n.init({ resources, lng: language, fallbackLng: "en", compatibilityJSON: "v4" });
  expect(i18n.t("profile.age.months", { count: 6 })).not.toContain("profile.age");
  expect(i18n.t("profile.age.weeks", { count: 1 })).not.toContain("profile.age");
  expect(i18n.getResource(language, "translation", "profile.age.months")).toContain("{{count}}");
});

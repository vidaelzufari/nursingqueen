import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";
import ar from "@/i18n/locales/ar.json";

function flatten(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === "object" ? Object.entries(flatten(item, path)) : [[path, item]];
  }));
}
const reference = flatten(en);
it.each([["fr", fr], ["ar", ar]] as const)("provides nonempty %s text for every English screen key", (_, dictionary) => {
  const translated = flatten(dictionary);
  for (const key of Object.keys(reference)) {
    expect(translated[key]).toEqual(expect.any(String));
    expect(translated[key]?.trim().length).toBeGreaterThan(0);
  }
});

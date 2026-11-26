// Hermes does not provide PluralRules on all supported iOS versions.
// Load before i18next initializes its v4 plural resolver (FR/EN/AR).
import "intl-pluralrules";
import { MULTILINGUAL_ENABLED } from "@/config/release";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const;
export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export const RTL_LANGUAGES: SupportedLanguageCode[] = ["ar"];

const resources = { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } };

export function resolveDeviceLanguage(): SupportedLanguageCode {
  if (!MULTILINGUAL_ENABLED) return "en";
  const deviceTags = Localization.getLocales().map((l) => l.languageCode);
  const match = deviceTags.find((tag): tag is SupportedLanguageCode =>
    SUPPORTED_LANGUAGES.includes(tag as SupportedLanguageCode)
  );
  return match ?? "en";
}

let initialized = false;

export function initI18n(preferredLanguage?: SupportedLanguageCode): void {
  const language = MULTILINGUAL_ENABLED ? preferredLanguage ?? resolveDeviceLanguage() : "en";
  if (!initialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: "en",
      compatibilityJSON: "v4",
      interpolation: { escapeValue: false },
    });
    initialized = true;
  } else {
    i18n.changeLanguage(language);
  }
  applyDirection(language);
}

/**
 * Mirrors the whole layout for Arabic. I18nManager persists the native direction for the next launch. Screen and
 * AppShell also apply direction reactively so a language change does not
 * discard an unsaved form. Native relaunch behaviour still needs device QA.
 */
export function applyDirection(language: SupportedLanguageCode): void {
  const shouldBeRTL = RTL_LANGUAGES.includes(language);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

export default i18n;

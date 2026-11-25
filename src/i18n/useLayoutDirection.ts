import { useTranslation } from "react-i18next";

/** Update direction immediately without discarding an unsaved form during a language change. */
export function useLayoutDirection() {
  const { i18n } = useTranslation();
  const isRTL = (i18n?.resolvedLanguage ?? i18n?.language ?? "en").startsWith("ar");
  return { isRTL, direction: isRTL ? "rtl" as const : "ltr" as const };
}

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Keep elapsed-time units in the app language, independent of the phone locale. */
export function useDurationFormatter() {
  const { t } = useTranslation();
  return useCallback((totalMinutes: number): string => {
    const value = Math.max(0, Math.floor(totalMinutes));
    const hours = Math.floor(value / 60); const minutes = value % 60;
    if (!hours) return t("common.minutesShort", { count: minutes });
    return minutes ? t("common.hoursMinutesShort", { hours, minutes }) : t("common.hoursShort", { count: hours });
  }, [t]);
}

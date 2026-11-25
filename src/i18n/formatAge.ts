import type { TFunction } from "i18next";
import type { AgeBreakdown } from "@/domain/dateMath";
export function formatAge(age: AgeBreakdown, t: TFunction): string {
  return t("profile.age.monthsDays", {
    months: t("profile.age.monthPart", { count: age.months }),
    days: t("profile.age.dayPart", { count: age.daysAfterMonths }),
  });
}

import { arSA, enUS, fr } from "date-fns/locale";

export function dateLocale(language?: string) {
  return language?.startsWith("fr") ? fr : language?.startsWith("ar") ? arSA : enUS;
}

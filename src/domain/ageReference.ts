import { differenceInMonths } from "date-fns";
import { parseBirthDate } from "./birthDate";
/** AASM total sleep reference; deliberately not converted into a wake window. */
export function sleepReferenceHours(dateOfBirth: string, now: Date): { min: number; max: number } | null {
  const born = parseBirthDate(dateOfBirth);
  if (!born || born > now) return null;
  const months = differenceInMonths(now, born);
  if (months >= 4 && months < 12) return { min: 12, max: 16 };
  if (months >= 12 && months < 36) return { min: 11, max: 14 };
  return null;
}

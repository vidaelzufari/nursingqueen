import { format, isValid, parse } from "date-fns";

/** A birth date is a local calendar day, never a UTC timestamp. */
export function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) && format(date, "yyyy-MM-dd") === value ? date : null;
}
export function validBirthDate(value: string, now = new Date()): boolean {
  const date = parseBirthDate(value);
  return date !== null && date.getTime() <= now.getTime();
}

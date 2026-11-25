/** Parse a kg entry; storage remains integer grams so existing records keep their meaning. */
export function parseWeightKg(input: string): number | null {
  const text = input.trim().replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/[،٫,]/g, ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null;
  const grams = Math.round(Number(text) * 1000);
  return Number.isSafeInteger(grams) && grams > 0 ? grams : null;
}

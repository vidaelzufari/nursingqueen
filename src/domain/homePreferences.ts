export const HOME_ACTIVITIES = ["nursing", "pump", "bottle", "sleep", "solids"] as const;
export type HomeActivity = typeof HOME_ACTIVITIES[number];
/** Stable order; unknown/empty legacy preferences safely restore the default. */
export function normalizeHomeActivities(value: unknown): HomeActivity[] {
  const selected = HOME_ACTIVITIES.filter(key => Array.isArray(value) && value.includes(key));
  return selected.length ? selected : [...HOME_ACTIVITIES];
}
export function toggleHomeActivity(current: HomeActivity[], key: HomeActivity): HomeActivity[] {
  const selected = normalizeHomeActivities(current);
  if (selected.includes(key) && selected.length === 1) return selected;
  return normalizeHomeActivities(selected.includes(key) ? selected.filter(item => item !== key) : [...selected,key]);
}
/** Hiding a category must never strand a running timer. */
export function visibleHomeActivities(selected: HomeActivity[], active: { nursing?: boolean; sleep?: boolean }): HomeActivity[] {
  return HOME_ACTIVITIES.filter(key => normalizeHomeActivities(selected).includes(key) || key === 'nursing' && active.nursing || key === 'sleep' && active.sleep);
}

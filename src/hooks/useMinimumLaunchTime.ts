import { useEffect, useState } from "react";

export const MINIMUM_LAUNCH_MS = 2000;
/** Runs alongside initialization, so a slower startup never incurs an extra delay. */
export function useMinimumLaunchTime() {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), MINIMUM_LAUNCH_MS);
    return () => clearTimeout(timer);
  }, []);
  return elapsed;
}

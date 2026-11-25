import React, { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LaunchScreen } from "@/components/LaunchScreen";
import { useLogStore } from "@/store/useLogStore";
import { useActiveBaby } from "@/store/useBabyStore";
/** Widget links open the app before writing, preserving the normal session safeguards. */
export default function QuickLog() {
  const { action } = useLocalSearchParams<{ action?: string }>(); const router = useRouter(); const baby = useActiveBaby(); const done = useRef(false);
  useEffect(() => {
    if (done.current) return; done.current = true;
    if (action !== "nurse") { router.replace("/"); return; }
    if (!baby) { router.replace({ pathname: "/profile/edit", params: { intent: "nurse" } }); return; }
    const store = useLogStore.getState(); store.refresh(baby.id);
    if (!useLogStore.getState().nursingSessions.some(s => !s.endedAt)) useLogStore.getState().startNursing();
    router.replace("/");
  }, [action, baby, router]);
  return <LaunchScreen />;
}

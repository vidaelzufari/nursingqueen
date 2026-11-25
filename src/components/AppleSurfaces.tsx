import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { EventEmitter, requireOptionalNativeModule } from "expo-modules-core";
import { useTranslation } from "react-i18next";
import { useActiveBaby, useBabyStore } from "@/store/useBabyStore";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";

/** The phone database remains authoritative, including actions received from the Watch. */
export function AppleSurfaces() {
  const baby = useActiveBaby(); const { t, i18n } = useTranslation();
  const nursing = useLogStore(s => s.nursingSessions); const sleep = useSleepStore(s => s.sessions);
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const native = requireOptionalNativeModule("NursingQueenApple");
    if (!native) return;
    const refresh = () => {
      useBabyStore.getState().refresh();
      if (baby) { useLogStore.getState().refresh(baby.id); useSleepStore.getState().refresh(baby.id); }
    };
    const emitter = new EventEmitter(native);
    const event = emitter.addListener("onSessionsChanged", refresh);
    const state = AppState.addEventListener("change", value => { if (value === "active") refresh(); });
    return () => { event.remove(); state.remove(); };
  }, [baby?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const native = requireOptionalNativeModule("NursingQueenApple");
    if (!native) return;
    void native.sync({ babyID: baby?.id ?? "", language: i18n.resolvedLanguage ?? i18n.language,
      labels: { nursing: t("refresh.feed"), sleep: t("sleep.title"), nap: t("sleep.nap"), night: t("sleep.night"), startNursing: t("refresh.nursingHint"), left: t("manualNursing.left"), right: t("manualNursing.right"), stop: t("design.finish"), refresh: t("apple.refresh"), phoneRequired: t("apple.phoneRequired"), notConfirmed: t("apple.notConfirmed"), confirming: t("apple.confirming"), logMoment: t("refresh.actions") },
    }).catch(() => {});
  }, [baby?.id, nursing, sleep, t, i18n.language, i18n.resolvedLanguage]);
  return null;
}

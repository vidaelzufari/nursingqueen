import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { useSettingsStore } from "@/store/useSettingsStore";

let queue = Promise.resolve();
/** Serialize updates so a fast Stop cannot leave a stale reminder/activity behind. */
export function TimerIntegrations() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const nursing = useLogStore(s => s.nursingSessions).find(s => !s.endedAt);
  const sleep = useSleepStore(s => s.sessions).find(s => !s.endedAt);
  const reminders = useSettingsStore(s => s.timerReminders);
  const live = useSettingsStore(s => s.liveActivities);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let disposed = false;
    let remove: (() => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- Load native modules lazily so older binaries can still log.
    void Promise.resolve().then(() => require("expo-notifications") as typeof import("expo-notifications")).then(n => {
      if (disposed) return;
      n.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
      const open = (response: import("expo-notifications").NotificationResponse | null) => {
        const route = response?.notification.request.content.data?.route;
        if (typeof route === "string" && (route === "/sleep" || /^\/entry\/nursing\/[a-zA-Z0-9-]+$/.test(route))) {
          router.push(route as never);
          void n.clearLastNotificationResponseAsync();
        }
      };
      const listener = n.addNotificationResponseReceivedListener(open);
      remove = () => listener.remove();
      void n.getLastNotificationResponseAsync().then(r => { if (!disposed) open(r); });
    }).catch(() => {});
    return () => { disposed = true; remove?.(); };
  }, [router]);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sync = () => {
      queue = queue.catch(() => {}).then(async () => {
        const active = [{ session: nursing, kind: "nursing", minutes: 30 }, { session: sleep, kind: "sleep", minutes: 120 }].filter(x => x.session);
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- Load native modules lazily so older binaries can still log.
        const notifications = require("expo-notifications") as typeof import("expo-notifications");
        const permission = await notifications.getPermissionsAsync();
        const scheduled = await notifications.getAllScheduledNotificationsAsync();
        const desired = new Set(active.map(x => `nq-timer-${x.session!.id}-${x.session!.startedAt}`));
        for (const n of scheduled) if (n.identifier.startsWith("nq-timer-") && (!reminders || !desired.has(n.identifier))) await notifications.cancelScheduledNotificationAsync(n.identifier);
        if (reminders && permission.granted) for (const item of active) {
          const identifier = `nq-timer-${item.session!.id}-${item.session!.startedAt}`;
          const at = new Date(new Date(item.session!.startedAt).getTime() + item.minutes * 60000);
          if (at > new Date() && !scheduled.some(n => n.identifier === identifier)) await notifications.scheduleNotificationAsync({
            identifier,
            content: { title: t(`timers.check_${item.kind}`), body: t("timers.body"), data: { route: item.kind === "sleep" ? "/sleep" : `/entry/nursing/${item.session!.id}` } },
            trigger: at,
          });
        }
        if (Platform.OS !== "ios" || parseFloat(String(Platform.Version)) < 16.2) return;
        // This is optional on older installed binaries without the extension.
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- Load native modules lazily so older binaries can still log.
        const activity = require("expo-live-activity") as typeof import("expo-live-activity");
        const key = "nq-live-session-ids";
        const saved = JSON.parse(await AsyncStorage.getItem(key) ?? "{}") as Record<string, { id: string; start: string }>;
        const remaining: typeof saved = {};
        for (const [sessionId, value] of Object.entries(saved)) {
          if (!live || !active.some(x => x.session!.id === sessionId)) { try { activity.stopActivity(value.id, { title: t("timers.finished") }); } catch { /* Already dismissed by iOS. */ } }
          else remaining[sessionId] = value;
        }
        if (live && AppState.currentState === "active") for (const item of active) {
          const state = { title: t(item.kind === "sleep" ? "sleep.sleeping" : "modern.nursingNow"), subtitle: t("timers.tap"), progressBar: { date: new Date(item.session!.startedAt).getTime() } };
          const existing = remaining[item.session!.id];
          try {
            if (existing) activity.updateActivity(existing.id, state);
            else {
              const id = activity.startActivity(state, { deepLinkUrl: item.kind === "sleep" ? "nursingqueen:///sleep" : `nursingqueen:///entry/nursing/${item.session!.id}`, timerType: "digital" });
              if (id) remaining[item.session!.id] = { id, start: item.session!.startedAt };
            }
          } catch { delete remaining[item.session!.id]; }
        }
        await AsyncStorage.setItem(key, JSON.stringify(remaining));
      }).catch(() => { /* Permission/platform failures never block logging. */ });
    };
    sync();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") sync(); });
    return () => subscription.remove();
  }, [nursing, sleep, reminders, live, t, i18n.language]);
  return null;
}

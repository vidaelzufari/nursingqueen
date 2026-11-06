import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { Icon } from "./Icon";

/** Live sessions remain reachable while browsing the main tabs. No target duration is implied. */
export function SessionDock() {
  const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
  const nursing = useLogStore(s => s.nursingSessions).find(s => !s.endedAt);
  const sleep = useSleepStore(s => s.sessions).find(s => !s.endedAt);
  const stopNursing = useLogStore(s => s.stopNursing); const stopSleep = useSleepStore(s => s.stop);
  const [now, setNow] = useState(Date.now());
  const hasSession = Boolean(nursing || sleep);
  useEffect(() => {
    if (!hasSession) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasSession]);
  if (!nursing && !sleep) return null;
  return <View style={{ width: "92%", maxWidth: 540, alignSelf: "center", marginBottom: 10, gap: 8 }}>
    {([{ session: nursing, kind: "nursing" }, { session: sleep, kind: "sleep" }] as const).map(({ session, kind }) => {
      if (!session) return null;
      const seconds = Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
      const clock = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
      const color = kind === "sleep" ? theme.colors.sleep : theme.colors.nursing;
      return <View key={kind} style={{ flexDirection: "row", alignItems: "center", borderRadius: theme.radii.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: color + "45", padding: 8, ...theme.shadows.card }}>
        <Pressable testID={`session-dock-${kind}`} accessibilityRole="button" accessibilityLabel={t(kind === "sleep" ? "sleep.adjust" : "modern.returnHome")} onPress={() => router.push(kind === "sleep" ? "/sleep" : "/")} style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", minHeight: 52, paddingHorizontal: 8 }}>
          <View style={{ width: 42, height: 42, borderRadius: theme.radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: color + "16" }}><Icon name={kind === "sleep" ? "moon" : "heart"} color={color} size={22} /></View>
          <View><Text style={[theme.type.micro, { color }]}>{t(kind === "sleep" ? "sleep.sleeping" : "modern.nursingNow")}</Text><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary, fontVariant: ["tabular-nums"] }]}>{clock}</Text></View>
        </Pressable>
        <Pressable testID={`session-stop-${kind}`} accessibilityRole="button" accessibilityLabel={t(kind === "sleep" ? "sleep.stop" : "modern.stopNursing")} onPress={() => { if (kind === "sleep") stopSleep(session.id); else stopNursing(); }} style={{ width: 52, height: 52, borderRadius: theme.radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: color }}><Icon name="stop" color={theme.colors.accentContrast} size={20} /></Pressable>
      </View>;
    })}
  </View>;
}

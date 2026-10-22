import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { useTheme } from "@/theme/ThemeProvider";
import { formatDurationShort } from "@/domain/dateMath";
import { Card } from "./Card";
import { Icon, IconName } from "./Icon";
export function RecentActivities({ now }: { now: Date }) {
  const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
  const { nursingSessions, pumpEvents, bottleEvents } = useLogStore(); const sessions = useSleepStore(s => s.sessions);
  const nursing = nursingSessions[0]; const pump = pumpEvents[0]; const bottle = bottleEvents[0]; const sleep = sessions[0];
  const rows = [
    { key: "nursing", icon: "heart" as IconName, entry: nursing, at: nursing?.startedAt, active: nursing && !nursing.endedAt, color: theme.colors.nursing },
    { key: "pump", icon: "pump" as IconName, entry: pump, at: pump?.startedAt, active: false, color: theme.colors.pumping },
    { key: "bottle", icon: "bottle" as IconName, entry: bottle, at: bottle?.occurredAt, active: false, color: theme.colors.bottle },
    { key: "sleep", icon: "moon" as IconName, entry: sleep, at: sleep?.endedAt ?? sleep?.startedAt, active: sleep && !sleep.endedAt, color: theme.colors.accent },
  ];
  return <View style={{ gap: 12, marginBottom: 16 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("recent.title")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{rows.map(row => <Pressable key={row.key} accessibilityRole="button" onPress={() => { if (!row.entry) { router.push(row.key === "sleep" ? "/sleep" : "/history"); return; } if (row.key === "sleep") router.push({ pathname: "/sleep", params: { id: row.entry.id } }); else router.push(`/entry/${row.key}/${row.entry.id}`); }} style={{ flexBasis: "45%", flexGrow: 1 }}><Card style={{ gap: 8 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Icon name={row.icon} color={row.color} size={22} /><Icon name="arrow" size={16} color={theme.colors.textMuted} /></View><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(`recent.${row.key}`)}</Text><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{row.active ? t("forecast.active") : row.at ? t("recent.ago", { time: formatDurationShort(Math.floor(Math.max(0, now.getTime() - new Date(row.at).getTime()) / 60000)) }) : t("design.noFeed")}</Text></Card></Pressable>)}</View></View>;
}

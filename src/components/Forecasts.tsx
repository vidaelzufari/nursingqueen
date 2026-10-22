import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, isSameDay } from "date-fns";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { forecastNext, forecastSleep, countdown } from "@/domain/forecast";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "./Card";
import { Icon, IconName } from "./Icon";
export function Forecasts({ now, compact = false }: { now: Date; compact?: boolean }) {
  const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
  const { nursingSessions, bottleEvents, pumpEvents } = useLogStore();
  const sessions = useSleepStore(s => s.sessions);
  const rows = [
    { key: "feed", icon: "heart" as IconName, active: nursingSessions.some(s => !s.endedAt), forecast: forecastNext([...nursingSessions.map(s => new Date(s.startedAt)), ...bottleEvents.map(s => new Date(s.occurredAt))], now), color: theme.colors.nursing },
    { key: "pump", icon: "pump" as IconName, active: false, forecast: forecastNext(pumpEvents.map(s => new Date(s.startedAt)), now), color: theme.colors.pumping },
    { key: "sleep", icon: "moon" as IconName, active: sessions.some(s => !s.endedAt), forecast: forecastSleep(sessions, now), color: theme.colors.accent },
  ];
  const active = rows.find(row => row.active);
  const sorted = [...rows].filter(row => row.forecast && !row.active).sort((a,b) => a.forecast!.at.getTime() - b.forecast!.at.getTime());
  const next = sorted.find(row => row.forecast!.at > now) ?? sorted[sorted.length - 1];
  const displayed = compact ? next ? [next] : active ? [active] : [] : rows;
  return <View style={{ gap: 12, marginBottom: 24 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("forecast.title")}</Text>
    {displayed.map(row => <Pressable key={row.key} accessibilityRole="button" accessibilityLabel={t(`forecast.${row.key}`)} onPress={() => router.push(row.key === "sleep" ? "/sleep" : "/history")}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: row.color + "18" }}><Icon name={row.icon} color={row.color} size={22} /></View>
        <View style={{ flex: 1 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t(`forecast.${row.key}`)}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{row.active ? t("forecast.active") : row.forecast ? format(row.forecast.at, isSameDay(row.forecast.at, now) ? "p" : "EEE p") : t("forecast.moreLogs")}</Text></View>
        <Text style={[theme.type.bodyStrong, { color: row.color, fontVariant: ["tabular-nums"] }]}>{row.active ? "●" : row.forecast ? row.forecast.at <= now ? t("forecast.reached") : t("forecast.remaining", { time: countdown(row.forecast.at, now) }) : "—"}</Text>
      </Card>
    </Pressable>)}
    {compact && !displayed.length ? <Card><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("forecast.learning")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>{t("forecast.moreLogs")}</Text></Card> : null}
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("forecast.note")}</Text>
    {compact ? <Pressable accessibilityRole="button" onPress={() => router.push("/analytics")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[theme.type.bodyStrong, { color: theme.colors.accent }]}>{t("forecast.all")} →</Text></Pressable> : null}
  </View>;
}

import { dateLocale } from "@/domain/dateLocale";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, isSameDay } from "date-fns";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLogStore } from "@/store/useLogStore";
import { getSleepInsights } from "@/domain/sleepInsights";
import { useActiveBaby } from "@/store/useBabyStore";
import { useSleepStore } from "@/store/useSleepStore";
import { forecastNext, countdown } from "@/domain/forecast";
import { useTheme } from "@/theme/ThemeProvider";
import { IconBadge } from "./IconBadge";
import { Card } from "./Card";
import { Icon, IconName } from "./Icon";
export function Forecasts({ now, compact = false, onAddSession }: { now: Date; compact?: boolean; onAddSession?: () => void }) {
  const theme = useTheme(); const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language); const router = useRouter();
  const { nursingSessions, bottleEvents, pumpEvents } = useLogStore();
  const sessions = useSleepStore(s => s.sessions);
  const baby = useActiveBaby();
  const sleep = getSleepInsights(sessions, now, baby?.dateOfBirth);
  const rows = [
    { key: "feed", icon: "heart" as IconName, active: nursingSessions.some(s => !s.endedAt), forecast: forecastNext([...nursingSessions.filter(s => s.endedAt && (s.durationSeconds ?? 0) > 0).map(s => new Date(s.startedAt)), ...bottleEvents.map(s => new Date(s.occurredAt))], now), color: theme.colors.nursing },
    { key: "pump", icon: "pump" as IconName, active: false, forecast: forecastNext(pumpEvents.filter(s => (s.totalMl ?? 0) > 0).map(s => new Date(s.startedAt)), now), color: theme.colors.pumping },
    { key: "sleep", icon: "moon" as IconName, active: sessions.some(s => !s.endedAt), forecast: sleep.forecast, color: theme.colors.sleep },
  ];
  const active = rows.find(row => row.active);
  const sorted = [...rows].filter(row => row.forecast && !row.active).sort((a,b) => a.forecast!.at.getTime() - b.forecast!.at.getTime());
  const next = sorted.find(row => row.forecast!.at > now) ?? sorted[sorted.length - 1];
  const displayed = compact ? next ? [next] : active ? [active] : [] : rows;
  return <View style={{ gap: 12, marginBottom: 24 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("forecast.title")}</Text>
    {displayed.map(row => <Pressable key={row.key} accessibilityRole="button" accessibilityLabel={t(`forecast.${row.key}`)} onPress={() => router.push(row.key === "sleep" ? "/sleep" : "/history")}>
      <Card style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <IconBadge name={row.icon} color={row.color} size="small" />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t(`forecast.${row.key}`)}</Text>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{row.active ? t("forecast.active") : row.forecast ? format(row.forecast.earliest, isSameDay(row.forecast.at, now) ? "p" : "EEE p", { locale }) + "–" + format(row.forecast.latest, "p", { locale }) : t("forecast.moreLogs")}</Text>
          {row.forecast && !row.active ? <Text style={[theme.type.subtitle, { color: row.color, fontVariant: ["tabular-nums"] }]}>{row.forecast.at <= now ? t("forecast.reached") : t("forecast.remaining", { time: countdown(row.forecast.at, now) })}</Text> : null}
        </View>
      </Card>
    </Pressable>)}
    {compact && !displayed.length ? <Card><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("refresh.learning")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>{t("refresh.learningBody")}</Text><Pressable accessibilityRole="button" onPress={() => onAddSession ? onAddSession() : router.push("/")} style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.accent }]}>{t("refresh.addSession")}</Text><Icon name="arrow" size={16} color={theme.colors.accent} /></Pressable></Card> : null}
    {displayed.filter(row => row.forecast && !row.active).map(row => <Text key={row.key} style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("predictions.evidence", { count: row.forecast!.samples })} · {t(`predictions.${row.forecast!.confidence}`)}</Text>)}
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("forecast.note")}</Text>
    {(!compact || displayed.length > 0) ? <Pressable accessibilityRole="button" onPress={() => router.push("/history")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("predictions.correct")}</Text></Pressable> : null}
    {compact ? <Pressable accessibilityRole="button" onPress={() => router.push("/analytics")} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.accent }]}>{t("forecast.all")}</Text><Icon name="arrow" size={16} color={theme.colors.accent} /></Pressable> : null}
  </View>;
}

import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { sleepSecondsBetween } from "@/domain/sleep";
import { mlToDisplay } from "@/domain/units";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Card } from "./Card";
export function WeeklySummary({ now }: { now: Date }) {
  const theme = useTheme(); const { t } = useTranslation();
  const [metric, setMetric] = useState<"feeds" | "pump" | "sleep">("feeds");
  const { nursingSessions, bottleEvents, pumpEvents } = useLogStore(); const sessions = useSleepStore(s => s.sessions); const unit = useSettingsStore(s => s.unit);
  const days = Array.from({ length: 7 }, (_,i) => addDays(startOfDay(now), i-6));
  const values = days.map(day => metric === "feeds" ? [...nursingSessions.map(s => s.startedAt), ...bottleEvents.map(s => s.occurredAt)].filter(s => isSameDay(new Date(s), day)).length : metric === "pump" ? mlToDisplay(pumpEvents.filter(s => isSameDay(new Date(s.startedAt), day)).reduce((total,s) => total + (s.totalMl ?? 0), 0), unit) : Number((sleepSecondsBetween(sessions, day, isSameDay(day, now) ? now : addDays(day, 1)) / 3600).toFixed(1)));
  const max = Math.max(1, ...values);
  const average = Number((values.reduce((sum, value) => sum + value, 0) / 7).toFixed(1));
  return <Card style={{ gap: 16, marginBottom: 24 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("weekly.title")}</Text>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{format(addDays(startOfDay(now), -6), "d MMM")} – {format(now, "d MMM")} · {t("modern.weekRange")}</Text>
    <View style={{ flexDirection: "row", gap: 8, padding: 5, borderRadius: 28, backgroundColor: theme.colors.surfaceRaised }}>{(["feeds", "pump", "sleep"] as const).map(key => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: metric === key }} onPress={() => setMetric(key)} style={{ flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 22, backgroundColor: metric === key ? theme.colors.accent : theme.colors.surfaceRaised }}><Text style={[theme.type.caption, { color: metric === key ? theme.colors.accentContrast : theme.colors.textSecondary }]}>{t(`weekly.${key}`)}</Text></Pressable>)}</View>
    <View accessibilityLabel={t("weekly.chart")} style={{ flexDirection: "row", gap: 8 }}>{days.map((day,i) => <View key={day.toISOString()} accessibilityLabel={`${format(day, "PP")}: ${values[i]} ${metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : t("weekly.feeds")}`} style={{ flex: 1, alignItems: "center", gap: 7 }}><Text style={[theme.type.micro, { color: theme.colors.textSecondary }]}>{values[i]}</Text><View style={{ height: 112, width: "100%", justifyContent: "flex-end", backgroundColor: theme.colors.surfaceRaised, borderRadius: 10, overflow: "hidden" }}><View style={{ height: `${(values[i] ?? 0) / max * 100}%`, minHeight: values[i] ? 3 : 0, width: "100%", backgroundColor: isSameDay(day, now) ? theme.colors.accent : theme.colors.crown, borderRadius: 10 }} /></View><Text style={[theme.type.micro, { color: theme.colors.textSecondary }]}>{format(day, "EEEEE")}</Text></View>)}</View>
    <View style={{ padding: 12, borderRadius: 18, backgroundColor: theme.colors.surfaceRaised }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("modern.dailyAverage")}: {average} {metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : t("weekly.feeds")}</Text></View>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("weekly.logged")} · {metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : t("weekly.feeds")}</Text>
  </Card>;
}

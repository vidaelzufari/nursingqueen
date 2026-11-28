import { useFoodStore } from "@/store/useFoodStore";
import { HomeActivity, HOME_ACTIVITIES } from "@/domain/homePreferences";
import { dateLocale } from "@/domain/dateLocale";
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
import { Icon } from "./Icon";
import { Card } from "./Card";
export function WeeklySummary({ now, activities = [...HOME_ACTIVITIES], selectedDay, onSelectDay }: { now: Date; activities?: HomeActivity[]; selectedDay?: Date; onSelectDay?: (day: Date) => void }) {
  const theme = useTheme(); const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language);
  const [selectedMetric, setMetric] = useState<"feeds" | "pump" | "sleep" | "solids">("feeds");
  const metrics = (["feeds", "pump", "sleep", "solids"] as const).filter(key => key === "feeds" ? activities.includes("nursing") || activities.includes("bottle") : activities.includes(key));
  const metric = metrics.includes(selectedMetric) ? selectedMetric : metrics[0] ?? "feeds";
  const { nursingSessions, bottleEvents, pumpEvents } = useLogStore(); const sessions = useSleepStore(s => s.sessions); const unit = useSettingsStore(s => s.unit);
  const meals=useFoodStore(s=>s.meals);
  const days = Array.from({ length: 7 }, (_,i) => addDays(startOfDay(now), i-6));
  const values = days.map(day => metric === "solids" ? meals.filter(m=>isSameDay(new Date(m.occurredAt),day)).length : metric === "feeds" ? [...(activities.includes("nursing") ? nursingSessions : []).map(s => s.startedAt), ...(activities.includes("bottle") ? bottleEvents : []).map(s => s.occurredAt)].filter(s => isSameDay(new Date(s), day)).length : metric === "pump" ? mlToDisplay(pumpEvents.filter(s => isSameDay(new Date(s.startedAt), day)).reduce((total,s) => total + (s.totalMl ?? 0), 0), unit) : Number((sleepSecondsBetween(sessions, day, isSameDay(day, now) ? now : addDays(day, 1)) / 3600).toFixed(1)));
  const hasData = values.some(value => value > 0);
  const max = Math.max(1, ...values);
  const average = Number((values.reduce((sum, value) => sum + value, 0) / 7).toFixed(1));
  return <Card style={{ gap: 16, marginBottom: 24 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("weekly.title")}</Text>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{format(addDays(startOfDay(now), -6), "d MMM", { locale })} – {format(now, "d MMM", { locale })} · {t("modern.weekRange")}</Text>
    <View style={{ flexDirection: "row", gap: 8, padding: 5, borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceRaised }}>{metrics.map(key => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: metric === key }} onPress={() => setMetric(key)} style={{ flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: theme.radii.sm, backgroundColor: metric === key ? theme.colors.surface : "transparent" }}><Text style={[theme.type.caption, { color: metric === key ? theme.colors.textPrimary : theme.colors.textSecondary }]}>{t(`weekly.${key}`)}</Text></Pressable>)}</View>
    {hasData ? <View accessibilityLabel={t("weekly.chart")} style={{ flexDirection: "row", gap: 8 }}>{days.map((day,i) => <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityState={{ selected: Boolean(selectedDay && isSameDay(day,selectedDay)) }} onPress={() => onSelectDay?.(day)} accessibilityLabel={`${format(day, "PP", { locale })}: ${values[i]} ${metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : metric === "solids" ? t("weekly.solids") : t("weekly.feeds")}`} style={{ flex: 1, alignItems: "center", gap: 7 }}><Text style={[theme.type.micro, { color: theme.colors.textSecondary }]}>{values[i]}</Text><View style={{ height: 112, width: "100%", justifyContent: "flex-end", backgroundColor: "transparent", borderRadius: 10, overflow: "hidden" }}><View style={{ height: `${(values[i] ?? 0) / max * 100}%`, minHeight: values[i] ? 3 : 0, width: "100%", backgroundColor: isSameDay(day, now) ? theme.colors.accent : theme.colors.crown, borderRadius: 10 }} /></View><Text style={[theme.type.micro, { color: theme.colors.textSecondary }]}>{format(day, "EEEEE", { locale })}</Text></Pressable>)}</View> : <View style={{ alignItems: "center", gap: 10, paddingVertical: 24 }}><Icon name="analytics" color={theme.colors.crown} size={28} /><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary, textAlign: "center" }]}>{t("weekly.emptyTitle")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary, textAlign: "center" }]}>{t("weekly.emptyBody")}</Text></View>}
    <View style={{ padding: 12, borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceRaised }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("modern.dailyAverage")}: {average} {metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : metric === "solids" ? t("weekly.solids") : t("weekly.feeds")}</Text></View>
    <Text style={[theme.type.micro, { color: theme.colors.textSecondary }]}>{t("day.coverage", { count: values.filter(value => value > 0).length })}</Text>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("weekly.logged")} · {metric === "sleep" ? t("weekly.hours") : metric === "pump" ? unit : metric === "solids" ? t("weekly.solids") : t("weekly.feeds")}</Text>
  </Card>;
}

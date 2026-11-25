import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useActiveBaby } from "@/store/useBabyStore";
import { useSleepStore } from "@/store/useSleepStore";
import { getSleepInsights } from "@/domain/sleepInsights";
import { dateLocale } from "@/domain/dateLocale";
import { countdown } from "@/domain/forecast";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";

export function SleepInsights({ now, onReview }: { now: Date; onReview: () => void }) {
  const formatDurationShort = useDurationFormatter();
  const theme = useTheme(); const { t, i18n } = useTranslation();
  const baby = useActiveBaby(); const sessions = useSleepStore(s => s.sessions);
  const result = useMemo(() => getSleepInsights(sessions, now, baby?.dateOfBirth), [sessions, now, baby?.dateOfBirth]);
  const [showDetails, setShowDetails] = useState(false);
  const forecast = result.forecast;
  const locale = dateLocale(i18n.resolvedLanguage ?? i18n.language);
  return <View style={{ gap: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name="sparkles" color={theme.colors.sleep} size={22} /><Text accessibilityRole="header" style={[theme.type.subtitle, { color: theme.colors.textPrimary, flex: 1 }]}>{t("sleepAI.title")}</Text></View>
    <Card raised style={{ gap: 12 }}>
      <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t(`sleepAI.${result.state === "ready" ? "window" : result.state}`)}</Text>
      {forecast ? <>
        <Text style={[theme.type.title, { color: theme.colors.sleep }]}>{format(forecast.earliest, "EEE HH:mm", { locale })} – {format(forecast.latest, "EEE HH:mm", { locale })}</Text>
        <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary, fontVariant: ["tabular-nums"] }]}>{forecast.at > now ? t("sleepAI.remaining", { time: countdown(forecast.at, now) }) : t("sleepAI.windowPassed")}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(`sleepAI.${result.method}`)}</Text>
      </> : result.state !== "sleeping" ? <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t(`sleepAI.${result.state}Body`)}</Text> : null}
      <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleepAI.evidence", { sessions: result.completedSessions, days: result.loggedDays })}</Text>
      {result.state === "review" || result.state === "stale" ? <Button label={t("sleepAI.edit")} tone="neutral" variant="outline" onPress={onReview} /> : null}
    </Card>
    {result.state !== "review" ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      <Card style={{ flexGrow: 1, flexBasis: "44%", gap: 8, padding: 16 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleepAI.last24")}</Text><Text style={[theme.type.title, { color: theme.colors.sleep }]}>{formatDurationShort(Math.floor(result.loggedSeconds24h / 60))}</Text></Card>
      <Card style={{ flexGrow: 1, flexBasis: "44%", gap: 8, padding: 16 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(result.awakeMinutes != null ? "sleepAI.awake" : "sleepAI.typical")}</Text><Text style={[theme.type.title, { color: theme.colors.sleep }]}>{result.awakeMinutes != null ? formatDurationShort(result.awakeMinutes) : result.typicalSessionMinutes != null ? formatDurationShort(result.typicalSessionMinutes) : "—"}</Text></Card>
    </View> : null}
    <Card style={{ gap: 12 }}>
      <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{result.reference ? t("sleepAI.age", result.reference) : t("sleepAI.ageVaries")}</Text>
      <Button label={t("sleepAI.source")} tone="neutral" variant="ghost" onPress={() => void Linking.openURL("https://sleepeducation.org/healthy-sleep/")} />
      <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleepAI.limits")}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDetails }} onPress={() => setShowDetails(!showDetails)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.accent, flex: 1 }]}>{t("sleepAI.how")}</Text><Icon name={showDetails ? "close" : "plus"} size={18} color={theme.colors.accent} /></Pressable>
      {showDetails ? <><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleepAI.explanation")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleepAI.privacy")}</Text></> : null}
    </Card>
  </View>;
}

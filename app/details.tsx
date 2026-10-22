import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, isSameDay, startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { ScreenBack } from "@/components/ScreenBack";
import { Button, Card, EntryRow } from "@/components";
import { useTheme } from "@/theme/ThemeProvider";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { useStashStore } from "@/store/useStashStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatVolume } from "@/domain/units";
import { formatDurationShort } from "@/domain/dateMath";
import { sleepSecondsToday } from "@/domain/sleep";
export default function DetailsScreen() {
  const { kind = "feeds" } = useLocalSearchParams<{ kind?: string }>();
  const theme = useTheme(); const router = useRouter(); const { t } = useTranslation();
  const { nursingSessions, bottleEvents } = useLogStore();
  const sessions = useSleepStore(s => s.sessions); const items = useStashStore(s => s.items);
  const unit = useSettingsStore(s => s.unit);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const feeds = [
    ...nursingSessions.map(s => ({ id: s.id, kind: "nursing" as const, at: new Date(s.startedAt), title: t("history.nursingTitle"), detail: s.durationSeconds != null ? formatDurationShort(Math.round(s.durationSeconds / 60)) : t("design.live") })),
    ...bottleEvents.map(s => ({ id: s.id, kind: "bottle" as const, at: new Date(s.occurredAt), title: t(s.milkType === "formula" ? "history.bottleTitleFormula" : "history.bottleTitleBreastMilk"), detail: s.ml != null ? formatVolume(s.ml, unit) : t("history.needsMl") })),
  ].sort((a,b) => b.at.getTime() - a.at.getTime());
  const rows = kind === "latest" ? feeds.slice(0, 1) : feeds.filter(s => isSameDay(s.at, now));
  const todaySleep = sessions.filter(s => new Date(s.startedAt) <= now && (!s.endedAt || new Date(s.endedAt) > startOfDay(now)));
  const available = items.filter(s => s.status === "available" || s.status === "thawed");
  const title = t(kind === "sleep" ? "sleep.today" : kind === "stash" ? "statusStrip.currentStash" : kind === "latest" ? "statusStrip.lastFeed" : "statusStrip.todayFeeds");
  return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 24, gap: 16, width: "100%", maxWidth: 580, alignSelf: "center", paddingBottom: 40 }}>
    <ScreenBack /><Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{title}</Text>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("details.editHint")}</Text>
    {kind === "sleep" ? <>
      <Card><Text style={[theme.type.display, { color: theme.colors.accent }]}>{formatDurationShort(Math.floor(sleepSecondsToday(sessions, now) / 60))}</Text><Text style={{ color: theme.colors.textSecondary }}>{t("sleep.today")}</Text></Card>
      {todaySleep.map(s => <EntryRow key={s.id} kind="sleep" title={t("sleep.title")} timeLabel={`${format(new Date(s.startedAt), "PPp")} — ${s.endedAt ? format(new Date(s.endedAt), "PPp") : t("sleep.sleeping")}`} detailLabel={s.endedAt ? formatDurationShort(Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)) : undefined} onPress={() => router.push({ pathname: "/sleep", params: { id: s.id } })} />)}
      {!todaySleep.length ? <Text style={{ color: theme.colors.textSecondary }}>{t("sleep.empty")}</Text> : null}<Button label={t("sleep.title")} onPress={() => router.push("/sleep")} />
    </> : kind === "stash" ? <>
      <Card><Text style={[theme.type.display, { color: theme.colors.accent }]}>{formatVolume(available.reduce((sum, s) => sum + s.ml, 0), unit)}</Text></Card>
      {available.map(s => <Card key={s.id}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{formatVolume(s.ml, unit)}</Text><Text style={{ color: theme.colors.textSecondary }}>{format(new Date(s.pumpedAt), "PPp")} · {t(`stash.location.${s.location}`, { defaultValue: s.location })}</Text></Card>)}
      {!available.length ? <Text style={{ color: theme.colors.textSecondary }}>{t("details.noStash")}</Text> : null}
    </> : <>
      {rows.map(s => <EntryRow key={s.id} kind={s.kind} title={s.title} timeLabel={format(s.at, "PPp")} detailLabel={s.detail} onPress={() => router.push(`/entry/${s.kind}/${s.id}`)} />)}
      {!rows.length ? <Text style={{ color: theme.colors.textSecondary }}>{t("details.noFeeds")}</Text> : null}
      <Button label={t("history.title")} tone="neutral" variant="outline" onPress={() => router.push("/history")} />
    </>}
    <View style={{ height: 12 }} />
  </ScrollView>;
}

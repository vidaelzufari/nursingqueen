import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import { EmptyState } from "@/components/EmptyState";
import { EntryRow } from "@/components/EntryRow";
import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import React, { useEffect, useRef, useState } from "react";
import type { ScrollView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parse } from "date-fns";
import { useTranslation } from "react-i18next";
import { SleepInsights } from "@/components/SleepInsights";
import { dateLocale } from "@/domain/dateLocale";
import { ScreenBack } from "@/components/ScreenBack";
import { Button, Card } from "@/components";
import { DateTimeField } from "@/components/DateTimeField";
import { ActivityArtwork } from "@/components/ActivityArtwork";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useSleepStore } from "@/store/useSleepStore";
import { validSleepRange } from "@/domain/sleep";
const DATE_FORMAT = "yyyy-MM-dd HH:mm";
export default function SleepScreen() {
  const formatDurationShort = useDurationFormatter();
  const theme = useTheme(); const { t, i18n } = useTranslation(); const router = useRouter();
  const locale = dateLocale(i18n.resolvedLanguage ?? i18n.language);
  const { width } = useWindowDimensions();
  const dialSize = Math.min(250, width - 100);
  const scroll = useRef<ScrollView>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { sessions, babyId, start, stop, save, remove, adjustStart } = useSleepStore();
  const existing = sessions.find(s => s.id === id);
  const active = sessions.find(s => !s.endedAt);
  const [now, setNow] = useState(new Date());
  const [manual, setManual] = useState(Boolean(id));
  const [from, setFrom] = useState(format(existing ? new Date(existing.startedAt) : new Date(Date.now() - 3600000), DATE_FORMAT));
  const [to, setTo] = useState(format(existing?.endedAt ? new Date(existing.endedAt) : new Date(), DATE_FORMAT));
  const [error, setError] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (existing) {
      setManual(true);
      setFrom(format(new Date(existing.startedAt), DATE_FORMAT));
      setTo(format(existing.endedAt ? new Date(existing.endedAt) : new Date(), DATE_FORMAT));
    }
    // Only initialize when opening a different entry, never while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);
  const startDate = parse(from, DATE_FORMAT, new Date()); const endDate = parse(to, DATE_FORMAT, new Date());
  const valid = validSleepRange(startDate, endDate, now);
  const shiftStart = (seconds: number) => {
    if (!active) return;
    try { adjustStart(active.id, seconds); setError(false); } catch { setError(true); }
  };
  const elapsed = active ? Math.floor(Math.max(0, now.getTime() - new Date(active.startedAt).getTime()) / 1000) : 0;
  const timerText = [Math.floor(elapsed / 3600), Math.floor(elapsed % 3600 / 60), elapsed % 60].map(n => String(n).padStart(2, "0")).join(":");
  return <Screen ref={scroll}>
    <ScreenBack />
    <Text style={[theme.type.display, { color: theme.colors.textPrimary }]}>{t("sleep.title")}</Text>
    {!manual ? <>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("sleepAI.intro")}</Text>
      <Card style={{ alignItems: "center", gap: 20, paddingVertical: 28 }}>
        <View style={{ width: dialSize, height: dialSize, borderRadius: dialSize / 2, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Svg pointerEvents="none" width={dialSize} height={dialSize} viewBox="0 0 250 250" style={{ position: "absolute" }}>
            <Circle cx={125} cy={125} r={116} stroke={theme.colors.sleep + "12"} strokeWidth={8} fill="none" />
            <Circle cx={125} cy={125} r={102} stroke={theme.colors.sleep + "10"} strokeWidth={1} fill="none" />
          </Svg>
          <ActivityArtwork kind="moon" size={48} color={theme.colors.sleep} />
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(active ? "sleep.sleeping" : "sleep.ready")}</Text>
          <Text style={[theme.type.display, { fontSize: dialSize < 230 ? 28 : 36, color: theme.colors.textPrimary, fontVariant: ["tabular-nums"] }]}>{timerText}</Text>
        </View>
        {active ? <>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleep.startedAt", { time: format(new Date(active.startedAt), "PPp", { locale }) })}</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Button label={`−${t("common.minutesShort", { count: 1 })}`} tone="neutral" variant="outline" onPress={() => shiftStart(-60)} style={{ width: 92, paddingHorizontal: 0 }} />
            <Button label={`+${t("common.minutesShort", { count: 1 })}`} tone="neutral" variant="outline" disabled={new Date(active.startedAt).getTime() + 60000 >= now.getTime()} onPress={() => shiftStart(60)} style={{ width: 92, paddingHorizontal: 0 }} />
          </View>
          {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("sleep.invalid")}</Text> : null}
        </> : null}
        <Button fullWidth label={t(active ? "sleep.stop" : "sleep.start")} icon={<Icon name={active ? "stop" : "moon"} color={theme.colors.accentContrast} />} onPress={() => { if (!babyId) { router.push("/profile/edit"); return; } if (active) stop(active.id); else start(); }} />
      </Card>
      <Button label={t("sleepAI.logEarlier")} tone="neutral" variant="outline" onPress={() => { setManual(true); scroll.current?.scrollTo({ y: 0, animated: true }); }} />
      <SleepInsights now={now} onReview={() => { const entry = active ?? sessions[0]; if (entry) router.push({ pathname: "/sleep", params: { id: entry.id } }); else setManual(true); }} />
    </> : <Card style={{ gap: 14 }}>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("sleep.dateHint")}</Text>
      <DateTimeField label={t("sleep.from")} value={from} onChange={setFrom} />
      <DateTimeField label={t("sleep.to")} value={to} onChange={setTo} />
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("sleep.invalid")}</Text> : null}
      <Button label={t("common.save")} disabled={!valid} onPress={() => { if (!babyId) { router.push("/profile/edit"); return; } try { save(startDate, endDate, existing?.id); goBackOrHome(router); } catch { setError(true); } }} />
      {existing ? <Button label={t(confirmDelete ? "sleep.confirmDelete" : "common.delete")} tone="danger" variant="ghost" onPress={() => { if (!confirmDelete) setConfirmDelete(true); else { remove(existing.id); goBackOrHome(router); } }} /> : <Button label={t("common.cancel")} tone="neutral" variant="ghost" onPress={() => setManual(false)} />}
    </Card>}
    {!manual ? <><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("sleep.recent")}</Text>{sessions.length === 0 ? <EmptyState icon="moon" title={t("sleep.empty")} /> : sessions.slice(0, 20).map(session => <EntryRow key={session.id} kind="sleep" title={t("sleep.title")} timeLabel={format(new Date(session.startedAt), "PPp", { locale })} detailLabel={session.endedAt ? formatDurationShort(Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)) : t("sleep.sleeping")} onPress={() => router.push({ pathname: "/sleep", params: { id: session.id } })} />)}</> : null}
  </Screen>;
}

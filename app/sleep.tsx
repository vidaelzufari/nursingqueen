import { goBackOrHome } from "@/navigation/back";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parse } from "date-fns";
import { useTranslation } from "react-i18next";
import { ScreenBack } from "@/components/ScreenBack";
import { Button, Card } from "@/components";
import { DateTimeField } from "@/components/DateTimeField";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useSleepStore } from "@/store/useSleepStore";
import { validSleepRange } from "@/domain/sleep";
import { formatDurationShort } from "@/domain/dateMath";
const DATE_FORMAT = "yyyy-MM-dd HH:mm";
export default function SleepScreen() {
  const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
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
  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 18, maxWidth: 580, width: "100%", alignSelf: "center", paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
    <ScreenBack />
    <Icon name="moon" size={36} color={theme.colors.accent} />
    <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("sleep.title")}</Text>
    {!manual ? <>
      <Card style={{ alignItems: "center", gap: 20, paddingVertical: 28 }}>
        <View style={{ width: 220, height: 220, borderRadius: 110, borderWidth: active ? 3 : 1, borderColor: active ? theme.colors.accent : theme.colors.border, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Icon name="moon" size={36} color={theme.colors.accent} />
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(active ? "sleep.sleeping" : "sleep.ready")}</Text>
          <Text style={[theme.type.display, { fontSize: 32, color: theme.colors.textPrimary, fontVariant: ["tabular-nums"] }]}>{timerText}</Text>
        </View>
        {active ? <>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("sleep.startedAt", { time: format(new Date(active.startedAt), "PPp") })}</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Button label="−1 min" tone="neutral" variant="outline" onPress={() => shiftStart(-60)} style={{ width: 92, paddingHorizontal: 0 }} />
            <Button label="+1 min" tone="neutral" variant="outline" disabled={new Date(active.startedAt).getTime() + 60000 >= now.getTime()} onPress={() => shiftStart(60)} style={{ width: 92, paddingHorizontal: 0 }} />
          </View>
          {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("sleep.invalid")}</Text> : null}
        </> : null}
        <Button fullWidth label={t(active ? "sleep.stop" : "sleep.start")} icon={<Icon name={active ? "stop" : "moon"} color={theme.colors.accentContrast} />} onPress={() => { if (!babyId) { router.push("/profile/edit"); return; } if (active) stop(active.id); else start(); }} />
      </Card>
      <Button label={t("sleep.manual")} tone="neutral" variant="outline" onPress={() => setManual(true)} />
    </> : <Card style={{ gap: 14 }}>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("sleep.dateHint")}</Text>
      <DateTimeField label={t("sleep.from")} value={from} onChange={setFrom} />
      <DateTimeField label={t("sleep.to")} value={to} onChange={setTo} />
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("sleep.invalid")}</Text> : null}
      <Button label={t("common.save")} disabled={!valid} onPress={() => { if (!babyId) { router.push("/profile/edit"); return; } try { save(startDate, endDate, existing?.id); goBackOrHome(router); } catch { setError(true); } }} />
      {existing ? <Button label={t(confirmDelete ? "sleep.confirmDelete" : "common.delete")} tone="danger" variant="outline" onPress={() => { if (!confirmDelete) setConfirmDelete(true); else { remove(existing.id); goBackOrHome(router); } }} /> : <Button label={t("common.cancel")} tone="neutral" variant="ghost" onPress={() => setManual(false)} />}
    </Card>}
    {!manual ? <><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("sleep.recent")}</Text>{sessions.length === 0 ? <Text style={{ color: theme.colors.textSecondary }}>{t("sleep.empty")}</Text> : sessions.map(session => <Button key={session.id} tone="neutral" variant="outline" label={format(new Date(session.startedAt), "PPp")} subLabel={session.endedAt ? formatDurationShort(Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)) : t("sleep.sleeping")} onPress={() => router.push({ pathname: "/sleep", params: { id: session.id } })} />)}</> : null}
  </ScrollView></View>;
}

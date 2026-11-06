import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format, isSameDay } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "@/components";
import { Icon, IconName } from "@/components/Icon";
import { RecentActivities } from "@/components/RecentActivities";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Forecasts } from "@/components/Forecasts";
import { useSleepStore } from "@/store/useSleepStore";
import { sleepSecondsToday } from "@/domain/sleep";
import { parseBirthDate, validBirthDate } from "@/domain/birthDate";
import { useActiveBaby, useBabyStore } from "@/store/useBabyStore";
import { useLogStore, computeStatusStrip } from "@/store/useLogStore";
import { useStashStore } from "@/store/useStashStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeAge, formatDurationShort, minutesSince } from "@/domain/dateMath";
import { computeStashForecast } from "@/domain/recommendations";
import { formatVolume } from "@/domain/units";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  const activeBaby = useActiveBaby();
  const unit = useSettingsStore((s) => s.unit);

  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);
  const openNursingSession = useLogStore((s) => s.openNursingSession)();
  const startNursing = useLogStore((s) => s.startNursing);
  const stopNursing = useLogStore((s) => s.stopNursing);
  const logPump = useLogStore((s) => s.logPump);

  const sleepSessions = useSleepStore(s => s.sessions);
  const openSleepSession = sleepSessions.find(s => !s.endedAt);
  const activeSleep = Boolean(openSleepSession);
  const startSleep = useSleepStore(s => s.start);
  const stopSleep = useSleepStore(s => s.stop);
  const stashItems = useStashStore((s) => s.items);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(interval);
  }, [openNursingSession, activeSleep]);

  const statusStrip = useMemo(
    () => computeStatusStrip(nursingSessions, pumpEvents, bottleEvents, now),
    [nursingSessions, pumpEvents, bottleEvents, now]
  );

  const birthDate = activeBaby && validBirthDate(activeBaby.dateOfBirth, now) ? parseBirthDate(activeBaby.dateOfBirth) : null;
  const age = birthDate ? computeAge(birthDate, now) : null;

  const stashForecast = useMemo(() => {
    const totalTodayMl = statusStrip.todayBottleMl;
    return computeStashForecast(stashItems, now, totalTodayMl > 0 ? totalTodayMl : null);
  }, [stashItems, now, statusStrip.todayBottleMl]);

  // Resolve at tap time too: Home can remain mounted behind the profile modal.
  const prepareLogging = () => {
    const babyStore = useBabyStore.getState();
    babyStore.refresh();
    const baby = babyStore.activeBaby();
    if (baby) {
      if (useLogStore.getState().babyId !== baby.id) useLogStore.getState().refresh(baby.id);
      if (useSleepStore.getState().babyId !== baby.id) useSleepStore.getState().refresh(baby.id);
    }
    return baby;
  };
  const handleStart = () => {
    if (!prepareLogging()) { router.push({ pathname: "/profile/edit", params: { intent: "nurse" } }); return; }
    startNursing();
  };
  const handleStop = () => {
    if (openNursingSession) {
      stopNursing();
    } else {
      router.push("/modals/nursing-duration");
    }
  };
  const handlePump = () => {
    if (!prepareLogging()) { router.push({ pathname: "/profile/edit", params: { intent: "pump" } }); return; }
    const event = logPump();
    router.push({ pathname: "/modals/pump-details", params: { id: event.id } });
  };
  const handleSleep = () => {
    if (!prepareLogging()) { router.push({ pathname: "/profile/edit", params: { intent: "sleep" } }); return; }
    if (openSleepSession) stopSleep(openSleepSession.id);
    else startSleep();
  };
  const handleBottle = () => { if (prepareLogging()) router.push("/modals/bottle-entry"); else router.push({ pathname: "/profile/edit", params: { intent: "bottle" } }); };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
        <View style={{ gap: 10, marginTop: 8, marginBottom: 24, padding: 16, backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }}>
          <Text style={[theme.type.micro, { color: theme.colors.accentContrast, letterSpacing: 2 }]}>{t("design.brand")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text accessibilityRole="header" style={[theme.type.display, { color: theme.colors.accentContrast }]}>{t("analytics.today")}</Text>
              {activeBaby ? <Text style={[theme.type.body, { color: theme.colors.accentContrast }]}>
                {activeBaby.name} · {age ? age.isMonthsPhase ? t("profile.age.months", { count: age.months }) : t("profile.age.weeks", { count: age.weeks }) : t("setup.editDate")}
              </Text> : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t(activeBaby ? "profile.title" : "profile.addBaby")}
              testID={activeBaby ? "home-avatar-button" : "home-add-baby-cta"}
              onPress={() => router.push(activeBaby ? "/profile" : "/profile/edit")}
              style={({ pressed }) => ({ width: 58, height: 58, borderRadius: theme.radii.md, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 })}>
              {activeBaby ? <Text style={[theme.type.title, { color: theme.colors.accent }]}>{activeBaby.name.charAt(0).toUpperCase()}</Text> : <Icon name="plus" color={theme.colors.accent} />}
            </Pressable>
          </View>
        </View>

        {!activeBaby ? <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginBottom: 20 }]}>{t("setup.homeHint")}</Text> : null}
        <Text accessibilityRole="header" style={[theme.type.subtitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{t("design.quickLog")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <RoundAction testID={openNursingSession ? "home-button-stop-nursing" : "home-button-start-nursing"} subLabel={openNursingSession ? elapsedClock(openNursingSession.startedAt, now) : undefined} icon={openNursingSession ? "stop" : "heart"} label={openNursingSession ? t("design.finish") : t("design.nurse")} color={theme.colors.nursing} active={Boolean(openNursingSession)} onPress={openNursingSession ? handleStop : handleStart} />
          <RoundAction testID="home-button-pump" icon="pump" label={t("design.pump")} color={theme.colors.pumping} onPress={handlePump} />
          <RoundAction testID="home-button-bottle" icon="bottle" label={t("home.bottle")} color={theme.colors.bottle} onPress={handleBottle} />
          <RoundAction testID="home-button-sleep" icon={activeSleep ? "stop" : "moon"} label={t(activeSleep ? "sleep.stop" : "sleep.title")} color={theme.colors.sleep} active={activeSleep} statusLabel={activeSleep ? t("sleep.sleeping") : undefined} subLabel={openSleepSession ? elapsedClock(openSleepSession.startedAt, now) : undefined} onPress={handleSleep} />
        </View>
        {activeSleep ? <Pressable accessibilityRole="button" onPress={() => router.push("/sleep")} style={{ alignSelf: "center", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name="clock" size={16} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("sleep.adjust")}</Text></Pressable> : null}
        {!openNursingSession ? <Pressable accessibilityRole="button" onPress={() => router.push(activeBaby ? "/modals/nursing-duration" : { pathname: "/profile/edit", params: { intent: "earlier" } })} style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, marginBottom: 16 }}><Icon name="history" size={15} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("design.earlierFeed")}</Text></Pressable> : <View style={{ height: 20 }} />}
        <Forecasts now={now} compact />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("design.atGlance")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Icon name="clock" size={14} color={theme.colors.textMuted} /><Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{format(now, "EEE, d MMM")}</Text></View>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "latest" } })} icon="heart" label={t("statusStrip.lastFeed")} value={statusStrip.lastFeedAt ? formatDurationShort(minutesSince(statusStrip.lastFeedAt, now)) : t("design.noFeed")} color={theme.colors.nursing} />
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "feeds" } })} icon="bottle" label={t("statusStrip.todayFeeds")} value={String(statusStrip.todayNursingCount + bottleEvents.filter(event => isSameDay(new Date(event.occurredAt), now)).length)} color={theme.colors.pumping} />
        </View>
        <RecentActivities now={now} />
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}><Metric onPress={() => router.push({ pathname: "/details", params: { kind: "sleep" } })} icon="moon" label={t("sleep.today")} value={formatDurationShort(Math.floor(sleepSecondsToday(sleepSessions, now) / 60))} color={theme.colors.sleep} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("statusStrip.currentStash")} onPress={() => router.push({ pathname: "/details", params: { kind: "stash" } })}><Card style={{ marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}><Icon name="pump" color={theme.colors.bottle} /></View>
          <View style={{ flex: 1 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("statusStrip.currentStash")}</Text><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{formatVolume(stashForecast.totalMl, unit)}</Text></View>
          <Icon name="bottle" color={theme.colors.bottle} size={20} />
        </Card></Pressable>

        <WeeklySummary now={now} />


      </ScrollView>
    </AppShell>
  );
}

function RoundAction({ icon, label, color, onPress, active = false, testID, subLabel, statusLabel }: { icon: IconName; label: string; color: string; onPress: () => void; active?: boolean; testID: string; subLabel?: string; statusLabel?: string }) {
  const theme = useTheme();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => ({ flexBasis: "43%", flexGrow: 1, minHeight: 128, minWidth: 0, padding: 12, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: active ? color : color + "48", backgroundColor: color + (active ? "2C" : "17"), alignItems: "flex-start", justifyContent: "space-between", opacity: pressed ? 0.7 : 1, gap: 8 })}>
    <View style={{ width: active && subLabel ? 94 : 58, minHeight: 58, borderRadius: theme.radii.sm, backgroundColor: color, alignItems: "center", justifyContent: "center", paddingVertical: 6, gap: 2 }}>
      <Icon name={icon} size={active && subLabel ? 19 : 30} color={theme.colors.accentContrast} />
      {active && subLabel ? <Text style={[theme.type.caption, { color: theme.colors.accentContrast, fontVariant: ["tabular-nums"] }]}>{subLabel}</Text> : null}
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Icon name={active ? "clock" : "plus"} size={14} color={color} /><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary, textAlign: "center" }]}>{label}</Text></View>
    {statusLabel ? <Text style={[theme.type.caption, { color, textAlign: "center" }]}>{statusLabel}</Text> : null}
  </Pressable>;
}
function Metric({ icon, label, value, color, onPress }: { icon: IconName; label: string; value: string; color: string; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={{ flex: 1 }}><Card style={{ minHeight: 106, gap: 5 }}><Icon name={icon} size={21} color={color} /><Text style={[theme.type.title, { color: theme.colors.textPrimary, fontSize: 25 }]}>{value}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{label}</Text><View style={{ position: "absolute", end: 14, top: 16 }}><Icon name="arrow" size={16} color={theme.colors.textMuted} /></View></Card></Pressable>;
}

function elapsedClock(startedAt: string, now: Date): string {
  const seconds = Math.floor(Math.max(0, now.getTime() - new Date(startedAt).getTime()) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
}

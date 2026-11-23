import { dateLocale } from "@/domain/dateLocale";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format, isSameDay } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
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
  const scroll = useRef<ScrollView>(null);
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language);
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
      <ScrollView ref={scroll} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t(activeBaby ? "profile.title" : "profile.addBaby")} testID={activeBaby ? "home-avatar-button" : "home-add-baby-cta"} onPress={() => router.push(activeBaby ? "/profile" : "/profile/edit")} style={{ marginTop: 8, marginBottom: 24 }}>
          <Card raised style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: theme.radii.xl }}>
            {activeBaby?.photoUri ? <Image source={{ uri: activeBaby.photoUri }} style={{ width: 62, height: 62, borderRadius: 22 }} /> : <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" }}><Icon name="baby" size={32} color={theme.colors.accent} /></View>}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{activeBaby?.name ?? t("profile.addBaby")}</Text>
              {age ? <Text style={[theme.type.caption, { color: theme.colors.accent }]}>{age.isMonthsPhase ? t("profile.age.months", { count: age.months }) : t("profile.age.weeks", { count: age.weeks })}</Text> : null}
              <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("refresh.manageProfile")}</Text>
            </View>
            <Icon name="arrow" size={20} color={theme.colors.accent} />
          </Card>
        </Pressable>

        {!activeBaby ? <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginBottom: 20 }]}>{t("setup.homeHint")}</Text> : null}
        <Text accessibilityRole="header" style={[theme.type.subtitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{t("refresh.actions")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <RoundAction hint={t("refresh.nursingHint")} testID={openNursingSession ? "home-button-stop-nursing" : "home-button-start-nursing"} subLabel={openNursingSession ? elapsedClock(openNursingSession.startedAt, now) : undefined} icon={openNursingSession ? "stop" : "heart"} label={t("refresh.feed")} actionLabel={openNursingSession ? t("design.finish") : t("refresh.start")} color={theme.colors.nursing} active={Boolean(openNursingSession)} onPress={openNursingSession ? handleStop : handleStart} />
          <RoundAction hint={t("refresh.pumpHint")} actionLabel={t("refresh.add")} testID="home-button-pump" icon="pump" label={t("refresh.pump")} color={theme.colors.pumping} onPress={handlePump} />
          <RoundAction hint={t("refresh.bottleHint")} actionLabel={t("refresh.add")} testID="home-button-bottle" icon="bottle" label={t("home.bottle")} color={theme.colors.bottle} onPress={handleBottle} />
          <RoundAction hint={t("refresh.sleepHint")} actionLabel={t(activeSleep ? "sleep.stop" : "refresh.start")} testID="home-button-sleep" icon={activeSleep ? "stop" : "moon"} label={t("sleep.title")} color={theme.colors.sleep} active={activeSleep} statusLabel={activeSleep ? t("sleep.sleeping") : undefined} subLabel={openSleepSession ? elapsedClock(openSleepSession.startedAt, now) : undefined} onPress={handleSleep} />
        </View>
        {activeSleep ? <Pressable accessibilityRole="button" onPress={() => router.push("/sleep")} style={{ alignSelf: "center", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name="clock" size={16} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("sleep.adjust")}</Text></Pressable> : null}
        {!openNursingSession ? <Pressable accessibilityRole="button" onPress={() => router.push(activeBaby ? "/modals/nursing-duration" : { pathname: "/profile/edit", params: { intent: "earlier" } })} style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, marginBottom: 16 }}><Icon name="history" size={15} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("design.earlierFeed")}</Text></Pressable> : <View style={{ height: 20 }} />}
        <RecentActivities now={now} />
        <Forecasts now={now} compact onAddSession={() => scroll.current?.scrollTo({ y: 0, animated: true })} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("design.atGlance")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Icon name="clock" size={14} color={theme.colors.textMuted} /><Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{format(now, "EEE, d MMM", { locale })}</Text></View>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "latest" } })} icon="heart" label={t("statusStrip.lastFeed")} value={statusStrip.lastFeedAt ? formatDurationShort(minutesSince(statusStrip.lastFeedAt, now)) : t("design.noFeed")} color={theme.colors.nursing} />
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "feeds" } })} icon="bottle" label={t("statusStrip.todayFeeds")} value={String(statusStrip.todayNursingCount + bottleEvents.filter(event => isSameDay(new Date(event.occurredAt), now)).length)} color={theme.colors.pumping} />
        </View>
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

function RoundAction({ icon, label, hint, actionLabel, color, onPress, active = false, testID, subLabel, statusLabel }: { icon: IconName; label: string; hint: string; actionLabel: string; color: string; onPress: () => void; active?: boolean; testID: string; subLabel?: string; statusLabel?: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  return <Card raised={active} style={{ flexBasis: "43%", flexGrow: 1, minWidth: 0, padding: 16, gap: 12, borderRadius: theme.radii.xl, borderColor: active ? color : theme.colors.border, minHeight: 216 }}>
    <View style={{ width: 46, height: 46, borderRadius: 17, backgroundColor: color + "16", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={26} color={color} /></View>
    <View style={{ flex: 1, gap: 4 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{label}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{active ? statusLabel ?? hint : hint}</Text></View>
    {active && subLabel ? <Text accessibilityLiveRegion="none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[theme.type.subtitle, { color, fontVariant: ["tabular-nums"], fontSize: width < 360 ? 18 : 23, lineHeight: 30 }]}>{subLabel}</Text> : null}
    <Button testID={testID} label={actionLabel} onPress={onPress} icon={width >= 360 ? <Icon name={active ? "stop" : icon === "heart" || icon === "moon" ? "play" : "plus"} size={17} color={theme.colors.accentContrast} /> : undefined} style={{ minHeight: 48, paddingHorizontal: 8, borderRadius: theme.radii.pill }} />
  </Card>;
}

function Metric({ icon, label, value, color, onPress }: { icon: IconName; label: string; value: string; color: string; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={{ flex: 1 }}><Card style={{ minHeight: 106, gap: 5 }}><Icon name={icon} size={21} color={color} /><Text style={[theme.type.title, { color: theme.colors.textPrimary, fontSize: 25 }]}>{value}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{label}</Text><View style={{ position: "absolute", end: 14, top: 16 }}><Icon name="arrow" size={16} color={theme.colors.textMuted} /></View></Card></Pressable>;
}

function elapsedClock(startedAt: string, now: Date): string {
  const seconds = Math.floor(Math.max(0, now.getTime() - new Date(startedAt).getTime()) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
}

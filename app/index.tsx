import { useFeedbackStore } from "@/store/useFeedbackStore";
import { BabyAvatar } from "@/components/BabyAvatar";
import { formatAge } from "@/i18n/formatAge";
import { useFoodStore } from "@/store/useFoodStore";
import { normalizeHomeActivities, visibleHomeActivities } from "@/domain/homePreferences";
import { defaultSleepPeriod, sleepPeriod } from "@/domain/sleep";
import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import { dateLocale } from "@/domain/dateLocale";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format, isSameDay } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "@/components";
import { Icon, IconName } from "@/components/Icon";
import { ActivityArtwork } from "@/components/ActivityArtwork";
import { BrandMark } from "@/components/BrandMark";
import { RecentActivities } from "@/components/RecentActivities";
import { WeeklySummary } from "@/components/WeeklySummary";
import { RoutineOutlook } from "@/components/RoutineOutlook";
import { useSleepStore } from "@/store/useSleepStore";
import { sleepSecondsToday } from "@/domain/sleep";
import { parseBirthDate, validBirthDate } from "@/domain/birthDate";
import { useActiveBaby, useBabyStore } from "@/store/useBabyStore";
import { useLogStore, computeStatusStrip } from "@/store/useLogStore";
import { useStashStore } from "@/store/useStashStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeAge, minutesSince } from "@/domain/dateMath";
import { computeStashForecast } from "@/domain/recommendations";
import { formatVolume } from "@/domain/units";

export default function HomeScreen() {
  const formatDurationShort = useDurationFormatter();
  const scroll = useRef<ScrollView>(null);
  const timerRowBottom = useRef(0);
  const scrollOffset = useRef(0);
  const [showSessionDock, setShowSessionDock] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const pumpOpening = useRef(false);
  useEffect(() => { if (pathname === "/") pumpOpening.current = false; }, [pathname]);
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language);
  const [now, setNow] = useState(() => new Date());

  const activeBaby = useActiveBaby();
  const unit = useSettingsStore((s) => s.unit);
  const homeActivities = useSettingsStore(s => s.homeActivities);
  const selectedActivities = normalizeHomeActivities(homeActivities);

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
  const visible = visibleHomeActivities(selectedActivities, { nursing: Boolean(openNursingSession), sleep: activeSleep });
  const show = (key: typeof visible[number]) => visible.includes(key);
  const showFeeds = show("nursing") || show("bottle");
  const startSleep = useSleepStore(s => s.start);
  const stopSleep = useSleepStore(s => s.stop);
  const solidMeals = useFoodStore(s => s.meals);
  const stashItems = useStashStore((s) => s.items);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(interval);
  }, [openNursingSession, activeSleep]);

  const statusStrip = computeStatusStrip(show("nursing") ? nursingSessions : [], pumpEvents, show("bottle") ? bottleEvents : [], now);

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
    if (pumpOpening.current) return;
    pumpOpening.current = true;
    try { const event = logPump(); router.push({ pathname: "/modals/pump-details", params: { id: event.id } }); } catch { pumpOpening.current = false; useFeedbackStore.getState().show(t("entryQA.saveError")); }
  };
  const handleSleep = () => {
    if (!prepareLogging()) { router.push({ pathname: "/profile/edit", params: { intent: "sleep" } }); return; }
    if (openSleepSession) stopSleep(openSleepSession.id);
    else startSleep();
  };
  const handleBottle = () => { if (prepareLogging()) router.push("/modals/bottle-entry"); else router.push({ pathname: "/profile/edit", params: { intent: "bottle" } }); };

  return (
    <AppShell showSessionDock={showSessionDock}>
      <ScrollView testID="home-scroll" ref={scroll} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} scrollEventThrottle={100} onScroll={event => { scrollOffset.current = event.nativeEvent.contentOffset.y; setShowSessionDock(timerRowBottom.current > 0 && scrollOffset.current > timerRowBottom.current); }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 }}><BrandMark size={28} /><Text style={[theme.type.caption, { color: theme.colors.accent, letterSpacing: 0.4 }]}>Nursing Queen</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={t(activeBaby ? "profile.title" : "profile.addBaby")} testID={activeBaby ? "home-avatar-button" : "home-add-baby-cta"} onPress={() => router.push(activeBaby ? "/profile" : "/profile/edit")} style={{ marginTop: 0, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <BabyAvatar uri={activeBaby?.photoUri} size={56} label={activeBaby?.name ?? t("profile.title")} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}><Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{activeBaby?.name ?? t("profile.addBaby")}</Text>{age ? <Text style={[theme.type.caption, { color: theme.colors.accent }]}>{formatAge(age, t)}</Text> : null}</View>
              <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("refresh.manageProfile")}</Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" }}><Icon name="arrow" size={18} color={theme.colors.textPrimary} /></View>
          </View>
        </Pressable>

        {!activeBaby ? <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginBottom: 20 }]}>{t("setup.homeHint")}</Text> : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}><Text accessibilityRole="header" style={[theme.type.subtitle, { flex: 1, color: theme.colors.textPrimary }]}>{t("refresh.actions")}</Text><Pressable testID="home-personalize" accessibilityRole="button" accessibilityLabel={t("homeSetup.title")} onPress={() => router.push("/settings/home")} style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}><Icon name="settings" size={20} color={theme.colors.accent} /></Pressable></View>
        <View testID="home-action-grid" onLayout={event => { const { y, height } = event.nativeEvent.layout; const rows = Math.ceil(visible.length / 2); const lastActive = Math.max(openNursingSession ? visible.indexOf("nursing") : 0, activeSleep ? visible.indexOf("sleep") : 0); const activeRow = Math.floor(lastActive / 2) + 1; timerRowBottom.current = y + (height - (rows - 1) * 12) / rows * activeRow + (activeRow - 1) * 12; setShowSessionDock(scrollOffset.current > timerRowBottom.current); }} style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          {show("nursing") ? <ActionCard hint={t("refresh.nursingHint")} testID={openNursingSession ? "home-button-stop-nursing" : "home-button-start-nursing"} subLabel={openNursingSession ? elapsedClock(openNursingSession.startedAt, now) : undefined} icon="heart" label={t("refresh.feed")} actionLabel={openNursingSession ? t("design.finish") : t("refresh.start")} color={theme.colors.nursing} active={Boolean(openNursingSession)} onEdit={() => openNursingSession && router.push(`/entry/nursing/${openNursingSession.id}`)} onPress={openNursingSession ? handleStop : handleStart} /> : null}
          {show("pump") ? <ActionCard hint={t("refresh.pumpHint")} actionLabel={t("refresh.add")} testID="home-button-pump" icon="pump" label={t("refresh.pump")} color={theme.colors.pumping} onPress={handlePump} /> : null}
          {show("bottle") ? <ActionCard hint={t("refresh.bottleHint")} actionLabel={t("refresh.add")} testID="home-button-bottle" icon="bottle" label={t("home.bottle")} color={theme.colors.bottle} onPress={handleBottle} /> : null}
          {show("sleep") ? <ActionCard hint={t(`sleep.${openSleepSession ? sleepPeriod(openSleepSession) : defaultSleepPeriod(now)}`)} actionLabel={t(activeSleep ? "sleep.stop" : "refresh.start")} testID="home-button-sleep" icon={((openSleepSession ? sleepPeriod(openSleepSession) : defaultSleepPeriod(now)) === "nap") ? "sun" : "moon"} label={t("sleep.title")} color={(openSleepSession ? sleepPeriod(openSleepSession) : defaultSleepPeriod(now)) === "nap" ? theme.colors.nap : theme.colors.sleep} active={activeSleep} statusLabel={activeSleep ? t("sleep.sleeping") : undefined} onEdit={() => openSleepSession && router.push({ pathname: "/sleep", params: { id: openSleepSession.id } })} subLabel={openSleepSession ? elapsedClock(openSleepSession.startedAt, now) : undefined} onPress={handleSleep} /> : null}
          {show("solids") ? <ActionCard hint={t("solids.homeHint")} actionLabel={t("refresh.add")} testID="home-button-solids" icon="solids" label={t("solids.title")} color={theme.colors.nap} onPress={() => router.push("/modals/meal-entry")} /> : null}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, marginTop: 2, marginBottom: 18 }}>
          {show("nursing") && !openNursingSession ? <Pressable accessibilityRole="button" onPress={() => router.push(activeBaby ? "/modals/nursing-duration" : { pathname: "/profile/edit", params: { intent: "earlier" } })} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}><Icon name="history" size={15} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("design.earlierFeed")}</Text></Pressable> : null}
          {show("sleep") ? <Pressable accessibilityRole="button" onPress={() => router.push("/sleep")} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}><Icon name="moon" size={15} color={theme.colors.accent} /><Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t(activeSleep ? "sleep.adjust" : "sleepAI.open")}</Text><Icon name="arrow" size={14} color={theme.colors.accent} /></Pressable> : null}
        </View>
        <View style={{flexDirection:"row",gap:12,marginBottom:24}}>
          <Pressable testID="home-day" accessibilityRole="button" onPress={()=>router.push("/analytics")} style={[theme.shadows.card, { flex: 1, minWidth: 0, padding: 18, gap: 8, borderRadius: theme.radii.lg, backgroundColor: theme.colors.surface }]} ><Icon name="analytics" color={theme.colors.accent}/><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("day.homeTitle")}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.homeHint")}</Text><Icon name="arrow" size={18} color={theme.colors.accent}/></Pressable>
          <Pressable testID="home-moments" accessibilityRole="button" onPress={()=>router.push("/moments")} style={[theme.shadows.card, { flex: 1, minWidth: 0, padding: 18, gap: 8, borderRadius: theme.radii.lg, backgroundColor: theme.colors.surface }]} ><Icon name="sparkles" color={theme.colors.nursing}/><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("moments.title")}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("moments.homeHint")}</Text><Icon name="arrow" size={18} color={theme.colors.nursing}/></Pressable>
        </View>
        <RecentActivities now={now} activities={visible} />
        {visible.some(key=>key!=="solids") ? <RoutineOutlook now={now} compact /> : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("design.atGlance")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Icon name="clock" size={14} color={theme.colors.textMuted} /><Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{format(now, "EEE, d MMM", { locale })}</Text></View>
        </View>
        {showFeeds ? <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "latest" } })} icon={show("nursing") ? "heart" : "bottle"} label={t("statusStrip.lastFeed")} value={statusStrip.lastFeedAt ? formatDurationShort(minutesSince(statusStrip.lastFeedAt, now)) : t("design.noFeed")} color={theme.colors.nursing} />
          <Metric onPress={() => router.push({ pathname: "/details", params: { kind: "feeds" } })} icon="bottle" label={t("statusStrip.todayFeeds")} value={String(statusStrip.todayNursingCount + (show("bottle") ? bottleEvents.filter(event => isSameDay(new Date(event.occurredAt), now)).length : 0))} color={theme.colors.pumping} />
        </View> : null}
        {show("sleep") ? <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}><Metric onPress={() => router.push({ pathname: "/details", params: { kind: "sleep" } })} icon="moon" label={t("sleep.today")} value={formatDurationShort(Math.floor(sleepSecondsToday(sleepSessions, now) / 60))} color={theme.colors.sleep} /></View> : null}
        {show("solids") ? <View style={{flexDirection:"row",marginBottom:12}}><Metric icon="solids" label={t("solids.today")} value={String(solidMeals.filter(meal=>isSameDay(new Date(meal.occurredAt),now)).length)} color={theme.colors.nap} onPress={()=>router.push("/foods")}/></View> : null}
        {show("pump") ? <Pressable accessibilityRole="button" accessibilityLabel={t("statusStrip.currentStash")} onPress={() => router.push({ pathname: "/details", params: { kind: "stash" } })}><Card style={{ marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}><Icon name="pump" color={theme.colors.bottle} /></View>
          <View style={{ flex: 1 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("statusStrip.currentStash")}</Text><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{formatVolume(stashForecast.totalMl, unit)}</Text></View>
          <Icon name="bottle" color={theme.colors.bottle} size={20} />
        </Card></Pressable> : null}

        <WeeklySummary now={now} activities={selectedActivities} />


      </ScrollView>
    </AppShell>
  );
}

function ActionCard({ icon, label, hint, actionLabel, color, onPress, active = false, testID, subLabel, statusLabel, onEdit }: { icon: "heart" | "pump" | "bottle" | "moon" | "sun" | "solids"; label: string; hint: string; actionLabel: string; color: string; onPress: () => void; active?: boolean; testID: string; subLabel?: string; statusLabel?: string; onEdit?: () => void }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const timerSize = Math.max(14, Math.min(27, Math.floor(((Math.min(width, 580) - 60) / 2 - 36) / Math.max(subLabel?.length ?? 8, 8) * 1.6)));
  const ink = active ? theme.colors.accentContrast : theme.colors.textPrimary;
  const content = <>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <ActivityArtwork kind={icon} color={active ? theme.colors.accentContrast : color} size={48} />
      {active ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.accentContrast }} /> : null}
    </View>
    <View style={{ gap: 3 }}><Text style={[theme.type.bodyStrong, { color: ink }]}>{label}</Text>
      {active && subLabel ? <Text accessibilityLabel={`${statusLabel ?? label}: ${subLabel}`} accessibilityLiveRegion="none" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ color: ink, fontVariant: ["tabular-nums"], fontSize: timerSize, lineHeight: 34, fontWeight: "600", letterSpacing: -0.8 }}>{subLabel}</Text>
        : <Text style={[theme.type.caption, { color: theme.colors.textSecondary, minHeight: 34 }]}>{hint}</Text>}
    </View>
  </>;
  const action = <><Icon name={active ? "stop" : icon === "heart" || icon === "moon" ? "play" : "plus"} size={14} color={ink} /><Text style={[theme.type.caption, { color: ink, fontWeight: "600", fontSize: width < 360 ? 12 : 13 }]}>{actionLabel}</Text></>;
  const base = { flexBasis: "43%" as const, flexGrow: 1, minWidth: 0, padding: 18, gap: 10,
    borderRadius: 26, backgroundColor: active ? theme.colors.accent : color + (theme.mode === "light" ? "12" : "24") };
  const actionStyle = { alignSelf: "flex-start" as const, flexDirection: "row" as const, alignItems: "center" as const,
    gap: width < 360 ? 4 : 6, minHeight: 44, paddingHorizontal: width < 360 ? 8 : 12, borderRadius: 22, backgroundColor: active ? "#FFFFFF24" : theme.colors.surface };
  return active ? <View style={base}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} · ${t("timers.edit")}`} onPress={onEdit} style={{ gap: 10 }}>{content}</Pressable>
    <View style={{ flex: 1 }} />
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} · ${actionLabel}`} testID={testID} onPress={onPress} style={({ pressed }) => ({ ...actionStyle, opacity: pressed ? 0.65 : 1 })}>{action}</Pressable>
  </View> : <Pressable accessibilityRole="button" accessibilityLabel={`${label} · ${actionLabel}`} testID={testID} onPress={onPress} style={({ pressed }) => ({ ...base, opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
    {content}<View style={{ flex: 1 }} /><View style={actionStyle}>{action}</View>
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

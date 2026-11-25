import { ListRow } from "@/components/ListRow";
import { SelectField } from "@/components/SelectField";
import { Field } from "@/components/Field";
import { DateField } from "@/components/DateField";
import React from "react";
import { Platform, ScrollView, Switch, Text, View } from "react-native";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { useActiveBaby } from "@/store/useBabyStore";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { Button, Card } from "@/components";
import { useSettingsStore, ThemePreference, SupportedLanguage } from "@/store/useSettingsStore";
import { useEntitlementStore } from "@/store/useEntitlementStore";
import { VolumeUnit } from "@/domain/units";

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: "system", labelKey: "settings.themeSystem" },
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "night", labelKey: "settings.themeNight" },
];

const UNIT_OPTIONS: { value: VolumeUnit; labelKey: string }[] = [
  { value: "ml", labelKey: "settings.unitsMl" },
  { value: "oz", labelKey: "settings.unitsOz" },
];

const LANGUAGE_OPTIONS: { value: SupportedLanguage | "system"; label: string }[] = [
  { value: "system", label: "settings.languageSystem" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const baby = useActiveBaby();
  const theme = useTheme();
  const { t } = useTranslation();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const unit = useSettingsStore((s) => s.unit);
  const setUnit = useSettingsStore((s) => s.setUnit);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const returnToWorkDate = useSettingsStore((s) => s.returnToWorkDate);
  const setReturnToWorkDate = useSettingsStore((s) => s.setReturnToWorkDate);
  const targetStashMl = useSettingsStore((s) => s.targetStashMl);
  const setTargetStashMl = useSettingsStore((s) => s.setTargetStashMl);
  const isUnlocked = useEntitlementStore((s) => s.isUnlocked);
  const restore = useEntitlementStore((s) => s.restore);

  const timers = useSettingsStore(s => s.timerReminders);
  const live = useSettingsStore(s => s.liveActivities);
  const setTimers = useSettingsStore(s => s.setTimerReminders);
  const setLive = useSettingsStore(s => s.setLiveActivities);
  const [requesting, setRequesting] = React.useState(false);
  const enableReminders = async (enabled: boolean) => {
    if (!enabled) { setTimers(false); return; }
    setRequesting(true);
    try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- Load native modules lazily so older binaries can still log.
      const n = require("expo-notifications") as typeof import("expo-notifications");
      if (Platform.OS === "android") await n.setNotificationChannelAsync("default", { name: t("timers.title"), importance: n.AndroidImportance.DEFAULT });
      const permission = await n.requestPermissionsAsync();
      setTimers(permission.granted);
      if (!permission.granted) useFeedbackStore.getState().show(t("timers.permission"));
    } catch { useFeedbackStore.getState().show(t("timers.unavailable")); }
    finally { setRequesting(false); }
  };

  return (
    <AppShell>
      <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 24, paddingBottom: 32, gap: theme.spacing.md }}>
        <PageHeader title={t("settings.title")} subtitle={t("refresh.settingsSubtitle")} />
        <Card style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}><Icon name="baby" color={theme.colors.accent} /></View>
          <View style={{ flex: 1, minWidth: 100, gap: 4 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("profile.title")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{baby?.name ?? t("profile.addBaby")}</Text></View>
          <Button label={t("common.edit")} onPress={() => router.push("/profile")} style={{ minHeight: 44, paddingHorizontal: 16 }} />
        </Card>
        <Card padded={false} style={{ paddingHorizontal: 16 }}><ListRow testID="settings-personalize-home" title={t("homeSetup.title")} subtitle={t("homeSetup.settingsHint")} leading={<Icon name="home" color={theme.colors.accent} />} onPress={() => router.push("/settings/home")} /></Card>
        <Section title={t("settings.language")}>
          <SelectField label={t("settings.language")} testID="settings-language" value={language} options={LANGUAGE_OPTIONS.map(o => ({ value: o.value, label: o.value === "system" ? t(o.label) : o.label }))} onChange={setLanguage} />
        </Section>
        <Section title={t("settings.units")}>
          <SelectField label={t("settings.units")} value={unit} options={UNIT_OPTIONS.map(o => ({ value: o.value, label: o.value }))} onChange={setUnit} />
        </Section>
        <Section title={t("settings.appearance")}>
          <SelectField label={t("settings.appearance")} value={themePreference} options={THEME_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))} onChange={setThemePreference} />
        </Section>

        <Section title={t("timers.title")}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("timers.explanation")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary, flex: 1 }]}>{t("timers.reminders")}</Text>
            <Switch accessibilityLabel={t("timers.reminders")} value={timers} disabled={Platform.OS === "web" || requesting} onValueChange={v => void enableReminders(v)} trackColor={{ true: theme.colors.accent }} />
          </View>
          {Platform.OS === "ios" && parseFloat(String(Platform.Version)) >= 16.2 ? <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
              <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary, flex: 1 }]}>{t("timers.live")}</Text>
              <Switch accessibilityLabel={t("timers.live")} value={live} onValueChange={setLive} trackColor={{ true: theme.colors.accent }} />
            </View>
            <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("timers.liveNote")}</Text>
          </> : <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("timers.nativeOnly")}</Text>}
        </Section>

        <Section title={t("settings.returnToWork")}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{t("settings.returnToWorkNote")}</Text>
          <DateField label={t("datePicker.date")} value={returnToWorkDate ?? ""} onChange={value => setReturnToWorkDate(value || null)} onClear={() => setReturnToWorkDate(null)} />
          <Field label={t("settings.targetStash", { unit })} value={targetStashMl != null ? String(targetStashMl) : ""} onChangeText={text => { const value = Number(text); setTargetStashMl(text.trim() && !Number.isNaN(value) ? value : null); }} keyboardType="number-pad" placeholder="0" amount />
        </Section>

        <Section title={t("settings.queenUnlock")}>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
            {isUnlocked ? t("settings.queenUnlockOwned") : t("recommendations.unlockPrompt")}
          </Text>
          {!isUnlocked ? <Button label={t("settings.restorePurchases")} tone="neutral" variant="outline" onPress={() => void restore()} /> : null}
        </Section>

        <Section title={t("settings.about")}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t("settings.version", { version: Constants.expoConfig?.version ?? "1.0.0" })}
          </Text>
        </Section>
      </ScrollView>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      {children}
    </Card>
  );
}

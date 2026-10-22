import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/navigation/AppShell";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Forecasts } from "@/components/Forecasts";
import { Card } from "@/components";
import { useTheme } from "@/theme/ThemeProvider";
import { useLogStore, computeStatusStrip } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatVolume } from "@/domain/units";
export default function AnalyticsScreen() {
  const theme = useTheme(); const { t } = useTranslation(); const [now, setNow] = useState(new Date());
  const { nursingSessions, pumpEvents, bottleEvents } = useLogStore(); const unit = useSettingsStore(s => s.unit);
  const status = computeStatusStrip(nursingSessions, pumpEvents, bottleEvents, now);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return <AppShell><ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}><Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("analytics.title")}</Text><Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("analytics.subtitle")}</Text><WeeklySummary now={now} />
    <Card><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("analytics.pumpTotal")}</Text><Text style={[theme.type.title, { color: theme.colors.pumping }]}>{formatVolume(status.todayPumpMl, unit)}</Text></Card>
    <Card><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("analytics.bottleTotal")}</Text><Text style={[theme.type.title, { color: theme.colors.bottle }]}>{formatVolume(status.todayBottleMl, unit)}</Text></Card>
    <Forecasts now={now} />
  </ScrollView></AppShell>;
}

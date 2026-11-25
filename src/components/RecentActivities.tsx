import { useFoodStore } from "@/store/useFoodStore";
import { HomeActivity, HOME_ACTIVITIES } from "@/domain/homePreferences";
import { sleepPeriod } from "@/domain/sleep";
import { ListRow } from "./ListRow";
import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import { useLayoutDirection } from "@/i18n/useLayoutDirection";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { useTheme } from "@/theme/ThemeProvider";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { Icon, IconName } from "./Icon";

export function RecentActivities({ now, activities = [...HOME_ACTIVITIES] }: { now: Date; activities?: HomeActivity[] }) {
  const formatDurationShort = useDurationFormatter();
  const { isRTL } = useLayoutDirection();
  const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
  const { nursingSessions, pumpEvents, bottleEvents } = useLogStore(); const sessions = useSleepStore(s => s.sessions);
  const nursing = nursingSessions[0]; const pump = pumpEvents[0]; const bottle = bottleEvents[0]; const sleep = sessions[0];
  const meal = useFoodStore(s => s.meals)[0];
  const rows = [
    { key: "solids", icon: "solids" as IconName, entry: meal, at: meal?.occurredAt, active: false, color: theme.colors.nap },
    { key: "nursing", icon: "heart" as IconName, entry: nursing, at: nursing?.startedAt, active: nursing && !nursing.endedAt, color: theme.colors.nursing },
    { key: "pump", icon: "pump" as IconName, entry: pump, at: pump?.startedAt, active: false, color: theme.colors.pumping },
    { key: "bottle", icon: "bottle" as IconName, entry: bottle, at: bottle?.occurredAt, active: false, color: theme.colors.bottle },
    { key: "sleep", icon: (sleep && sleepPeriod(sleep) === "nap" ? "nap" : "moon") as IconName, entry: sleep, at: sleep?.endedAt ?? sleep?.startedAt, active: sleep && !sleep.endedAt, color: sleep && sleepPeriod(sleep) === "nap" ? theme.colors.nap : theme.colors.sleep },
  ];
  return <View style={{ gap: 14, marginBottom: 28 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary, flexShrink: 1 }]}>{t("recent.title")}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("nav.history")} onPress={() => router.push("/history")} style={{ minHeight: 44, justifyContent: "center" }}><Icon name="arrow" size={20} color={theme.colors.accent} /></Pressable>
    </View>
    <Card padded={false} style={{ paddingHorizontal: 16 }}>
      {rows.filter(row => activities.includes(row.key as HomeActivity)).map((row, index) => <ListRow key={row.key} divider={index > 0}
        title={row.key === "sleep" && sleep ? t(`sleep.${sleepPeriod(sleep)}`) : t(`refresh.${row.key === "nursing" ? "feed" : row.key}`)}
        leading={<IconBadge name={row.icon} color={row.color} size="small" />}
        trailing={<Text style={[theme.type.caption, { maxWidth: "48%", textAlign: isRTL ? "left" : "right", color: row.active ? theme.colors.accent : theme.colors.textSecondary }]}>{row.active ? t("forecast.active") : row.at ? t("recent.ago", { time: formatDurationShort(Math.floor(Math.max(0, now.getTime() - new Date(row.at).getTime()) / 60000)) }) : t("refresh.noData")}</Text>}
        onPress={() => {
          if (!row.entry) { router.push(row.key === "sleep" ? "/sleep" : "/history"); return; }
          if (row.key === "solids") router.push({pathname:"/modals/meal-entry",params:{id:row.entry.id}});
          else if (row.key === "sleep") router.push({ pathname: "/sleep", params: { id: row.entry.id } });
          else router.push(`/entry/${row.key}/${row.entry.id}`);
        }} />)}
    </Card>
  </View>;
}

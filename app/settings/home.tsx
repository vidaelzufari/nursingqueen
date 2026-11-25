import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Screen } from "@/components/Screen";
import { ScreenBack } from "@/components/ScreenBack";
import { Card, Button } from "@/components";
import { ListRow } from "@/components/ListRow";
import { IconBadge } from "@/components/IconBadge";
import { IconName } from "@/components/Icon";
import { HOME_ACTIVITIES, HomeActivity, normalizeHomeActivities, toggleHomeActivity } from "@/domain/homePreferences";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useTheme } from "@/theme/ThemeProvider";
const icons: Record<HomeActivity, IconName> = { nursing: "heart", pump: "pump", bottle: "bottle", sleep: "moon", solids: "solids" };
export default function PersonalizeHome() {
  const theme = useTheme(); const { t } = useTranslation();
  const stored = useSettingsStore(s => s.homeActivities);
  const setActivities = useSettingsStore(s => s.setHomeActivities);
  const selected = normalizeHomeActivities(stored);
  const colors = { nursing: theme.colors.nursing, pump: theme.colors.pumping, bottle: theme.colors.bottle, sleep: theme.colors.sleep, solids: theme.colors.nap };
  const toggle = (key: HomeActivity) => {
    if (selected.length === 1 && selected.includes(key)) { useFeedbackStore.getState().show(t("homeSetup.minimum")); return; }
    setActivities(toggleHomeActivity(selected, key));
  };
  return <Screen>
    <ScreenBack />
    <Text accessibilityRole="header" style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("homeSetup.title")}</Text>
    <View style={{ gap: 8 }}><Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("homeSetup.intro")}</Text><Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("homeSetup.body")}</Text></View>
    <Card padded={false} style={{ paddingHorizontal: 16 }}>{HOME_ACTIVITIES.map((key,index) => <ListRow key={key} testID={`home-select-${key}`} title={t(`homeSetup.${key}`)} subtitle={t(`homeSetup.${key}Hint`)} selected={selected.includes(key)} divider={index > 0} leading={<IconBadge name={icons[key]} color={colors[key]} size="small" />} onPress={() => toggle(key)} />)}</Card>
    <Text style={[theme.type.caption, { color: theme.colors.accent }]}>{t("homeSetup.saved")}</Text>
    <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("homeSetup.history")}</Text>
    <Button label={t("homeSetup.all")} tone="neutral" variant="outline" onPress={() => setActivities([...HOME_ACTIVITIES])} />
  </Screen>;
}

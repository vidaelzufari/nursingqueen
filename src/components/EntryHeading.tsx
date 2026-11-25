import { useTranslation } from "react-i18next";
import { dateLocale } from "@/domain/dateLocale";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { format } from "date-fns";
import { useTheme } from "@/theme/ThemeProvider";
import { ActivityArtwork } from "./ActivityArtwork";
import { Icon, IconName } from "./Icon";

export function EntryHeading({ title, icon, color, at }: { title: string; icon: IconName; color: string; at?: string }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language);
  const [openedAt] = useState(() => new Date());
  const date = at ? new Date(at) : openedAt;
  return <View style={{ alignItems: "center", gap: 12, paddingBottom: 16 }}>
    {icon === "heart" || icon === "pump" || icon === "bottle" || icon === "moon" ? <ActivityArtwork kind={icon} color={color} size={64} /> : <Icon name={icon} color={color} size={32} />}
    <Text style={[theme.type.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>{title}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 8, paddingVertical: 4 }}><Icon name="clock" size={15} color={theme.colors.textSecondary} /><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{format(date, "EEE, d MMM · HH:mm", { locale })}</Text></View>
  </View>;
}

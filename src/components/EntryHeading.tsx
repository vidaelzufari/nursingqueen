import React, { useState } from "react";
import { Text, View } from "react-native";
import { format } from "date-fns";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon, IconName } from "./Icon";

export function EntryHeading({ title, icon, color, at }: { title: string; icon: IconName; color: string; at?: string }) {
  const theme = useTheme();
  const [openedAt] = useState(() => new Date());
  const date = at ? new Date(at) : openedAt;
  return <View style={{ alignItems: "center", gap: 10, paddingBottom: 12 }}>
    <View style={{ width: 76, height: 76, borderRadius: theme.radii.lg, backgroundColor: color + "16", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "25" }}><Icon name={icon} size={34} color={color} /></View>
    <Text style={[theme.type.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>{title}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm }}><Icon name="clock" size={15} color={theme.colors.textSecondary} /><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{format(date, "EEE, d MMM · HH:mm")}</Text></View>
  </View>;
}

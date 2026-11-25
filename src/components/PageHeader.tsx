import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

/** Primary destinations use the tab bar; back controls belong to deeper screens. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <Text accessibilityRole="header" style={[theme.type.display, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
    {action}
  </View>;
}

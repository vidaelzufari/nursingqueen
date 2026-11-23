import React from "react";
import { I18nManager, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "./Icon";

/** Main-tab headings return to Home without consuming safe-area padding twice. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={t("nav.home")} onPress={() => router.replace("/")} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: pressed ? theme.colors.surfaceRaised : theme.colors.surface, alignItems: "center", justifyContent: "center" })}>
      <View style={{ transform: [{ rotate: I18nManager.isRTL ? "180deg" : "0deg" }] }}><Icon name="chevron" color={theme.colors.textPrimary} size={21} /></View>
    </Pressable>
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}><Text accessibilityRole="header" style={[theme.type.title, { color: theme.colors.textPrimary }]}>{title}</Text>{subtitle ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}</View>
    {action}
  </View>;
}

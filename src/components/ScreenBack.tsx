import { goBackOrHome } from "@/navigation/back";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./Icon";

export function ScreenBack() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  return <Pressable accessibilityRole="button" accessibilityLabel={t("navigation.back")} onPress={() => goBackOrHome(router)} style={{ minHeight: 48, marginTop: insets.top, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingEnd: 16, marginBottom: 8 }}><View style={{ transform: [{ rotate: "180deg" }] }}><Icon name="arrow" size={22} color={theme.colors.accent} /></View><Text style={[theme.type.bodyStrong, { color: theme.colors.accent }]}>{t("navigation.back")}</Text></Pressable>;
}

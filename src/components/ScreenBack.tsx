import { goBackOrHome } from "@/navigation/back";
import React from "react";
import { I18nManager, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./Icon";

/** Quiet navigation chrome shared by full screens and dismissible entry flows. */
export function ScreenBack({ dismiss = false }: { dismiss?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: insets.top, minHeight: 48, flexDirection: "row", justifyContent: dismiss ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(dismiss ? "common.cancel" : "navigation.back")}
        onPress={() => goBackOrHome(router)}
        style={({ pressed }) => ({
          width: 48, height: 48, borderRadius: 24,
          alignItems: "center", justifyContent: "center",
          backgroundColor: pressed ? theme.colors.border : theme.colors.surface,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <View style={{ transform: [{ rotate: !dismiss && I18nManager.isRTL ? "180deg" : "0deg" }] }}>
          <Icon name={dismiss ? "close" : "chevron"} size={22} color={theme.colors.textPrimary} />
        </View>
      </Pressable>
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/components/Icon";

interface NavItem {
  key: "home" | "history" | "analytics" | "settings";
  route: "/" | "/history" | "/analytics" | "/settings";
  labelKey: string;
  testID: string;
}

const ITEMS: NavItem[] = [
  { key: "home", route: "/", labelKey: "nav.home", testID: "nav-home" },
  { key: "history", route: "/history", labelKey: "nav.history", testID: "nav-history" },
  { key: "analytics", route: "/analytics", labelKey: "nav.analytics", testID: "nav-analytics" },
  { key: "settings", route: "/settings", labelKey: "nav.settings", testID: "nav-settings" },
];

/** Shared bottom navigation used by every top-level screen (Home/History/Settings). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, minHeight: 0, overflow: "hidden", width: "100%", maxWidth: 580, alignSelf: "center" }}>{children}</View>
      <View
        style={{
          flexDirection: "row",
          height: 76,
          flexShrink: 0,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 36,
          marginHorizontal: 20,
          marginBottom: Math.max(insets.bottom, 12),
          width: "92%",
          maxWidth: 540,
          alignSelf: "center",
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingBottom: 6,
          paddingTop: 6,
        }}
      >
        {ITEMS.map((item) => {
          const active = pathname === item.route;
          return (
            <Pressable
              key={item.key}
              testID={item.testID}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.route)}
              style={{ flexGrow: 1, flexBasis: 0, height: 62, alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing.xs }}
            >
              <View style={{ width: 52, height: 30, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: active ? theme.colors.surfaceRaised : "transparent" }}>
                <Icon name={item.key} size={21} color={active ? theme.colors.accent : theme.colors.textMuted} />
              </View>
              <Text
                style={[
                  theme.type.caption,
                  { color: active ? theme.colors.accent : theme.colors.textMuted, marginTop: 2 },
                ]}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

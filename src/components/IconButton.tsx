import React from "react";
import { Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon, IconName } from "./Icon";

/** One treatment for navigation and utility controls; label is always required. */
export function IconButton({ name, label, onPress, directional = false }: {
  name: IconName; label: string; onPress: () => void; directional?: boolean;
}) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24,
      alignItems: "center", justifyContent: "center", borderWidth: 0,
      borderColor: theme.colors.border, backgroundColor: pressed ? theme.colors.surfaceRaised : theme.colors.surfaceRaised,
      opacity: pressed ? 0.75 : 1 })}>
    <Icon name={name} size={22} color={theme.colors.textPrimary} directional={directional} />
  </Pressable>;
}

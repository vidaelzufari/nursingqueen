import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { IconBadge } from "./IconBadge";
import { IconName } from "./Icon";
import { Button } from "./Button";

export function EmptyState({ icon, title, message, actionLabel, onAction }: { icon: IconName; title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return <View style={{ alignItems: "center", gap: 12, paddingVertical: 28, paddingHorizontal: 16 }}>
    <IconBadge name={icon} color={theme.colors.accent} size="large" />
    <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary, textAlign: "center" }]}>{title}</Text>
    {message ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary, textAlign: "center" }]}>{message}</Text> : null}
    {onAction && actionLabel ? <Button label={actionLabel} variant="soft" onPress={onAction} /> : null}
  </View>;
}

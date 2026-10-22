import React from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

/** Local wall-clock input; conversion to UTC happens only when saving. */
export function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const theme = useTheme();
  return <View style={{ gap: 8 }}><Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{label}</Text>
    {Platform.OS === "web" ? React.createElement("input", {
      type: "datetime-local", "aria-label": label, value: value.replace(" ", "T"),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value.replace("T", " ")),
      style: { boxSizing: "border-box", width: "100%", minHeight: 56, borderRadius: 20, padding: 14, fontSize: 17, fontFamily: "inherit", border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, colorScheme: theme.mode === "light" ? "light" : "dark" },
    }) : <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={theme.colors.textMuted} autoCapitalize="none" style={{ minHeight: 56, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, fontSize: 17 }} />}
  </View>;
}

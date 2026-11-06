import React from "react";
import { Text, View } from "react-native";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
export function BirthDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const theme = useTheme(); const { t } = useTranslation();
  return <View style={{ gap: 8 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.dateOfBirth")}</Text>{React.createElement("input", { type: "date", "aria-label": t("profile.dateOfBirth"), value, max: format(new Date(), "yyyy-MM-dd"), onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value), style: { boxSizing: "border-box", width: "100%", minHeight: 60, padding: 16, borderRadius: 20, border: `1px solid ${theme.colors.border}`, fontSize: 17, backgroundColor: theme.colors.surfaceRaised, color: theme.colors.textPrimary, colorScheme: theme.mode === "light" ? "light" : "dark" } })}</View>;
}

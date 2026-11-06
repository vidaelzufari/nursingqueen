import React from "react";
import { Text, View } from "react-native";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "./Button";
import type { DateFieldProps } from "./DateField.types";

export function DateField({ label, value, onChange, maximumDate, withTime, onClear }: DateFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return <View style={{ gap: 8 }}>
    <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{label}</Text>
    {React.createElement("input", {
      type: withTime ? "datetime-local" : "date", "aria-label": label, value: value.replace(" ", "T"),
      max: maximumDate ? format(maximumDate, withTime ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd") : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value.replace("T", " ")),
      style: { boxSizing: "border-box", width: "100%", minHeight: 56, borderRadius: theme.radii.md, padding: 12, fontSize: 17, fontFamily: "inherit", border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surfaceRaised, color: theme.colors.textPrimary, colorScheme: theme.mode === "light" ? "light" : "dark" },
    })}
    {onClear && value ? <Button label={t("datePicker.clear")} variant="ghost" onPress={onClear} /> : null}
  </View>;
}

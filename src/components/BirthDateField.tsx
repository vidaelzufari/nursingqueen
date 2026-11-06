import React, { useState } from "react";
import { Keyboard, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { parseBirthDate } from "@/domain/birthDate";
import { Icon } from "./Icon";
import { Button } from "./Button";
export function BirthDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const theme = useTheme(); const { t } = useTranslation(); const [open, setOpen] = useState(false);
  const date = parseBirthDate(value);
  return <View style={{ gap: 8 }}>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.dateOfBirth")}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={t("profile.dateOfBirth")} onPress={() => { Keyboard.dismiss(); setOpen(!open); }} style={{ minHeight: 60, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.surfaceRaised }}><Icon name="clock" color={theme.colors.accent} /><Text style={[theme.type.body, { color: theme.colors.textPrimary }]}>{date ? format(date, "d MMM yyyy") : t("setup.chooseDate")}</Text></Pressable>
    {open ? <View>
      <DateTimePicker value={date ?? new Date()} maximumDate={new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant={theme.mode === "light" ? "light" : "dark"} onChange={(event, selected) => { if (Platform.OS !== "ios") setOpen(false); if (event.type !== "dismissed" && selected) onChange(format(selected, "yyyy-MM-dd")); }} />
      {Platform.OS === "ios" ? <Button label={t("setup.done")} tone="neutral" onPress={() => { if (!date) onChange(format(new Date(), "yyyy-MM-dd")); setOpen(false); }} /> : null}
    </View> : null}
  </View>;
}

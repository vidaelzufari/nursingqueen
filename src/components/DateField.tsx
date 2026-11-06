import React, { useState } from "react";
import { Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { format, isValid, parse } from "date-fns";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "./Button";
import { Icon } from "./Icon";
import type { DateFieldProps } from "./DateField.types";

export function DateField({ label, value, onChange, maximumDate, withTime, onClear }: DateFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pattern = withTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd";
  const parsed = parse(value, pattern, new Date());
  const current = isValid(parsed) ? parsed : null;
  const [draft, setDraft] = useState<Date | null>(null);
  const [mode, setMode] = useState<"date" | "time">("date");
  function open(next: "date" | "time") {
    Keyboard.dismiss();
    const date = current ?? new Date();
    const initial = maximumDate && date > maximumDate ? maximumDate : date;
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial, mode: next, maximumDate: next === "date" ? maximumDate : undefined,
        onChange: (event, selected) => {
          if (event.type !== "set" || !selected) return;
          const result = next === "date"
            ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), initial.getHours(), initial.getMinutes())
            : new Date(initial.getFullYear(), initial.getMonth(), initial.getDate(), selected.getHours(), selected.getMinutes());
          onChange(format(result, pattern));
        },
      });
      return;
    }
    setMode(next);
    setDraft(initial);
  }
  return <View style={{ gap: 8 }}>
    <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{label}</Text>
    <View style={{ flexDirection: "row", gap: 8 }}>
      {(withTime ? ["date", "time"] as const : ["date"] as const).map(part => (
        <Pressable key={part} accessibilityRole="button" accessibilityLabel={`${label} · ${t(`datePicker.${part}`)}`} onPress={() => open(part)}
          style={({ pressed }) => ({ flex: 1, minHeight: 56, borderRadius: theme.radii.md, padding: 12, gap: 8, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surfaceRaised, opacity: pressed ? 0.7 : 1 })}>
          <Icon name={part === "date" ? "calendar" : "clock"} size={18} color={theme.colors.accent} />
          <Text style={[theme.type.caption, { color: theme.colors.textPrimary, flexShrink: 1 }]}>{current ? current.toLocaleString(undefined, part === "date" ? { day: "numeric", month: "short", year: "numeric" } : { hour: "numeric", minute: "2-digit" }) : t("datePicker.choose")}</Text>
        </Pressable>
      ))}
    </View>
    {onClear && value ? <Button label={t("datePicker.clear")} variant="ghost" onPress={onClear} /> : null}
    {draft && Platform.OS === "ios" ? <Modal transparent animationType="slide" visible onRequestClose={() => setDraft(null)}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.colors.overlay }}>
        <View accessibilityViewIsModal style={{ backgroundColor: theme.colors.surface, padding: 20, paddingBottom: Math.max(insets.bottom, 20), borderTopStartRadius: theme.radii.xl, borderTopEndRadius: theme.radii.xl, gap: 12 }}>
          <Text accessibilityRole="header" style={[theme.type.title, { color: theme.colors.textPrimary }]}>{label}</Text>
          <DateTimePicker value={draft} mode={mode} display="spinner" maximumDate={mode === "date" ? maximumDate : undefined}
            themeVariant={theme.mode === "light" ? "light" : "dark"} onChange={(_, selected) => { if (selected) setDraft(selected); }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label={t("common.cancel")} variant="outline" style={{ flex: 1 }} onPress={() => setDraft(null)} />
            <Button label={t("setup.done")} style={{ flex: 1 }} onPress={() => { onChange(format(draft, pattern)); setDraft(null); }} />
          </View>
        </View>
      </View>
    </Modal> : null}
  </View>;
}

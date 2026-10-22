import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { VolumeUnit, displayToMl, formatVolume, parseAmount } from "@/domain/units";
import { Button } from "./Button";
import { Icon } from "./Icon";

/** Presets commit only on a deliberate tap. Custom entry is always explicit. */
export function QuickAmount({ unit, color, lastMl, onSave, disabled = false }: { unit: VolumeUnit; color: string; lastMl?: number | null; onSave: (ml: number) => void; disabled?: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState("");
  const parsed = parseAmount(text, unit);
  const presets = unit === "ml" ? [30, 60, 90, 120, 150, 180] : [1, 2, 3, 4, 5, 6];
  return <View style={{ gap: 16 }}>
    {lastMl != null && lastMl > 0 ? <Button disabled={disabled} label={t("quick.repeat", { amount: formatVolume(lastMl, unit) })} icon={<Icon name="history" size={18} color={theme.colors.accentContrast} />} onPress={() => onSave(lastMl)} /> : null}
    <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("quick.tapToSave")}</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {presets.map(amount => <Pressable key={amount} disabled={disabled} accessibilityRole="button" accessibilityLabel={t("quick.saveAmount", { amount: `${amount} ${unit}` })} accessibilityState={{ disabled }} onPress={() => onSave(displayToMl(amount, unit))} style={({ pressed }) => ({ width: "31%", flexGrow: 1, minHeight: 76, borderRadius: 38, backgroundColor: pressed ? color + "25" : theme.colors.surface, borderWidth: 1, borderColor: color + "40", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.5 : 1 })}>
        <Text style={[theme.type.title, { color }]}>{amount}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{unit}</Text>
      </Pressable>)}
    </View>
    <Button label={t("quick.custom")} tone="neutral" variant="ghost" onPress={() => setCustom(!custom)} />
    {custom ? <View style={{ gap: 12 }}>
      <TextInput accessibilityLabel={t("quick.customAmount", { unit })} value={text} onChangeText={setText} keyboardType="decimal-pad" placeholder={`0 ${unit}`} placeholderTextColor={theme.colors.textMuted} style={{ minHeight: 64, borderRadius: 24, padding: 16, fontSize: 28, textAlign: "center", color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }} />
      <Button disabled={disabled || parsed === null} label={t("common.save")} icon={<Icon name="check" size={18} color={theme.colors.accentContrast} />} onPress={() => { if (parsed !== null) onSave(parsed); }} />
    </View> : null}
  </View>;
}

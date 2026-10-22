import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/components/Icon";
import { Button } from "@/components";
import { QuickAmount } from "@/components/QuickAmount";
import { parseAmount } from "@/domain/units";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function PumpDetailsModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const unit = useSettingsStore(s => s.unit);
  const events = useLogStore(s => s.pumpEvents);
  const addDetail = useLogStore(s => s.addPumpDetail);
  const addTotal = useLogStore(s => s.addPumpTotal);
  const event = id ? events.find(item => item.id === id) : events[0];
  const last = events.find(item => item.id !== event?.id && item.totalMl != null && item.totalMl > 0);
  const [split, setSplit] = useState(false);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const committed = useRef(false);
  const leftMl = left.trim() ? parseAmount(left, unit) : 0;
  const rightMl = right.trim() ? parseAmount(right, unit) : 0;
  const validSplit = leftMl !== null && rightMl !== null && leftMl + rightMl > 0;
  const save = (total?: number) => {
    if (!event || committed.current) return;
    committed.current = true;
    try {
      if (total !== undefined) addTotal(event.id, total);
      else if (validSplit) addDetail(event.id, leftMl || null, rightMl || null);
      goBackOrHome(router);
    } catch (error) { committed.current = false; throw error; }
  };
  return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 24, paddingTop: 36, paddingBottom: 40, gap: 20, width: "100%", maxWidth: 580, alignSelf: "center" }} keyboardShouldPersistTaps="handled">
      <ScreenBack />
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}><Icon name="pump" size={30} color={theme.colors.pumping} /></View><View style={{ flex: 1 }}><Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("quick.pumpTitle")}</Text><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(event ? "quick.pumpSaved" : "quick.tapToSave")}</Text></View></View>
    {!split ? <QuickAmount unit={unit} color={theme.colors.pumping} lastMl={last?.totalMl} onSave={save} disabled={!event} /> : <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>{(["left", "right"] as const).map(side => <View key={side} style={{ flex: 1, gap: 8 }}><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t(side === "left" ? "pumpDetail.leftMl" : "pumpDetail.rightMl", { unit })}</Text><TextInput accessibilityLabel={t(side === "left" ? "pumpDetail.leftMl" : "pumpDetail.rightMl", { unit })} testID={`pump-detail-${side}-input`} value={side === "left" ? left : right} onChangeText={side === "left" ? setLeft : setRight} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={theme.colors.textMuted} style={{ minHeight: 64, borderRadius: 24, padding: 16, fontSize: 26, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }} /></View>)}</View>
      <Button testID="pump-detail-save" disabled={!validSplit || !event} label={t("pumpDetail.save")} tone="pumping" onPress={() => save()} />
    </View>}
    <Button label={t(split ? "quick.totalOnly" : "quick.bySide")} tone="neutral" variant="ghost" onPress={() => setSplit(!split)} />
    <Button testID="pump-detail-dismiss" label={t("quick.doneLater")} tone="neutral" variant="ghost" onPress={() => goBackOrHome(router)} />
  </ScrollView>;
}

import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { EntryHeading } from "@/components/EntryHeading";
import { Button } from "@/components";
import { QuickAmount } from "@/components/QuickAmount";
import { mlToDisplay, parseAmount } from "@/domain/units";
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
  const [split, setSplit] = useState(event?.leftMl != null || event?.rightMl != null);
  const [left, setLeft] = useState(event?.leftMl != null ? String(mlToDisplay(event.leftMl, unit)) : "");
  const [right, setRight] = useState(event?.rightMl != null ? String(mlToDisplay(event.rightMl, unit)) : "");
  const committed = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const leftMl = event?.leftMl != null && left.trim() === String(mlToDisplay(event.leftMl, unit)) ? event.leftMl : left.trim() ? parseAmount(left, unit, true) : null;
  const rightMl = event?.rightMl != null && right.trim() === String(mlToDisplay(event.rightMl, unit)) ? event.rightMl : right.trim() ? parseAmount(right, unit, true) : null;
  const validSplit = (!left.trim() || leftMl !== null) && (!right.trim() || rightMl !== null) && (leftMl ?? 0) + (rightMl ?? 0) > 0 && (leftMl ?? 0) + (rightMl ?? 0) <= Number.MAX_SAFE_INTEGER;
  const save = (total?: number) => {
    if (!event || committed.current || (total === undefined && !validSplit)) return;
    setSaveError(false);
    committed.current = true;
    try {
      if (total !== undefined) addTotal(event.id, total);
      else if (validSplit) addDetail(event.id, leftMl, rightMl);
      goBackOrHome(router);
    } catch { committed.current = false; setSaveError(true); }
  };
  return <Screen>
      <ScreenBack dismiss />
    <EntryHeading title={t("quick.pumpTitle")} icon="pump" color={theme.colors.pumping} at={event?.startedAt} />
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary, textAlign: "center" }]}>{t(event ? "quick.pumpSaved" : "quick.tapToSave")}</Text>
    {!split ? <QuickAmount unit={unit} color={theme.colors.pumping} lastMl={last?.totalMl} onSave={save} disabled={!event} /> : <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>{(["left", "right"] as const).map(side => <View key={side} style={{ flex: 1 }}><Field label={t(side === "left" ? "pumpDetail.leftMl" : "pumpDetail.rightMl", { unit })} amount testID={`pump-detail-${side}-input`} value={side === "left" ? left : right} onChangeText={side === "left" ? setLeft : setRight} keyboardType="decimal-pad" placeholder="0" /></View>)}</View>
      <Button testID="pump-detail-save" disabled={!validSplit || !event} label={t("pumpDetail.save")} tone="pumping" onPress={() => save()} />
    </View>}
    {saveError ? <Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t("entryQA.saveError")}</Text> : null}
    <Button label={t(split ? "quick.totalOnly" : "quick.bySide")} tone="neutral" variant="ghost" onPress={() => setSplit(!split)} />
    <Button testID="pump-detail-dismiss" label={t("quick.doneLater")} tone="neutral" variant="ghost" onPress={() => goBackOrHome(router)} />
  </Screen>;
}

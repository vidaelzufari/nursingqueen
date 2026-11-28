import { SelectField } from "@/components/SelectField";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { mlToDisplay, parseAmount } from "@/domain/units";
import { format, parse, isValid } from "date-fns";
import { DateTimeField } from "@/components/DateTimeField";
import { MilkType, NursingSide } from "@/db/types";

const SIDES: NursingSide[] = ["left", "right", "both", "unknown"];

export default function EditEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const unit = useSettingsStore((s) => s.unit);

  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);
  const updateNursing = useLogStore((s) => s.updateNursing);
  const updatePump = useLogStore((s) => s.updatePump);
  const updateBottle = useLogStore((s) => s.updateBottle);
  const deleteNursing = useLogStore((s) => s.deleteNursing);
  const deletePump = useLogStore((s) => s.deletePump);
  const deleteBottle = useLogStore((s) => s.deleteBottle);

  const nursing = kind === "nursing" ? nursingSessions.find((s) => s.id === id) : undefined;
  const pump = kind === "pump" ? pumpEvents.find((p) => p.id === id) : undefined;
  const bottle = kind === "bottle" ? bottleEvents.find((b) => b.id === id) : undefined;

  const [mlText, setMlText] = useState(() => {
    if (nursing) return nursing.milkMl != null ? String(mlToDisplay(nursing.milkMl, unit)) : "";
    if (pump) return pump.totalMl != null ? String(mlToDisplay(pump.totalMl, unit)) : "";
    if (bottle) return bottle.ml != null ? String(mlToDisplay(bottle.ml, unit)) : "";
    return "";
  });
  const committed = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [milkType, setMilkType] = useState<MilkType>(bottle?.milkType ?? "breast_milk");
  const [side, setSide] = useState<NursingSide>(nursing?.side ?? "unknown");

  const initialTime = nursing?.startedAt ?? pump?.startedAt ?? bottle?.occurredAt;
  const [from, setFrom] = useState(() => format(initialTime ? new Date(initialTime) : new Date(), "yyyy-MM-dd HH:mm"));
  const [to, setTo] = useState(() => format(nursing?.endedAt ? new Date(nursing.endedAt) : new Date(), "yyyy-MM-dd HH:mm"));
  const [finish, setFinish] = useState(true);
  const [endEdited, setEndEdited] = useState(false);
  const [error, setError] = useState(false);
  const started = parse(from, "yyyy-MM-dd HH:mm", new Date());
  const ended = parse(to, "yyyy-MM-dd HH:mm", new Date());
  const actualStart = initialTime && from === format(new Date(initialTime), "yyyy-MM-dd HH:mm") ? new Date(initialTime) : started;
  // An untouched end time means “finish now”, including seconds spent in the editor.
  const resolveEnd = (now: Date) => nursing && !nursing.endedAt && !endEdited
    ? now
    : nursing?.endedAt && !endEdited ? new Date(nursing.endedAt) : ended;
  const validTimes = (now: Date, end: Date) => isValid(actualStart) && actualStart <= now
    && (!nursing || !finish || (isValid(end) && end >= actualStart && end <= now));
  const validationNow = new Date();
  const timeValid = validTimes(validationNow, resolveEnd(validationNow));
  const originalMl = nursing?.milkMl ?? pump?.totalMl ?? bottle?.ml;
  // A nested side editor updates the store while this screen remains mounted.
  useEffect(() => {
    setMlText(originalMl != null ? String(mlToDisplay(originalMl, unit)) : "");
  }, [originalMl, unit]);
  const unchangedAmount = originalMl != null && mlText.trim() === String(mlToDisplay(originalMl, unit));
  const handleSave = () => {
    const now = new Date();
    const actualEnd = resolveEnd(now);
    if (!validTimes(now, actualEnd)) { setError(true); return; }

    const ml = unchangedAmount ? originalMl : mlText.trim() ? parseAmount(mlText, unit) : null;
    if (mlText.trim() && ml === null) return;

    if (committed.current) return;
    committed.current = true;
    setSaveError(false);
    try {
      if (nursing) {
        updateNursing(nursing.id, { side, milkMl: ml, startedAt: actualStart.toISOString(), ...(finish ? { endedAt: actualEnd.toISOString(), durationSeconds: (actualEnd.getTime() - actualStart.getTime()) / 1000 } : {}) });
      } else if (pump) {
        // Date and amount form one write; unchanged totals retain the recorded side split.
        updatePump(pump.id, { startedAt: actualStart.toISOString(), ...(!unchangedAmount ? { totalMl: ml } : {}) });
      } else if (bottle) {
        updateBottle(bottle.id, { ml, milkType, occurredAt: actualStart.toISOString() });
      }
      goBackOrHome(router);
    } catch { committed.current = false; setSaveError(true); }
  };

  const handleDelete = () => {
    if (committed.current) return;
    committed.current = true;
    setSaveError(false);
    try {
      if (nursing) deleteNursing(nursing.id);
      else if (pump) deletePump(pump.id);
      else if (bottle) deleteBottle(bottle.id);
      setConfirmDelete(false);
      goBackOrHome(router);
    } catch { committed.current = false; setSaveError(true); }
  };

  const showMlField = Boolean(nursing || pump || bottle);

  if (!nursing && !pump && !bottle) return <Screen><ScreenBack /><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("entryQA.notFound")}</Text></Screen>;

  return (
    <Screen>
      <ScreenBack />
      <Text style={[theme.type.display, { color: theme.colors.textPrimary }]}>{t("history.editEntry")}</Text>
      <Card style={{ gap: theme.spacing.sm }}>
        {nursing ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("home.whichSide")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 4, borderRadius: 20, backgroundColor: theme.colors.background }}>
              {SIDES.map((s) => (
                <Button
                  key={s}
                  label={t(`home.side${capitalize(s)}` as const, { defaultValue: s })}
                  tone="nursing"
                  variant={side === s ? "soft" : "ghost"}
                  active={side === s}
                  onPress={() => setSide(s)}
                  style={{ flexGrow: 1, flexBasis: "40%", minHeight: 44, paddingHorizontal: 8 }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {bottle ? <SelectField label={t("entryQA.milkType")} testID="entry-edit-milk-type" value={milkType} options={[{value:"breast_milk",label:t("bottleEntry.milkTypeBreastMilk")},{value:"formula",label:t("bottleEntry.milkTypeFormula")}]} onChange={setMilkType} /> : null}
        {showMlField ? (
          <Field label={`${t(nursing ? "nursingAmount.label" : "bottleEntry.amount")} (${unit})`} hint={nursing ? t("nursingAmount.note") : undefined} amount testID="entry-edit-field-ml" value={mlText} onChangeText={setMlText} keyboardType="decimal-pad" placeholder="0" />
        ) : null}

        {pump ? <Button label={t("entryQA.editSides")} variant="ghost" onPress={()=>router.push({pathname:"/modals/pump-details",params:{id:pump.id}})} /> : null}
        <DateTimeField label={t("timers.start")} value={from} onChange={setFrom} />
        {nursing && !nursing.endedAt ? <Button label={t(finish ? "timers.keepRunning" : "timers.alreadyEnded")} variant="soft" onPress={() => setFinish(!finish)} /> : null}
        {nursing && finish ? <DateTimeField label={t("timers.end")} value={to} onChange={(value) => { setTo(value); setEndEdited(true); }} /> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("entryQA.invalidTime")}</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t("entryQA.saveError")}</Text> : null}
        <Button testID="entry-edit-save" disabled={!timeValid || (showMlField && Boolean(mlText.trim()) && !unchangedAmount && parseAmount(mlText, unit) === null)} label={t(nursing && !nursing.endedAt && finish ? "timers.finishAndSave" : "common.save")} tone="accent" onPress={handleSave} />
        <Button label={t("history.deleteEntry")} tone="danger" variant="ghost" testID="entry-delete-open" onPress={() => { setSaveError(false); setConfirmDelete(true); }} />
      </Card>
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: theme.spacing.lg, backgroundColor: "rgba(0,0,0,0.35)" }}>
          <Card style={{ gap: theme.spacing.md }}>
            <Text accessibilityRole="header" style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("history.deleteConfirmTitle")}</Text>
            <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t("history.deleteConfirmBody")}</Text>
            {saveError ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("entryQA.saveError")}</Text> : null}
            <Button testID="entry-delete-confirm" label={t("common.delete")} tone="danger" onPress={handleDelete} />
            <Button testID="entry-delete-cancel" label={t("common.cancel")} variant="ghost" onPress={() => setConfirmDelete(false)} />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

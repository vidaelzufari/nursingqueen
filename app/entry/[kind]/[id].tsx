import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { mlToDisplay, parseAmount } from "@/domain/units";
import { format, parse, isValid } from "date-fns";
import { DateTimeField } from "@/components/DateTimeField";
import { NursingSide } from "@/db/types";

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
  const addPumpTotal = useLogStore(s => s.addPumpTotal);
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
  const [side, setSide] = useState<NursingSide>(nursing?.side ?? "unknown");

  const initialTime = nursing?.startedAt ?? pump?.startedAt ?? bottle?.occurredAt;
  const [from, setFrom] = useState(() => format(initialTime ? new Date(initialTime) : new Date(), "yyyy-MM-dd HH:mm"));
  const [to, setTo] = useState(() => format(nursing?.endedAt ? new Date(nursing.endedAt) : new Date(), "yyyy-MM-dd HH:mm"));
  const [finish, setFinish] = useState(Boolean(nursing?.endedAt));
  const [error, setError] = useState(false);
  const started = parse(from, "yyyy-MM-dd HH:mm", new Date());
  const ended = parse(to, "yyyy-MM-dd HH:mm", new Date());
  const actualStart = initialTime && from === format(new Date(initialTime), "yyyy-MM-dd HH:mm") ? new Date(initialTime) : started;
  const actualEnd = nursing?.endedAt && to === format(new Date(nursing.endedAt), "yyyy-MM-dd HH:mm") ? new Date(nursing.endedAt) : ended;
  const timeValid = isValid(started) && started <= new Date() && (!nursing || !finish || (isValid(actualEnd) && actualEnd > actualStart && actualEnd <= new Date()));
  const handleSave = () => {
    if (!timeValid) { setError(true); return; }
    const ml = mlText.trim() ? parseAmount(mlText, unit) : null;
    if (mlText.trim() && ml === null) return;

    if (nursing) {
      updateNursing(nursing.id, { side, milkMl: ml, startedAt: actualStart.toISOString(), ...(finish ? { endedAt: actualEnd.toISOString(), durationSeconds: (actualEnd.getTime() - actualStart.getTime()) / 1000 } : {}) });
    } else if (pump) {
      updatePump(pump.id, { startedAt: actualStart.toISOString() });
      if (pump.totalMl !== null && mlText.trim() === String(mlToDisplay(pump.totalMl, unit))) { goBackOrHome(router); return; }
      if (ml !== null && ml > 0 && Number.isFinite(ml)) addPumpTotal(pump.id, ml);
      else if (!mlText.trim()) updatePump(pump.id, { leftMl: null, rightMl: null });
      else return;
    } else if (bottle) {
      updateBottle(bottle.id, { ml, occurredAt: actualStart.toISOString() });
    }
    goBackOrHome(router);
  };

  const handleDelete = () => {
    Alert.alert(t("history.deleteConfirmTitle"), t("history.deleteConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          if (nursing) deleteNursing(nursing.id);
          else if (pump) deletePump(pump.id);
          else if (bottle) deleteBottle(bottle.id);
          goBackOrHome(router);
        },
      },
    ]);
  };

  const showMlField = Boolean(nursing || pump || bottle);

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingHorizontal: 4 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: theme.spacing.md, width: "100%", maxWidth: 580, alignSelf: "center" }}>
      <ScreenBack />
      <Text style={[theme.type.title, { color: theme.colors.textPrimary, marginBottom: 16 }]}>{t("history.editEntry")}</Text>
      <Card style={{ gap: theme.spacing.sm }}>
        {nursing ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{t("home.whichSide")}</Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
              {SIDES.map((s) => (
                <Button
                  key={s}
                  label={t(`home.side${capitalize(s)}` as const, { defaultValue: s })}
                  tone="nursing"
                  variant={side === s ? "solid" : "outline"}
                  active={side === s}
                  onPress={() => setSide(s)}
                  style={{ flex: 1, paddingHorizontal: 4 }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showMlField ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>
              {t(nursing ? "nursingAmount.label" : "bottleEntry.amount")} ({unit})
            </Text>
            {nursing ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("nursingAmount.note")}</Text> : null}
            <TextInput
              testID="entry-edit-field-ml"
              value={mlText}
              onChangeText={setMlText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.md,
                padding: theme.spacing.sm,
                fontSize: 18,
                color: theme.colors.textPrimary,
              }}
            />
          </View>
        ) : null}

        <DateTimeField label={t("timers.start")} value={from} onChange={setFrom} />
        {nursing && !nursing.endedAt ? <Button label={t(finish ? "timers.keepRunning" : "timers.alreadyEnded")} variant="outline" onPress={() => setFinish(!finish)} /> : null}
        {nursing && finish ? <DateTimeField label={t("timers.end")} value={to} onChange={setTo} /> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("sleep.invalid")}</Text> : null}
        <Button testID="entry-edit-save" disabled={!timeValid || (showMlField && Boolean(mlText.trim()) && parseAmount(mlText, unit) === null)} label={t("common.save")} tone="accent" onPress={handleSave} />
        <Button label={t("history.deleteEntry")} tone="danger" variant="outline" onPress={handleDelete} />
      </Card>
    </ScrollView></KeyboardAvoidingView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

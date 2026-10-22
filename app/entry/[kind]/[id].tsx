import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { mlToDisplay, parseAmount } from "@/domain/units";
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
    if (pump) return pump.totalMl != null ? String(mlToDisplay(pump.totalMl, unit)) : "";
    if (bottle) return bottle.ml != null ? String(mlToDisplay(bottle.ml, unit)) : "";
    return "";
  });
  const [side, setSide] = useState<NursingSide>(nursing?.side ?? "unknown");

  const handleSave = () => {
    const ml = mlText.trim() ? parseAmount(mlText, unit) : null;
    if (mlText.trim() && ml === null) return;

    if (nursing) {
      updateNursing(nursing.id, { side });
    } else if (pump) {
      if (pump.totalMl !== null && mlText.trim() === String(mlToDisplay(pump.totalMl, unit))) { goBackOrHome(router); return; }
      if (ml !== null && ml > 0 && Number.isFinite(ml)) addPumpTotal(pump.id, ml);
      else if (!mlText.trim()) updatePump(pump.id, { leftMl: null, rightMl: null });
      else return;
    } else if (bottle) {
      updateBottle(bottle.id, { ml });
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

  const showMlField = Boolean(pump || bottle);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: theme.spacing.md, width: "100%", maxWidth: 580, alignSelf: "center" }}>
      <ScreenBack />
      <Text style={[theme.type.title, { color: theme.colors.textPrimary, marginBottom: 16 }]}>{t("details.edit")}</Text>
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
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showMlField ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>
              {t("bottleEntry.amount")} ({unit})
            </Text>
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

        <Button testID="entry-edit-save" disabled={showMlField && Boolean(mlText.trim()) && parseAmount(mlText, unit) === null} label={t("common.save")} tone="accent" onPress={handleSave} />
        <Button label={t("history.deleteEntry")} tone="danger" variant="outline" onPress={handleDelete} />
      </Card>
    </ScrollView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

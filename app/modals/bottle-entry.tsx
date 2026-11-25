import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/components/Icon";
import { Button } from "@/components";
import { EntryHeading } from "@/components/EntryHeading";
import { QuickAmount } from "@/components/QuickAmount";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { MilkType } from "@/db/types";

export default function BottleEntryModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const unit = useSettingsStore(s => s.unit);
  const babyId = useLogStore(s => s.babyId);
  const logBottle = useLogStore(s => s.logBottle);
  const events = useLogStore(s => s.bottleEvents);
  const [milkType, setMilkType] = useState<MilkType>(events[0]?.milkType ?? "breast_milk");
  const committed = useRef(false);
  const last = events.find(event => event.milkType === milkType && event.ml != null);
  const commit = (ml: number | null) => {
    if (!babyId) { router.replace("/profile/edit"); return; }
    if (committed.current) return;
    committed.current = true;
    try { logBottle(ml, milkType); goBackOrHome(router); }
    catch (error) { committed.current = false; throw error; }
  };
  return <Screen>
      <ScreenBack dismiss />
    <EntryHeading title={t("bottleEntry.title")} icon="bottle" color={theme.colors.bottle} />
    <View style={{ flexDirection: "row", gap: 10 }}>
      {(["breast_milk", "formula"] as const).map(type => <Button key={type} testID={`bottle-entry-type-${type.replace("_", "-")}`} label={t(type === "breast_milk" ? "bottleEntry.milkTypeBreastMilk" : "bottleEntry.milkTypeFormula")} tone="bottle" variant={milkType === type ? "solid" : "outline"} active={milkType === type} icon={milkType === type ? <Icon name="check" size={16} color={theme.colors.accentContrast} /> : undefined} onPress={() => setMilkType(type)} style={{ flex: 1, minHeight: 48, paddingHorizontal: 10 }} />)}
    </View>
    <QuickAmount unit={unit} color={theme.colors.bottle} lastMl={last?.ml} onSave={commit} />
    <Button label={t("bottleEntry.skipAmount")} tone="neutral" variant="ghost" onPress={() => commit(null)} />
  </Screen>;
}

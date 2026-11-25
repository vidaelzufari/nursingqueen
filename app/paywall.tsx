import { goBackOrHome } from "@/navigation/back";
import { Screen } from "@/components/Screen";
import { ScreenBack } from "@/components/ScreenBack";
import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, CrownMark } from "@/components";
import { useEntitlementStore } from "@/store/useEntitlementStore";

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const purchase = useEntitlementStore((s) => s.purchase);
  const restore = useEntitlementStore((s) => s.restore);

  return (
    <Screen>
      <ScreenBack />
      <View style={{ alignSelf: "center", padding: 24, borderRadius: 32, backgroundColor: theme.colors.surfaceRaised }}><CrownMark size={80} /></View>
      <Text style={[theme.type.display, { color: theme.colors.textPrimary, textAlign: "center" }]}>{t("paywall.title")}</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, textAlign: "center" }]}>{t("paywall.subtitle")}</Text>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{t("paywall.priceNote")}</Text>
      <Button label={t("paywall.purchase")} tone="accent" fullWidth onPress={() => purchase().then(() => goBackOrHome(router))} />
      <Button label={t("paywall.restore")} tone="neutral" variant="outline" fullWidth onPress={() => void restore()} />
      <Button label={t("paywall.notNow")} tone="neutral" variant="ghost" onPress={() => goBackOrHome(router)} />
    </Screen>
  );
}

import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useActiveBaby } from "@/store/useBabyStore";
import { useTheme } from "@/theme/ThemeProvider";
import { sleepReferenceHours } from "@/domain/ageReference";
import { Card } from "./Card";
export function AgeContext({ now }: { now: Date }) {
  const baby = useActiveBaby(); const theme = useTheme(); const { t } = useTranslation();
  const hours = baby ? sleepReferenceHours(baby.dateOfBirth, now) : null;
  if (!baby) return null;
  return <Card style={{ gap: 12 }}>
    <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("ageContext.title")}</Text>
    <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{hours ? t("ageContext.sleep", hours) : t("ageContext.varies")}</Text>
    <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("ageContext.personal")}</Text>
    <View style={{ flexDirection: "row", gap: 24 }}>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://sleepeducation.org/healthy-sleep/")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: theme.colors.accent }}>{t("ageContext.sleepSource")}</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://www.cdc.gov/infant-toddler-nutrition/breastfeeding/how-much-and-how-often.html")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: theme.colors.accent }}>{t("ageContext.feedSource")}</Text></Pressable>
    </View>
  </Card>;
}

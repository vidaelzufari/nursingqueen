import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { ScreenBack } from "@/components/ScreenBack";
import React from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { Icon } from "@/components/Icon";
import { parseBirthDate, validBirthDate } from "@/domain/birthDate";
import { useActiveBaby, useBabyStore } from "@/store/useBabyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeAge } from "@/domain/dateMath";
import { weightRepository } from "@/db/repositories";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const babies = useBabyStore((s) => s.babies);
  const activeBaby = useActiveBaby();
  const switchActiveBaby = useBabyStore((s) => s.switchActiveBaby);
  const activeBabyId = useSettingsStore((s) => s.activeBabyId);

  const now = new Date();
  const birthDate = activeBaby && validBirthDate(activeBaby.dateOfBirth, now) ? parseBirthDate(activeBaby.dateOfBirth) : null;
  const age = birthDate ? computeAge(birthDate, now) : null;
  const weightEntries = activeBaby ? weightRepository.listByBaby(activeBaby.id) : [];

  return (
    <Screen>
      <ScreenBack />
      <Text style={[theme.type.display, { color: theme.colors.textPrimary }]}>{t("profile.title")}</Text>

      {activeBaby ? (
        <Card style={{ alignItems: "center", gap: theme.spacing.sm }}>
          {activeBaby.photoUri ? (
            <Image source={{ uri: activeBaby.photoUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.surfaceRaised,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="baby" size={36} color={theme.colors.accent} />
            </View>
          )}
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{activeBaby.name}</Text>
          {age ? (
            <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>
              {age.isMonthsPhase ? t("profile.age.months", { count: age.months }) : t("profile.age.weeks", { count: age.weeks })}
            </Text>
          ) : null}
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.privacyNote")}</Text>
          <Button label={t("common.edit")} tone="neutral" variant="soft" onPress={() => router.push(`/profile/edit?id=${activeBaby.id}`)} />
        </Card>
      ) : null}

      {activeBaby ? <Card style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.weight")}</Text>
        {weightEntries.length === 0 ? (
          <EmptyState icon="analytics" title={t("profile.weightEmpty")} />
        ) : (
          weightEntries
            .slice()
            .reverse()
            .map((entry) => (
              <Text key={entry.id} style={[theme.type.body, { color: theme.colors.textSecondary }]}>
                {(entry.weightGrams / 1000).toFixed(2)} kg — {new Date(entry.measuredAt).toLocaleDateString(i18n?.resolvedLanguage ?? i18n?.language)}
              </Text>
            ))
        )}
      </Card> : null}

      {babies.length > 1 ? (
        <Card style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.switchBaby")}</Text>
          {babies.map((baby) => (
            <Button
              key={baby.id}
              label={baby.name}
              tone="accent"
              variant={baby.id === activeBabyId ? "soft" : "ghost"}
              active={baby.id === activeBabyId}
              onPress={() => switchActiveBaby(baby.id)}
            />
          ))}
        </Card>
      ) : null}

      <Button label={t("profile.addBaby")} tone="accent" variant="soft" onPress={() => router.push("/profile/edit")} />
    </Screen>
  );
}

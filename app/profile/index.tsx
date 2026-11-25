import { formatAge } from "@/i18n/formatAge";
import { ListRow } from "@/components/ListRow";
import { IconBadge } from "@/components/IconBadge";
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
import { computeAge } from "@/domain/dateMath";
import { weightRepository } from "@/db/repositories";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  useBabyStore((s) => s.babies);
  const activeBaby = useActiveBaby();

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
              {formatAge(age, t)}
            </Text>
          ) : null}
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.privacyNote")}</Text>
          <Button label={t("common.edit")} tone="neutral" variant="soft" onPress={() => router.push(`/profile/edit?id=${activeBaby.id}`)} />
        </Card>
      ) : null}

      {activeBaby ? <Card style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.weight")}</Text>
        {weightEntries.length === 0 ? (
          <EmptyState icon="weight" title={t("profile.weightEmpty")} />
        ) : (
          weightEntries
            .slice()
            .reverse()
            .map((entry, index) => <ListRow key={entry.id} title={`${(entry.weightGrams / 1000).toLocaleString(i18n?.resolvedLanguage ?? i18n?.language, { maximumFractionDigits: 3 })} kg`} subtitle={new Date(entry.measuredAt).toLocaleDateString(i18n?.resolvedLanguage ?? i18n?.language)} divider={index > 0} leading={<IconBadge name="weight" color={theme.colors.accent} />} />)

        )}
      </Card> : null}

      {!activeBaby ? <Button label={t("profile.addBaby")} tone="accent" variant="soft" onPress={() => router.push("/profile/edit")} /> : null}
    </Screen>
  );
}

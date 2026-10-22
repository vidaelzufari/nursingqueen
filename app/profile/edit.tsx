import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { Icon } from "@/components/Icon";
import { useBabyStore } from "@/store/useBabyStore";
import { weightRepository } from "@/db/repositories";

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const babies = useBabyStore((s) => s.babies);
  const createBaby = useBabyStore((s) => s.createBaby);
  const updateBaby = useBabyStore((s) => s.updateBaby);

  const existing = id ? babies.find((b) => b.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [weightText, setWeightText] = useState("");

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!name.trim() || !dateOfBirth.trim()) return;
    if (existing) {
      updateBaby(existing.id, { name: name.trim(), dateOfBirth: dateOfBirth.trim(), photoUri });
    } else {
      createBaby({ name: name.trim(), dateOfBirth: dateOfBirth.trim(), photoUri });
    }
    goBackOrHome(router);
  };

  const handleAddWeight = () => {
    const grams = Number(weightText);
    if (!existing || !weightText.trim() || Number.isNaN(grams)) return;
    weightRepository.create(existing.id, grams);
    setWeightText("");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, gap: 20, width: "100%", maxWidth: 580, alignSelf: "center", paddingBottom: 40 }}>
      <ScreenBack />
      <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("design.babySetup")}</Text>
      <Card style={{ alignItems: "center", gap: theme.spacing.sm }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
            <Icon name="baby" size={40} color={theme.colors.accent} />
          </View>
        )}
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("design.photoHint")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: theme.spacing.xs }}>
          <Button icon={<Icon name="photo" size={18} color={theme.colors.textPrimary} />} label={t("profile.choosePhoto")} tone="neutral" variant="outline" onPress={handlePickPhoto} />
          <Button icon={<Icon name="photo" size={18} color={theme.colors.textPrimary} />} label={t("profile.takePhoto")} tone="neutral" variant="outline" onPress={handleTakePhoto} />
        </View>
      </Card>

      <Card style={{ gap: theme.spacing.sm }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.name")}</Text>
          <TextInput accessibilityLabel={t("profile.name")} value={name} onChangeText={setName} placeholderTextColor={theme.colors.textMuted} style={inputStyle(theme)} />
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("profile.dateOfBirth")}</Text>
          <TextInput
            accessibilityLabel={t("profile.dateOfBirth")}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle(theme)}
          />
        </View>
        <Button label={t("design.saveBaby")} disabled={!name.trim() || !dateOfBirth.trim()} icon={<Icon name="check" size={18} color={theme.colors.accentContrast} />} tone="accent" onPress={handleSave} />
      </Card>

      {existing ? (
        <Card style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.addWeight")}</Text>
          <TextInput
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="number-pad"
            placeholder="grams"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle(theme)}
          />
          <Button label={t("common.add")} tone="accent" variant="outline" onPress={handleAddWeight} />
        </Card>
      ) : null}
    </ScrollView>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>) {
  return {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 54,
    backgroundColor: theme.colors.surfaceRaised,
    color: theme.colors.textPrimary,
  } as const;
}

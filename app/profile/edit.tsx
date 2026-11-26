import { BabyAvatar } from "@/components/BabyAvatar";
import { persistProfilePhoto } from "@/services/profilePhoto";
import { parseWeightKg } from "@/domain/weight";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { ListRow } from "@/components/ListRow";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useState } from "react";
import { Keyboard, Platform, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card } from "@/components";
import { Icon } from "@/components/Icon";
import { useBabyStore } from "@/store/useBabyStore";
import { BirthDateField } from "@/components/BirthDateField";
import { validBirthDate } from "@/domain/birthDate";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { weightRepository } from "@/db/repositories";

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id, intent } = useLocalSearchParams<{ id?: string; intent?: string }>();
  const loggingIntent = ["nurse", "pump", "bottle", "sleep", "earlier", "solids"].includes(intent ?? "") ? intent : undefined;
  const babies = useBabyStore((s) => s.babies);
  const createBaby = useBabyStore((s) => s.createBaby);
  const updateBaby = useBabyStore((s) => s.updateBaby);

  const existing = babies.find((b) => b.id === id) ?? babies[0];

  const [name, setName] = useState(existing?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [weightText, setWeightText] = useState("");

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: Platform.OS === "web", allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) { try { setPhotoUri(await persistProfilePhoto(result.assets[0].uri, result.assets[0].base64)); } catch { useFeedbackStore.getState().show(t("profile.photoError")); } }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: Platform.OS === "web", allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) { try { setPhotoUri(await persistProfilePhoto(result.assets[0].uri, result.assets[0].base64)); } catch { useFeedbackStore.getState().show(t("profile.photoError")); } }
  };

  const handleSave = () => {
    if (!name.trim() || !validBirthDate(dateOfBirth) || (existing && weightText.trim() && parseWeightKg(weightText) === null)) return;
    Keyboard.dismiss();
    if (existing) {
      try {
        updateBaby(existing.id, { name: name.trim(), dateOfBirth: dateOfBirth.trim(), photoUri });
        if (weightText.trim()) {
          weightRepository.create(existing.id, parseWeightKg(weightText)!);
          setWeightText("");
          useBabyStore.getState().refresh();
        }
      } catch { useFeedbackStore.getState().show(t("profile.saveError")); return; }
    } else {
      const baby = createBaby({ name: name.trim(), dateOfBirth, photoUri });
      useLogStore.getState().refresh(baby.id);
      useSleepStore.getState().refresh(baby.id);
      if (loggingIntent) {
        if (loggingIntent === "solids") { router.replace("/modals/meal-entry"); }
        else if (loggingIntent === "nurse") { useLogStore.getState().startNursing(); router.replace("/"); }
        else if (loggingIntent === "sleep") { useSleepStore.getState().start(); router.replace("/"); }
        else if (loggingIntent === "bottle") router.replace("/modals/bottle-entry");
        else if (loggingIntent === "earlier") router.replace("/modals/nursing-duration");
        else { const event = useLogStore.getState().logPump(); router.replace({ pathname: "/modals/pump-details", params: { id: event.id } }); }
        return;
      }
    }
    goBackOrHome(router);
  };

  const [weightRevision, setWeightRevision] = useState(0);
  const grams = parseWeightKg(weightText);
  const weights = existing ? weightRepository.listByBaby(existing.id) : [];
  const latestWeight = weights[weights.length - 1];
  const handleAddWeight = () => {
    if (!existing || grams === null) return;
    try {
      weightRepository.create(existing.id, grams);
      setWeightText(""); setWeightRevision(weightRevision + 1);
      useBabyStore.getState().refresh();
      Keyboard.dismiss();
      useFeedbackStore.getState().show(t("profile.weightSaved"));
    } catch { useFeedbackStore.getState().show(t("profile.weightError")); }
  };

  return (
    <Screen footer={<Button label={t(loggingIntent ? `setup.save_${loggingIntent}` : existing ? "common.save" : "design.saveBaby")} disabled={!name.trim() || !validBirthDate(dateOfBirth) || Boolean(existing && weightText.trim() && grams === null)} icon={<Icon name="check" size={18} color={theme.colors.accentContrast} />} tone="accent" onPress={handleSave} />}>
      <ScreenBack dismiss />
      <Text style={[theme.type.display, { color: theme.colors.textPrimary }]}>{t(existing ? "profile.editTitle" : "design.babySetup")}</Text>
      {!existing ? <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{t(loggingIntent ? "setup.reason" : "setup.intro")}</Text> : null}
      {!loggingIntent ? <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
        <BabyAvatar uri={photoUri} size={72} label={name || t("profile.title")} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("design.photoHint")}</Text>
          <Button compact icon={<Icon name="photo" size={16} color={theme.colors.accent} />} label={t("profile.choosePhoto")} variant="ghost" onPress={handlePickPhoto} style={{ paddingHorizontal: 4 }} />
          <Button compact label={t("profile.takePhoto")} tone="neutral" variant="ghost" onPress={handleTakePhoto} style={{ paddingHorizontal: 4 }} />
        </View>
      </Card> : null}

      <Card style={{ gap: theme.spacing.sm }}>
        <Field label={t("profile.name")} value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        <BirthDateField value={dateOfBirth} onChange={setDateOfBirth} />
      </Card>

      {existing ? (
        <Card style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.type.subtitle, { color: theme.colors.textPrimary }]}>{t("profile.addWeight")}</Text>
          <Field label={t("profile.weightKg")} value={weightText} onChangeText={setWeightText} keyboardType="decimal-pad" placeholder="5,2" amount testID="profile-weight-input" />
          <Button testID="profile-add-weight" label={t("common.add")} disabled={grams === null} tone="accent" variant="soft" onPress={handleAddWeight} />
          {latestWeight ? <ListRow title={t("profile.latestWeight")} subtitle={new Date(latestWeight.measuredAt).toLocaleDateString(i18n?.resolvedLanguage ?? i18n?.language)} trailing={<Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{(latestWeight.weightGrams / 1000).toLocaleString(i18n?.resolvedLanguage ?? i18n?.language, { maximumFractionDigits: 3 })} kg</Text>} /> : null}
        </Card>
      ) : null}
    </Screen>
  );
}


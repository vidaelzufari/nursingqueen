import { goBackOrHome } from "@/navigation/back";
import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "./IconButton";

/** Quiet navigation chrome shared by full screens and dismissible entry flows. */
export function ScreenBack({ dismiss = false }: { dismiss?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={{ alignSelf: "stretch", marginTop: insets.top, minHeight: 48, flexDirection: "row", justifyContent: dismiss ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <IconButton name={dismiss ? "close" : "back"} label={t(dismiss ? "common.cancel" : "navigation.back")} directional={!dismiss} onPress={() => goBackOrHome(router)} />
    </View>
  );
}

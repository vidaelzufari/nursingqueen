import React from "react";
import { ActivityIndicator, Image, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

/** Matches the native launch asset so database startup feels like one screen. */
export function LaunchScreen() {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const size = Math.min(width, height);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FB", alignItems: "center", justifyContent: "center" }}>
      <StatusBar style="dark" />
      <Image source={require("../../assets/splash.png")} accessibilityLabel="Nursing Queen" style={{ width: size, height: size }} resizeMode="contain" />
      <ActivityIndicator accessibilityLabel={t("common.loading")} color="#953D8B" size="small" style={{ position: "absolute", bottom: Math.max(40, height * 0.07) }} />
    </View>
  );
}

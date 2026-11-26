import React from "react";
import { Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";

export const BRAND_MARK_PATH = "M15 29C22 19 25 5 39 5C53 5 57 21 45 29C35 35 22 31 18 42C22 29 36 33 44 26C55 16 46 6 36 11C26 16 13 32 12 42C10 55 38 61 51 51C62 42 55 29 46 34C41 37 42 41 43 43C37 37 43 29 51 31C66 34 65 56 49 61C31 68 5 58 7 44C8 38 12 33 15 29ZM27 51C33 41 43 46 50 45C55 44 57 39 55 36C60 41 56 48 50 49C42 49 35 45 27 51Z";

/** Nursing Queen symbol from the Blumea website identity, recoloured for the mobile palette. */
export function BrandMark({ size = 36, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  return <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...(Platform.OS === "web" ? { "aria-hidden": true } : { accessibilityElementsHidden: true })}>
    <Path d={BRAND_MARK_PATH} fill={color ?? theme.colors.accent} />
  </Svg>;
}

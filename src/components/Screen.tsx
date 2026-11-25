import { useLayoutDirection } from "@/i18n/useLayoutDirection";
import React, { forwardRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

/** Shared canvas for secondary screens, with keyboard-safe scrolling and one gutter. */
export const Screen = forwardRef<ScrollView, { children: React.ReactNode; gap?: number }>(function Screen({ children, gap = 20 }, ref) {
  const { direction } = useLayoutDirection();
  const theme = useTheme(); const insets = useSafeAreaInsets();
  return <KeyboardAvoidingView style={{ direction, flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView ref={ref} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: Math.max(insets.bottom + 24, 40), gap, width: "100%", maxWidth: 580, alignSelf: "center" }}>{children}</ScrollView>
  </KeyboardAvoidingView>;
});

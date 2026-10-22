import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "./Icon";
export function SaveFeedback() {
  const { feedback, dismiss } = useFeedbackStore(); const theme = useTheme(); const { t } = useTranslation();
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => dismiss(feedback.id), 7000); return () => clearTimeout(timer); }, [feedback, dismiss]);
  if (!feedback) return null;
  return <View pointerEvents="box-none" style={{ position: "absolute", bottom: 100, start: 16, end: 16, alignItems: "center" }}><View accessibilityLiveRegion="polite" style={{ maxWidth: 540, width: "100%", padding: 16, borderRadius: 24, backgroundColor: theme.colors.accent, flexDirection: "row", alignItems: "center", gap: 10 }}><Icon name="check" color={theme.colors.accentContrast} /><Text style={[theme.type.bodyStrong, { flex: 1, color: theme.colors.accentContrast }]}>{feedback.message}</Text>{feedback.undo ? <Pressable accessibilityRole="button" onPress={() => { dismiss(feedback.id); feedback.undo?.(); }} style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center" }}><Text style={[theme.type.bodyStrong, { color: theme.colors.accentContrast, textDecorationLine: "underline" }]}>{t("feedback.undo")}</Text></Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={t("common.close", { defaultValue: "Close" })} onPress={() => dismiss(feedback.id)} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" }}><Text style={{ color: theme.colors.accentContrast, fontSize: 24 }}>×</Text></Pressable>}</View></View>;
}

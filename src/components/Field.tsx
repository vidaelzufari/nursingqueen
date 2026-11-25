import { useLayoutDirection } from "@/i18n/useLayoutDirection";
import React, { useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

/** Labels, focus, numeric emphasis and keyboard behaviour remain consistent across forms. */
export function Field({ label, hint, amount = false, ...props }: TextInputProps & { label: string; hint?: string; amount?: boolean }) {
  const { isRTL } = useLayoutDirection();
  const theme = useTheme(); const [focused, setFocused] = useState(false);
  return <View style={{ gap: 8, flexShrink: 1 }}>
    <Text style={[theme.type.bodyStrong, { color: theme.colors.textPrimary }]}>{label}</Text>
    {hint ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{hint}</Text> : null}
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} placeholderTextColor={theme.colors.textMuted}
      onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }}
      style={[theme.type.body, { minHeight: amount ? 72 : 56, borderRadius: 16, borderWidth: 1.5, borderColor: focused ? theme.colors.accent : theme.colors.border,
        backgroundColor: theme.colors.background, paddingHorizontal: 16, paddingVertical: 14, color: theme.colors.textPrimary, fontSize: amount ? 28 : 16, lineHeight: amount ? 36 : 22, textAlign: isRTL && !amount ? "right" : "left", writingDirection: amount ? "ltr" : isRTL ? "rtl" : "ltr", fontVariant: amount ? ["tabular-nums"] : undefined }, props.style]} />
  </View>;
}

import React, { useRef, useState } from "react";
import { Keyboard, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLayoutDirection } from "@/i18n/useLayoutDirection";
import { useTheme } from "@/theme/ThemeProvider";
import { componentMetrics } from "@/theme/tokens";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { ListRow } from "./ListRow";

export function SelectField<T extends string>({ label, value, options, onChange, testID }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; testID?: string;
}) {
  const theme = useTheme(); const { t } = useTranslation(); const { direction } = useLayoutDirection();
  const insets = useSafeAreaInsets(); const [open, setOpen] = useState(false);
  const trigger = useRef<View>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => (trigger.current as unknown as { focus?: () => void })?.focus?.()); };
  return <>
    <Pressable ref={trigger} testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityValue={{ text: options.find(o => o.value === value)?.label }} accessibilityState={{ expanded: open }} onPress={() => { Keyboard.dismiss(); setOpen(true); }} style={({ pressed }) => ({ minHeight: 56, padding: 16, borderRadius: componentMetrics.field.radius, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.65 : 1 })}>
      <Text style={[theme.type.bodyStrong, { flex: 1, color: theme.colors.textPrimary }]}>{options.find(o => o.value === value)?.label}</Text>
      <View style={{ transform: [{ rotate: "-90deg" }] }}><Icon name="chevron" directional={false} size={20} color={theme.colors.textSecondary} /></View>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.colors.overlay, direction }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.cancel")} onPress={close} style={{ flex: 1 }} />
        <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 580, alignSelf: "center", maxHeight: "80%", paddingHorizontal: 24, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme.colors.surface, borderTopStartRadius: 24, borderTopEndRadius: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><Text accessibilityRole="header" style={[theme.type.subtitle, { flex: 1, color: theme.colors.textPrimary }]}>{label}</Text><IconButton name="close" label={t("common.cancel")} onPress={close} /></View>
          <ScrollView keyboardShouldPersistTaps="handled">{options.map((option, index) => <ListRow key={option.value} testID={testID ? `${testID}-option-${option.value}` : undefined} title={option.label} selected={option.value === value} divider={index > 0} onPress={() => { close(); onChange(option.value); }} />)}</ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

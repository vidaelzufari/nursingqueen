import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { componentMetrics } from "@/theme/tokens";
import { Icon } from "./Icon";

/** Shared row layout for activity, profile and selection lists. */
export function ListRow({ title, subtitle, leading, trailing, onPress, divider = false, selected, testID, titleAccessory }: {
  title: string; titleAccessory?:React.ReactNode; subtitle?: string; leading?: React.ReactNode; trailing?: React.ReactNode;
  onPress?: () => void; divider?: boolean; selected?: boolean; testID?: string;
}) {
  const theme = useTheme();
  const content = <>
    {leading}
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}><View style={{flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:6}}><Text style={[theme.type.bodyStrong, { flexShrink:1,color: selected ? theme.colors.accent : theme.colors.textPrimary }]}>{title}</Text>{titleAccessory}</View>{subtitle ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}</View>
    {trailing}
    {selected !== undefined ? selected ? <Icon name="check" size={20} color={theme.colors.accent} /> : <View style={{ width: 20 }} /> : onPress ? <Icon name="arrow" size={16} color={theme.colors.textMuted} /> : null}
  </>;
  const style = { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, minHeight: componentMetrics.list.rowHeight, paddingVertical: componentMetrics.list.verticalPadding, borderTopWidth: divider ? 1 : 0, borderColor: theme.colors.border };
  return onPress ? <Pressable testID={testID} accessibilityRole="button" accessibilityState={selected === undefined ? undefined : { selected }} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.65 : 1 }]}>{content}</Pressable> : <View testID={testID} style={style}>{content}</View>;
}

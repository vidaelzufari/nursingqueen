import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { IconBadge } from "./IconBadge";
import { ListRow } from "./ListRow";
import { SleepPeriod } from "@/db/types";
import { Card } from "./Card";

export type EntryKind = "nursing" | "pump" | "bottle" | "sleep" | "solids";

export interface EntryRowProps {
  kind: EntryKind;
  sleepPeriod?: SleepPeriod;
  title: string;
  timeLabel: string;
  detailLabel?: string;
  needsDetail?: boolean;
  needsDetailLabel?: string;
  onPress: () => void;
  testID?: string;
}

/** One row in History. Editing an entry is always this one tap away. */
export function EntryRow({
  kind,
  sleepPeriod,
  title,
  timeLabel,
  detailLabel,
  needsDetail = false,
  needsDetailLabel,
  onPress,
  testID,
}: EntryRowProps) {
  const theme = useTheme();
  const dotColor =
    kind === "solids" ? theme.colors.nap : kind === "nursing" ? theme.colors.nursing : kind === "pump" ? theme.colors.pumping : kind === "sleep" ? theme.colors.accent : theme.colors.bottle;

  const icon = kind === "nursing" ? "heart" : kind === "sleep" ? sleepPeriod === "nap" ? "nap" : "moon" : kind;
  const color = kind === "sleep" && sleepPeriod === "nap" ? theme.colors.nap : dotColor;
  return <Card style={{ marginBottom: theme.spacing.xs, paddingVertical: 0, paddingHorizontal: 16 }}>
    <ListRow testID={testID} title={title} subtitle={timeLabel} leading={<IconBadge name={icon} color={color} size="small" />} onPress={onPress}
      trailing={<View style={{ alignItems: "flex-end", maxWidth: "35%", gap: 4 }}>
        {detailLabel ? <Text style={[theme.type.caption, { color: theme.colors.textSecondary, textAlign: "right" }]}>{detailLabel}</Text> : null}
        {needsDetail ? <Text testID="history-needs-detail-badge" style={[theme.type.micro, { color: theme.colors.accent, backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radii.sm, paddingHorizontal: 8, paddingVertical: 3 }]}>{needsDetailLabel ?? "+ add ml"}</Text> : null}
      </View>} />
  </Card>;
}

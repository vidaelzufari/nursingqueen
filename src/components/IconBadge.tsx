import React from "react";
import { View } from "react-native";
import { Icon, IconName } from "./Icon";

/** Activity symbols share the same optical size, tint and container geometry. */
export function IconBadge({ name, color, size = "medium" }: {
  name: IconName; color: string; size?: "small" | "medium" | "large";
}) {
  const dimensions = size === "large" ? { box: 56, icon: 28, radius: 18 }
    : size === "small" ? { box: 36, icon: 20, radius: 12 }
    : { box: 44, icon: 24, radius: 14 };
  return <View style={{ width: dimensions.box, height: dimensions.box, flexShrink: 0,
    borderRadius: dimensions.radius, backgroundColor: color + "10", alignItems: "center", justifyContent: "center" }}>
    <Icon name={name} size={dimensions.icon} color={color} />
  </View>;
}

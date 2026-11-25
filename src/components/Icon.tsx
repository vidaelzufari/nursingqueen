import { useLayoutDirection } from "@/i18n/useLayoutDirection";
import React from "react";
import { Platform } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import { ActivityArtwork } from "./ActivityArtwork";
import nodes from "@/assets/lucide-icons.json";

export type IconName = keyof typeof nodes;
const shapes = { path: Path, circle: Circle, ellipse: Ellipse, line: Line, polygon: Polygon, polyline: Polyline, rect: Rect };
/** Licensed Lucide geometry. scripts/sync-icons.cjs selects only the symbols we use. */
export function Icon({ name, size = 24, color = "currentColor", directional = name === "arrow" || name === "back" || name === "chevron" }: { name: IconName; size?: number; color?: string; directional?: boolean }) {
  const { isRTL } = useLayoutDirection();
  if (name === "heart" || name === "pump" || name === "bottle" || name === "moon" || name === "nap" || name === "solids") return <ActivityArtwork kind={name === "nap" ? "sun" : name} size={size} color={color} />;
  return <Svg style={{ transform: [{ rotate: directional && isRTL ? "180deg" : "0deg" }] }} width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={name === "stop" || name === "play" ? color : "none"} pointerEvents="none" {...(Platform.OS === "web" ? { "aria-hidden": true } : { accessibilityElementsHidden: true })}>
    {(nodes[name] as [string, Record<string, string | number>][]).map(([tag, attributes], index) => {
      const Shape = shapes[tag as keyof typeof shapes];
      const { key, ...props } = attributes;
      return <Shape {...props} key={key ?? index} />;
    })}
  </Svg>;
}

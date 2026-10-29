import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";

export type IconName = "analytics" | "home" | "history" | "settings" | "heart" | "pump" | "bottle" | "plus" | "arrow" | "baby" | "clock" | "check" | "sparkles" | "moon" | "photo" | "stop";
const paths: Partial<Record<IconName, string>> = {
  analytics: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  history: "M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2",
  settings: "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  pump: "M9 3h6M12 3v5M7 8h10v5l3 6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2l3-6ZM8 15h8M18 6h3v5",
  bottle: "M10 2h4v4M8 6h8v4l2 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7l2-3ZM8 6v4h8M12 15h6M14 18h4",
  plus: "M12 5v14M5 12h14", arrow: "M5 12h14M14 7l5 5-5 5",
  clock: "M12 7v5l3 2", check: "m5 12 4 4L19 6",
  sparkles: "m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5ZM20 2v4M18 4h4",
  moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
  photo: "M4 6h4l2-3h4l2 3h4v14H4Z",
};
export function Icon({ name, size = 24, color = "currentColor" }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
    {paths[name] ? <Path d={paths[name]} /> : null}
    {name === "settings" || name === "photo" ? <Circle cx={12} cy={12} r={3} /> : null}
    {name === "clock" ? <Circle cx={12} cy={12} r={9} /> : null}
    {name === "stop" ? <Rect x={6} y={6} width={12} height={12} rx={3} fill={color} stroke="none" /> : null}
    {name === "baby" ? <><Circle cx={12} cy={12} r={9} /><Path d="M9 15q3 3 6 0M9 10h.01M15 10h.01M12 3q-3 4 1 4" /></> : null}
  </Svg>;
}

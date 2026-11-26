import React, { useId } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

/** Larger filled category illustrations; utility icons retain their outline family. */
export function ActivityArtwork({ kind, color, size = 56 }: { kind: "heart" | "pump" | "bottle" | "moon" | "sun" | "solids"; color: string; size?: number }) {
  const id = `activity-${kind}-${useId().replace(/:/g, "")}`;
  return <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" pointerEvents="none">
    <Defs><LinearGradient id={id} x1="10" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor={color} stopOpacity={0.55} /><Stop offset="1" stopColor={color} /></LinearGradient></Defs>
    {kind === "heart" ? <><Circle cx={23} cy={13} r={7} fill={color}/><Path d="M13 55V36c0-10 4-15 11-15 6 0 9 4 11 10l6 7c4 4 9 6 15 5 0 10-8 15-21 15H17a4 4 0 0 1-4-3Z" fill={`url(#${id})`}/><Circle cx={43} cy={29} r={6} fill={color}/><Path d="m36 35 13 7c3 2 2 6-1 7-8 3-17 1-22-5" stroke="white" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"/><Path d="M19 34c2 8 7 14 16 16" stroke="white" strokeOpacity={.85} strokeWidth={3.5} strokeLinecap="round"/></> : null}
    {kind === "bottle" ? <><Rect x={18} y={23} width={28} height={35} rx={10} fill={`url(#${id})`} /><Path d="M23 23v-8h18v8" fill={color} /><Path d="M28 15V9c0-5 8-5 8 0v6" fill={color} /><Path d="M19 39h26v9c0 6-4 9-9 9h-7c-6 0-10-3-10-9Z" fill="white" fillOpacity={0.78} /><Path d="M35 31h7M37 36h5" stroke="white" strokeWidth={2.5} strokeLinecap="round" /></> : null}
    {kind === "pump" ? <><Rect x={14} y={30} width={26} height={28} rx={8} fill={`url(#${id})`} /><Path d="M19 30v-9h16v9M27 21V11M17 11h20" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /><Path d="M40 20h5a9 9 0 0 1 9 9v8" stroke={color} strokeWidth={4} strokeLinecap="round" /><Rect x={47} y={36} width={12} height={20} rx={4} fill={color} fillOpacity={0.4} /><Path d="M15 42h24v7a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8Z" fill="white" fillOpacity={0.8} /></> : null}
    {kind === "solids" ? <><Path d="M9 30h46c0 17-9 25-23 25S9 47 9 30Z" fill={`url(#${id})`} /><Path d="M12 30h40" stroke={color} strokeWidth={5} strokeLinecap="round" /><Path d="m39 28 11-18" stroke={color} strokeWidth={5} strokeLinecap="round" /><Path d="M21 44c4 4 12 5 17 2" stroke="white" strokeWidth={3} strokeLinecap="round" /></> : null}
    {kind === "sun" ? <><Circle cx={32} cy={32} r={14} fill={`url(#${id})`} /><Path d="M32 5v6M32 53v6M5 32h6M53 32h6M13 13l4 4M47 47l4 4M13 51l4-4M47 17l4-4" stroke={color} strokeWidth={4} strokeLinecap="round" /></> : null}
    {kind === "moon" ? <><Path d="M49 40a23 23 0 0 1-26-26 23 23 0 1 0 26 26Z" fill={`url(#${id})`} /><Path d="m43 9 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill={color} /><Circle cx={54} cy={32} r={3} fill={color} fillOpacity={0.5} /></> : null}
  </Svg>;
}

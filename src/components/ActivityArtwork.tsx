import React, { useId } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

/** Larger filled category illustrations; utility icons retain their outline family. */
export function ActivityArtwork({ kind, color, size = 56 }: { kind: "heart" | "pump" | "bottle" | "moon"; color: string; size?: number }) {
  const id = `activity-${kind}-${useId().replace(/:/g, "")}`;
  return <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" pointerEvents="none">
    <Defs><LinearGradient id={id} x1="10" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor={color} stopOpacity={0.55} /><Stop offset="1" stopColor={color} /></LinearGradient></Defs>
    {kind === "heart" ? <><Path d="M12 27c0-10 8-17 17-17 9 0 16 7 16 16v17c0 9-7 15-16 15-12 0-20-8-20-20" fill={`url(#${id})`} /><Circle cx={31} cy={28} r={7} fill="white" /><Path d="M20 42c7 7 18 5 23-2" stroke="white" strokeWidth={5} strokeLinecap="round" /><Path d="M49 15c4-6 11-1 7 4l-6 5-6-5c-4-5 3-10 5-4Z" fill={color} /></> : null}
    {kind === "bottle" ? <><Rect x={18} y={23} width={28} height={35} rx={10} fill={`url(#${id})`} /><Path d="M23 23v-8h18v8" fill={color} /><Path d="M28 15V9c0-5 8-5 8 0v6" fill={color} /><Path d="M19 39h26v9c0 6-4 9-9 9h-7c-6 0-10-3-10-9Z" fill="white" fillOpacity={0.78} /><Path d="M35 31h7M37 36h5" stroke="white" strokeWidth={2.5} strokeLinecap="round" /></> : null}
    {kind === "pump" ? <><Rect x={14} y={30} width={26} height={28} rx={8} fill={`url(#${id})`} /><Path d="M19 30v-9h16v9M27 21V11M17 11h20" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /><Path d="M40 20h5a9 9 0 0 1 9 9v8" stroke={color} strokeWidth={4} strokeLinecap="round" /><Rect x={47} y={36} width={12} height={20} rx={4} fill={color} fillOpacity={0.4} /><Path d="M15 42h24v7a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8Z" fill="white" fillOpacity={0.8} /></> : null}
    {kind === "moon" ? <><Path d="M49 40a23 23 0 0 1-26-26 23 23 0 1 0 26 26Z" fill={`url(#${id})`} /><Path d="m43 9 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill={color} /><Circle cx={54} cy={32} r={3} fill={color} fillOpacity={0.5} /></> : null}
  </Svg>;
}

import React from "react";
import { BrandMark } from "./BrandMark";

/** Retained API for premium screens; all brand touchpoints use the new mark. */
export function CrownMark({ size = 24, color }: { size?: number; color?: string }) {
  return <BrandMark size={size} color={color} />;
}

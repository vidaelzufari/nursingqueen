/**
 * Design tokens — the single file every component and screen pulls colors,
 * spacing, radii, and type from. Three palettes: light, dark, and an
 * extra-dim "night" variant for 3am sessions (lower brightness + warmer,
 * lower-contrast tones so it doesn't wake anyone up).
 */

export type ThemeMode = "light" | "dark" | "night";

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentContrast: string;
  crown: string;
  nursing: string;
  pumping: string;
  bottle: string;
  sleep: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
}

const light: ColorTokens = {
  background: "#FAF8F1",
  surface: "#FFFFFF",
  surfaceRaised: "#F0F0F8",
  border: "#DCDDEA",
  textPrimary: "#171931",
  textSecondary: "#494B66",
  textMuted: "#5F627A",
  accent: "#4037D4",
  accentContrast: "#FFFFFF",
  crown: "#756BF0",
  nursing: "#A92351",
  pumping: "#2544C1",
  bottle: "#006A55",
  sleep: "#87530B",
  success: "#17744D",
  warning: "#87530B",
  danger: "#AE293A",
  overlay: "rgba(23, 25, 49, 0.48)",
};

const dark: ColorTokens = {
  background: "#17131F", surface: "#221C2C", surfaceRaised: "#2E253B", border: "#41354F",
  textPrimary: "#F3ECE5", textSecondary: "#C7B9AE", textMuted: "#8B7E74", accent: "#C4A5E0", accentContrast: "#241632", crown: "#E0BD7C",
  nursing: "#D992A0", pumping: "#93AEC4", bottle: "#A3C89D", sleep: "#E7BA75", success: "#7BB894", warning: "#E0AC5F", danger: "#DE857A", overlay: "rgba(0, 0, 0, 0.6)",
};

/** Optional extra-dim theme retained for existing users. */
const night: ColorTokens = {
  background: "#0D0A11", surface: "#18121F", surfaceRaised: "#21192B", border: "#2A2320",
  textPrimary: "#C9BDB0", textSecondary: "#8F8175", textMuted: "#5C5249", accent: "#B69BC8", accentContrast: "#0D0A11", crown: "#8A6B3D",
  nursing: "#8C5A5F", pumping: "#5E6E7C", bottle: "#5F7A5C", sleep: "#A78155", success: "#4F7A61", warning: "#8F6C3B", danger: "#8F5049", overlay: "rgba(0, 0, 0, 0.75)",
};

export const palettes: Record<ThemeMode, ColorTokens> = { light, dark, night };

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typeScale = {
  display: { fontSize: 40, lineHeight: 46, letterSpacing: -0.9, fontWeight: "800" as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" as const },
  subtitle: { fontSize: 19, lineHeight: 25, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;

/** Minimum thumb-reachable hit target, per the product brief. */
export const MIN_TOUCH_TARGET = 60;

export const shadows = {
  card: {
    shadowColor: "#171931",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
} as const;

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
  nap: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
}

const light: ColorTokens = {
  background: "#F8F7FB",
  surface: "#FFFFFF",
  surfaceRaised: "#F2EDF7",
  border: "#E9E3ED",
  textPrimary: "#321A35",
  textSecondary: "#71667C",
  textMuted: "#776A80",
  accent: "#953D8B",
  sleep: "#953D8B",
  nap: "#A36728",
  accentContrast: "#FFFFFF",
  crown: "#AB87C5",
  nursing: "#B95C80",
  pumping: "#606D9F",
  bottle: "#367A65",
  success: "#5E9C76",
  warning: "#D0973F",
  danger: "#C4594F",
  overlay: "rgba(43, 35, 32, 0.45)",
};

const dark: ColorTokens = {
  background: "#17131F",
  surface: "#221C2C",
  surfaceRaised: "#2E253B",
  border: "#41354F",
  textPrimary: "#F3ECE5",
  textSecondary: "#C7B9AE",
  textMuted: "#8B7E74",
  accent: "#C4A5E0",
  sleep: "#C4A5E0",
  nap: "#E3B26F",
  accentContrast: "#241632",
  crown: "#E0BD7C",
  nursing: "#D992A0",
  pumping: "#93AEC4",
  bottle: "#A3C89D",
  success: "#7BB894",
  warning: "#E0AC5F",
  danger: "#DE857A",
  overlay: "rgba(0, 0, 0, 0.6)",
};

/** Extra-dim, warm, low-blue-light variant for overnight feeds. */
const night: ColorTokens = {
  background: "#0D0A11",
  surface: "#18121F",
  surfaceRaised: "#21192B",
  border: "#2A2320",
  textPrimary: "#C9BDB0",
  textSecondary: "#8F8175",
  textMuted: "#5C5249",
  accent: "#B69BC8",
  sleep: "#B69BC8",
  nap: "#B08C60",
  accentContrast: "#0D0A11",
  crown: "#8A6B3D",
  nursing: "#8C5A5F",
  pumping: "#5E6E7C",
  bottle: "#5F7A5C",
  success: "#4F7A61",
  warning: "#8F6C3B",
  danger: "#8F5049",
  overlay: "rgba(0, 0, 0, 0.75)",
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
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const typeScale = {
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.8, fontWeight: "700" as const },
  title: { fontSize: 26, lineHeight: 32, letterSpacing: -0.6, fontWeight: "700" as const },
  subtitle: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;

/** Minimum thumb-reachable hit target, per the product brief. */
export const MIN_TOUCH_TARGET = 52;

export const shadows = {
  card: {
    shadowColor: "#30243E",
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0,
  },
} as const;

/** Role-based geometry: controls, surfaces and activity artwork have separate jobs. */
export const componentMetrics = {
  button: { height: 52, largeHeight: 60, radius: 26, horizontalPadding: 20 },
  iconButton: { target: 48, glyph: 22, radius: 24 },
  list: { radius: 24, rowHeight: 72, horizontalPadding: 16, verticalPadding: 14 },
  field: { height: 56, radius: 16, horizontalPadding: 16 },
  activity: { glyph: 36, radius: 26, padding: 20 },
  page: { gutter: 24, sectionGap: 28 },
} as const;

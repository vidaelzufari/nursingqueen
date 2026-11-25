import React, { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { componentMetrics, MIN_TOUCH_TARGET } from "@/theme/tokens";

export type ButtonTone = "accent" | "nursing" | "pumping" | "bottle" | "neutral" | "danger";
export type ButtonVariant = "solid" | "outline" | "ghost" | "soft";

export interface ButtonProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  active?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  large?: boolean;
  compact?: boolean;
  haptic?: "light" | "medium" | "success" | "none";
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Core tappable primitive. Every big logger action uses this so scale +
 * haptic feedback (a tap "feels" confirmed without needing to look) is
 * consistent everywhere.
 */
export function Button({
  label,
  subLabel,
  icon,
  tone = "accent",
  variant = "solid",
  active = false,
  disabled = false,
  fullWidth = false,
  large = false,
  compact = false,
  haptic = "light",
  onPress,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toneColor = toneToColor(tone, theme.colors);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      if (haptic === "light") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      else if (haptic === "medium") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      else if (haptic === "success") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    onPress();
  }, [disabled, haptic, onPress]);

  const backgroundColor =
    variant === "solid" ? (active ? toneColor.active : toneColor.base) : variant === "soft" ? toneColor.base + "12" : "transparent";
  const borderColor = variant === "outline" ? (tone === "neutral" ? theme.colors.border : toneColor.base) : "transparent";
  const textColor =
    variant === "solid" ? toneColor.contrast : disabled ? theme.colors.textMuted : tone === "neutral" ? theme.colors.textPrimary : toneColor.base;

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: variant === "soft" ? "transparent" : borderColor,
          borderWidth: variant === "outline" ? 1 : 0,
          minHeight: large ? componentMetrics.button.largeHeight : compact ? 44 : MIN_TOUCH_TARGET,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.5 : 1,
          borderRadius: variant === "solid" ? componentMetrics.button.radius : theme.radii.md,
          paddingHorizontal: componentMetrics.button.horizontalPadding,
          paddingVertical: 12,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <View style={{ flexShrink: 1 }}>
          <Text
            style={[
              compact ? theme.type.caption : theme.type.bodyStrong,
              { color: textColor, textAlign: "center" },
            ]}
            
          >
            {label}
          </Text>
          {subLabel ? (
            <Text
              style={[
                theme.type.caption,
                { color: textColor, opacity: 0.85, textAlign: "center" },
              ]}
              >
              {subLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

function toneToColor(
  tone: ButtonTone,
  colors: ReturnType<typeof useTheme>["colors"]
): { base: string; active: string; contrast: string } {
  switch (tone) {
    case "nursing":
      return { base: colors.nursing, active: colors.nursing, contrast: colors.accentContrast };
    case "pumping":
      return { base: colors.pumping, active: colors.pumping, contrast: colors.accentContrast };
    case "bottle":
      return { base: colors.bottle, active: colors.bottle, contrast: colors.accentContrast };
    case "neutral":
      return { base: colors.surfaceRaised, active: colors.border, contrast: colors.textPrimary };
    case "danger":
      return { base: colors.danger, active: colors.danger, contrast: colors.accentContrast };
    case "accent":
    default:
      return { base: colors.accent, active: colors.accent, contrast: colors.accentContrast };
  }
}

const styles = StyleSheet.create({
  icon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
});

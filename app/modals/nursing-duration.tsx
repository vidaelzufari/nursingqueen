import { Screen } from "@/components/Screen";
import { goBackOrHome } from "@/navigation/back";
import { ScreenBack } from "@/components/ScreenBack";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import { format, parse, isValid } from "date-fns";
import { DateTimeField } from "@/components/DateTimeField";
import { NursingSide } from "@/db/types";
import { EntryHeading } from "@/components/EntryHeading";
import { Icon } from "@/components/Icon";
import { Button } from "@/components";
import { useLogStore } from "@/store/useLogStore";

const PRESET_MINUTES = [5, 10, 15, 20];

/** Quick durations or exact local start/end times for a forgotten feed. */
export default function NursingDurationModal() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const logNursingPreset = useLogStore((s) => s.logNursingPreset);

  const logNursingAt = useLogStore(s => s.logNursingAt);
  const babyId = useLogStore(s => s.babyId);
  const [exact, setExact] = useState(false);
  const [from, setFrom] = useState(() => format(new Date(Date.now() - 15 * 60000), "yyyy-MM-dd HH:mm"));
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd HH:mm"));
  const [side, setSide] = useState<NursingSide>("unknown");
  const [error, setError] = useState(false);
  const committed = useRef(false);
  const started = parse(from, "yyyy-MM-dd HH:mm", new Date());
  const ended = parse(to, "yyyy-MM-dd HH:mm", new Date());
  const valid = isValid(started) && isValid(ended) && started < ended && ended.getTime() <= Date.now();
  const handleExact = () => {
    if (!babyId) { router.push("/profile/edit"); return; }
    if (!valid || committed.current) return;
    committed.current = true;
    try { logNursingAt(started, ended, side); goBackOrHome(router); }
    catch { committed.current = false; setError(true); }
  };
  const handlePreset = (minutes: number) => {
    if (!babyId) { router.push("/profile/edit"); return; }
    if (committed.current) return;
    committed.current = true;
    logNursingPreset(minutes);
    goBackOrHome(router);
  };

  return (
    <Screen>
      <ScreenBack dismiss /> 
      <EntryHeading title={t("home.chooseDuration")} icon="heart" color={theme.colors.nursing} />
      {!exact ? <><Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("manualNursing.quickHint")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {PRESET_MINUTES.map((minutes) => (
          <Button
            key={minutes}
            testID={`nursing-duration-preset-${minutes}`}
            label={t("home.durationPreset", { minutes })}
            tone="nursing"
            variant="soft"
            onPress={() => handlePreset(minutes)}
            style={{ flexBasis: "29%", flexGrow: 1, minHeight: 72, paddingHorizontal: 8, borderRadius: theme.radii.md }}
          />
        ))}
      </View>
      </> : <View style={{ gap: 16 }}>
        <DateTimeField label={t("manualNursing.started")} value={from} onChange={setFrom} />
        <DateTimeField label={t("manualNursing.ended")} value={to} onChange={setTo} />
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>{t("manualNursing.hint")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{(["left", "right", "both", "unknown"] as const).map(value => <Button key={value} label={t(`manualNursing.${value}`)} tone="nursing" variant={side === value ? "soft" : "ghost"} active={side === value} onPress={() => setSide(value)} style={{ paddingHorizontal: 16, minHeight: 46 }} />)}</View>
        {valid ? <Text style={[theme.type.bodyStrong, { color: theme.colors.accent }]}>{t("manualNursing.duration", { minutes: Math.round((ended.getTime() - started.getTime()) / 60000) })}</Text> : <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("manualNursing.invalid")}</Text>}
        {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{t("manualNursing.failed")}</Text> : null}
        <Button label={t("common.save")} disabled={!valid} icon={<Icon name="check" size={18} color={theme.colors.accentContrast} />} onPress={handleExact} />
      </View>}
      <Button label={t(exact ? "manualNursing.quick" : "manualNursing.exact")} tone="neutral" variant="outline" onPress={() => setExact(!exact)} />
      </Screen>
  );
}

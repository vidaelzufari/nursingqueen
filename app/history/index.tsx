import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, EntryRow, EntryKind } from "@/components";
import { Icon } from "@/components/Icon";
import { useSleepStore } from "@/store/useSleepStore";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatVolume } from "@/domain/units";
import { formatDurationShort } from "@/domain/dateMath";

interface HistoryRow {
  id: string;
  kind: EntryKind;
  at: Date;
  title: string;
  detailLabel?: string;
  needsDetail: boolean;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.unit);

  const sleepSessions = useSleepStore(s => s.sessions);
  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);

  const rows = useMemo<HistoryRow[]>(() => {
    const nursingRows: HistoryRow[] = nursingSessions.map((s) => ({
      id: s.id,
      kind: "nursing",
      at: new Date(s.startedAt),
      title: s.side === "unknown" ? t("history.nursingTitle") : t("history.nursingTitleWithSide", { side: s.side }),
      detailLabel: s.durationSeconds != null ? formatDurationShort(Math.round(s.durationSeconds / 60)) : undefined,
      needsDetail: false,
    }));
    const pumpRows: HistoryRow[] = pumpEvents.map((p) => ({
      id: p.id,
      kind: "pump",
      at: new Date(p.startedAt),
      title: t("history.pumpTitle"),
      detailLabel: p.totalMl != null ? formatVolume(p.totalMl, unit) : undefined,
      needsDetail: p.needsDetail,
    }));
    const bottleRows: HistoryRow[] = bottleEvents.map((b) => ({
      id: b.id,
      kind: "bottle",
      at: new Date(b.occurredAt),
      title: b.milkType === "breast_milk" ? t("history.bottleTitleBreastMilk") : t("history.bottleTitleFormula"),
      detailLabel: b.ml != null ? formatVolume(b.ml, unit) : undefined,
      needsDetail: b.ml == null,
    }));
    const sleepRows: HistoryRow[] = sleepSessions.map(s => ({ id: s.id, kind: "sleep", at: new Date(s.startedAt), title: t("sleep.title"), detailLabel: s.endedAt ? formatDurationShort(Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)) : t("sleep.sleeping"), needsDetail: false }));
    return [...nursingRows, ...pumpRows, ...bottleRows, ...sleepRows].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [nursingSessions, pumpEvents, bottleEvents, sleepSessions, unit, t]);

  return (
    <AppShell>
      <View style={{ padding: theme.spacing.md, paddingBottom: 8, paddingTop: 24 }}>
        <Text style={[theme.type.title, { color: theme.colors.textPrimary }]}>{t("history.title")}</Text>
        <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: 6 }]}>{t("design.historyBody")}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.accent, marginTop: 8 }]}>{t("details.editHint")}</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 28, paddingTop: 60, gap: 16 }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: theme.colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}><Icon name="history" size={36} color={theme.colors.accent} /></View>
            <Text style={[theme.type.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>{t("design.historyEmpty")}</Text>
            <Text style={[theme.type.body, { color: theme.colors.textSecondary, textAlign: "center" }]}>{t("design.historyHint")}</Text>
            <Button label={t("design.logFeed")} icon={<Icon name="plus" color={theme.colors.accentContrast} size={18} />} onPress={() => router.push("/")} />
          </View>
        }
        renderItem={({ item, index }) => (
          <EntryRow
            kind={item.kind}
            title={item.title}
            timeLabel={format(item.at, "PPp")}
            detailLabel={item.detailLabel}
            needsDetail={item.needsDetail}
            needsDetailLabel={t("history.needsMl")}
            onPress={() => item.kind === "sleep" ? router.push({ pathname: "/sleep", params: { id: item.id } }) : router.push(`/entry/${item.kind}/${item.id}`)}
            testID={index === 0 ? "history-entry-row-0" : `history-entry-row-${index}`}
          />
        )}
      />
    </AppShell>
  );
}

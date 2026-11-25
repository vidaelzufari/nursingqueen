import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import { EmptyState } from "@/components/EmptyState";
import { dateLocale } from "@/domain/dateLocale";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AppShell } from "@/navigation/AppShell";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, EntryRow, EntryKind } from "@/components";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { useSleepStore } from "@/store/useSleepStore";
import { useLogStore } from "@/store/useLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatVolume } from "@/domain/units";

interface HistoryRow {
  id: string;
  kind: EntryKind;
  at: Date;
  title: string;
  detailLabel?: string;
  needsDetail: boolean;
  note?: string | null;
}

export default function HistoryScreen() {
  const formatDurationShort = useDurationFormatter();
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n?.resolvedLanguage ?? i18n?.language);
  const [filter, setFilter] = useState<EntryKind | "all">("all");
  const [query, setQuery] = useState("");
  const unit = useSettingsStore((s) => s.unit);

  const sleepSessions = useSleepStore(s => s.sessions);
  const nursingSessions = useLogStore((s) => s.nursingSessions);
  const pumpEvents = useLogStore((s) => s.pumpEvents);
  const bottleEvents = useLogStore((s) => s.bottleEvents);

  const rows = useMemo<HistoryRow[]>(() => {
    const nursingRows: HistoryRow[] = nursingSessions.map((s) => ({
      id: s.id,
      kind: "nursing", note: s.note,
      at: new Date(s.startedAt),
      title: s.side === "unknown" ? t("history.nursingTitle") : t("history.nursingTitleWithSide", { side: s.side }),
      detailLabel: [s.durationSeconds != null ? formatDurationShort(Math.round(s.durationSeconds / 60)) : null, s.milkMl != null ? formatVolume(s.milkMl, unit) : null].filter(Boolean).join(" · ") || undefined,
      needsDetail: false,
    }));
    const pumpRows: HistoryRow[] = pumpEvents.map((p) => ({
      id: p.id,
      kind: "pump", note: p.note,
      at: new Date(p.startedAt),
      title: t("history.pumpTitle"),
      detailLabel: p.totalMl != null ? formatVolume(p.totalMl, unit) : undefined,
      needsDetail: p.needsDetail,
    }));
    const bottleRows: HistoryRow[] = bottleEvents.map((b) => ({
      id: b.id,
      kind: "bottle", note: b.note,
      at: new Date(b.occurredAt),
      title: b.milkType === "breast_milk" ? t("history.bottleTitleBreastMilk") : t("history.bottleTitleFormula"),
      detailLabel: b.ml != null ? formatVolume(b.ml, unit) : undefined,
      needsDetail: b.ml == null,
    }));
    const sleepRows: HistoryRow[] = sleepSessions.map(s => ({ id: s.id, kind: "sleep", at: new Date(s.startedAt), title: t("sleep.title"), detailLabel: s.endedAt ? formatDurationShort(Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)) : t("sleep.sleeping"), needsDetail: false }));
    return [...nursingRows, ...pumpRows, ...bottleRows, ...sleepRows].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [nursingSessions, pumpEvents, bottleEvents, sleepSessions, unit, t, formatDurationShort]);

  const filtered = rows.filter(row => (filter === "all" || row.kind === filter) && `${row.title} ${row.note ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return (
    <AppShell>
      <View style={{ padding: theme.spacing.lg, paddingBottom: 8, paddingTop: 24, gap: 14 }}>
        <PageHeader title={t("history.title")} subtitle={t("refresh.historySubtitle")} action={<Button label={t("refresh.add")} icon={<Icon name="plus" color={theme.colors.accentContrast} size={16} />} onPress={() => router.push("/")} style={{ minHeight: 44, paddingHorizontal: 12 }} />} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(["all", "nursing", "pump", "bottle", "sleep"] as const).map(kind => <Pressable key={kind} accessibilityRole="button" accessibilityState={{ selected: filter === kind }} onPress={() => setFilter(kind)} style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: filter === kind ? theme.colors.accent : theme.colors.surface, borderWidth: 1, borderColor: filter === kind ? theme.colors.accent : theme.colors.border }}><Text style={[theme.type.bodyStrong, { color: filter === kind ? theme.colors.accentContrast : theme.colors.textSecondary }]}>{t(kind === "all" ? "refresh.all" : `refresh.${kind === "nursing" ? "feed" : kind}`)}</Text></Pressable>)}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}><Icon name="search" size={20} color={theme.colors.textMuted} /><TextInput accessibilityLabel={t("refresh.search")} placeholder={t("refresh.search")} placeholderTextColor={theme.colors.textMuted} value={query} onChangeText={setQuery} style={[theme.type.body, { color: theme.colors.textPrimary, flex: 1, minWidth: 0, minHeight: 48, paddingVertical: 12 }]} /></View>
      </View>
      <FlatList contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <EmptyState icon="history" title={t(rows.length ? "refresh.emptySearch" : "design.historyEmpty")} message={t(rows.length ? "refresh.emptySearchHint" : "design.historyHint")} actionLabel={t("refresh.addSession")} onAction={() => router.push("/")} />
        }
        renderItem={({ item, index }) => (
          <EntryRow
            kind={item.kind}
            title={item.title}
            timeLabel={format(item.at, "PPp", { locale })}
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

import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useLogStore } from "@/store/useLogStore";
import { useSleepStore } from "@/store/useSleepStore";
import { useActiveBaby } from "@/store/useBabyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { normalizeHomeActivities } from "@/domain/homePreferences";
import { evaluateForecast, projectFeedWindows, projectSleepWindows } from "@/domain/forecast";
import { getSleepInsights } from "@/domain/sleepInsights";
import { dateLocale } from "@/domain/dateLocale";
import { Card } from "./Card";
import { Icon } from "./Icon";

export function RoutineOutlook({now,compact=false}:{now:Date;compact?:boolean}) {
 const {t,i18n}=useTranslation(),theme=useTheme(),router=useRouter();
 const nursingSessions=useLogStore(s=>s.nursingSessions),bottleEvents=useLogStore(s=>s.bottleEvents);
 const sleep=useSleepStore(s=>s.sessions), baby=useActiveBaby();
 const selected=normalizeHomeActivities(useSettingsStore(s=>s.homeActivities));
 const times=[...(selected.includes("nursing")?nursingSessions.filter(s=>s.endedAt&&(s.durationSeconds??0)>0).map(s=>new Date(s.startedAt)):[]),...(selected.includes("bottle")?bottleEvents.map(s=>new Date(s.occurredAt)):[])];
 const insight=getSleepInsights(sleep,now,baby?.dateOfBirth);
 const feedRunning=selected.includes("nursing")&&nursingSessions.some(s=>!s.endedAt);
 const feed=feedRunning?[]:projectFeedWindows(times,now);
 const naps=selected.includes("sleep")?projectSleepWindows(sleep,insight.forecast,now):[];
 const rows=[...feed.map(f=>({...f,kind:"feed" as const})),...naps.map(f=>({...f,kind:"sleep" as const}))].sort((a,b)=>a.at.getTime()-b.at.getTime());
 const evidence=evaluateForecast(times);
 const locale=dateLocale(i18n?.resolvedLanguage??i18n?.language);
 return <View style={{gap:12}}>
  <View style={{flexDirection:"row",alignItems:"center",gap:8}}><Icon name="sparkles" color={theme.colors.accent}/><Text style={[theme.type.subtitle,{color:theme.colors.textPrimary,flex:1}]}>{t("day.outlook")}</Text></View>
  <Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.outlookHint")}</Text>
  {rows.length?rows.slice(0,compact?3:6).map(row=><Pressable key={`${row.kind}-${row.step}`} accessibilityRole="button" onPress={()=>router.push(row.kind==="sleep"?"/sleep":"/history")}>
   <Card style={{flexDirection:"row",alignItems:"center",gap:14,backgroundColor:theme.colors.surfaceRaised}}>
    <Icon name={row.kind==="sleep"?"moon":"heart"} color={row.kind==="sleep"?theme.colors.sleep:theme.colors.nursing}/>
    <View style={{flex:1,gap:4}}><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t(row.kind==="sleep"?"forecast.sleep":"forecast.feed")} · {t(row.step===1?"day.estimate":"day.tentative")}</Text>
     <Text style={[theme.type.body,{color:theme.colors.textPrimary}]}>{format(row.earliest,isSameDay(row.at,now)?"p":"EEE p",{locale})} – {format(row.latest,"p",{locale})}</Text>
     <Text style={[theme.type.micro,{color:theme.colors.textSecondary}]}>{t("predictions.evidence",{count:row.samples})}</Text>
    </View>
   </Card>
  </Pressable>):<Card><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t(feedRunning||sleep.some(s=>!s.endedAt)?"day.runningHint":"refresh.learning")}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary,marginTop:6}]}>{t("day.learningHint")}</Text></Card>}
  {!compact?<Card style={{gap:8}}><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("day.learned")}</Text>
   {selected.includes("sleep")?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.completedSleeps",{count:insight.completedSessions})} · {t("day.loggedDays",{count:insight.loggedDays})}</Text>:null}
   {selected.includes("sleep")&&insight.completedSessions>0?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t(insight.method==="adaptive"?"day.adaptive":"day.baseline")}</Text>:null}
   {selected.includes("nursing")||selected.includes("bottle")?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.feedEvidence",{count:times.length})}</Text>:null}
   {evidence.samples>=3?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.feedError",{minutes:Math.round(evidence.meanAbsoluteErrorMinutes!),count:evidence.samples})}</Text>:null}
   <Text style={[theme.type.micro,{color:theme.colors.textSecondary}]}>{t("day.localLearning")}</Text>
  </Card>:null}
  <Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("day.forecastNote")}</Text>
 </View>;
}

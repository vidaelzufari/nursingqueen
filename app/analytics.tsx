import React,{useEffect,useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {addDays,format,isSameDay,startOfDay} from "date-fns";
import {useTranslation} from "react-i18next";
import {AppShell} from "@/navigation/AppShell";
import {WeeklySummary} from "@/components/WeeklySummary";
import {RoutineOutlook} from "@/components/RoutineOutlook";
import {DayTimeline} from "@/components/DayTimeline";
import {PageHeader} from "@/components/PageHeader";
import {Icon,IconName} from "@/components/Icon";
import {Card} from "@/components";
import {useTheme} from "@/theme/ThemeProvider";
import {useLogStore} from "@/store/useLogStore";
import {useSleepStore} from "@/store/useSleepStore";
import {useMomentStore} from "@/store/useMomentStore";
import {useFoodStore} from "@/store/useFoodStore";
import {useSettingsStore} from "@/store/useSettingsStore";
import {normalizeHomeActivities} from "@/domain/homePreferences";
import {summarizeDay} from "@/domain/daySummary";
import {formatVolume} from "@/domain/units";
import {useDurationFormatter} from "@/i18n/useDurationFormatter";
import {dateLocale} from "@/domain/dateLocale";
export default function AnalyticsScreen(){
 const theme=useTheme(),{t,i18n}=useTranslation(),duration=useDurationFormatter();
 const [now,setNow]=useState(new Date()),[selectedDate,setSelectedDate]=useState<Date|null>(null);
 const day=selectedDate??now;
 const {nursingSessions,pumpEvents,bottleEvents}=useLogStore(),sleep=useSleepStore(s=>s.sessions),meals=useFoodStore(s=>s.meals);
 const unit=useSettingsStore(s=>s.unit),activities=normalizeHomeActivities(useSettingsStore(s=>s.homeActivities));
 const moments=useMomentStore(s=>s.moments);
 const data=summarizeDay(day,now,activities.includes("nursing")?nursingSessions:[],activities.includes("bottle")?bottleEvents:[],activities.includes("pump")?pumpEvents:[],activities.includes("sleep")?sleep:[],activities.includes("solids")?meals:[],moments);
 const locale=dateLocale(i18n.resolvedLanguage??i18n.language);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 const summaryParts=[
  activities.includes("nursing")||activities.includes("bottle")?t("day.summaryFeeds",{count:data.feeds}):null,
  activities.includes("sleep")?t("day.summarySleep",{time:duration(Math.round(data.napMinutes+data.nightMinutes))}):null,
  activities.includes("solids")?t("day.summaryMeals",{count:data.meals}):null,
  activities.includes("pump")?t("day.summaryPumped",{volume:formatVolume(data.pumpMl,unit)}):null,
 ].filter(Boolean);
 const tiles:{key:string;value:string;icon:IconName;color:string;detail?:string}[]=[];
 if(activities.includes("nursing")||activities.includes("bottle"))tiles.push({key:"day.feeds",value:String(data.feeds),icon:"heart",color:theme.colors.nursing,detail:activities.includes("nursing")?t("day.nursingDetail",{time:duration(Math.round(data.nursingMinutes))}):undefined});
 if(activities.includes("sleep"))tiles.push({key:"day.sleepTotal",value:duration(Math.round(data.napMinutes+data.nightMinutes)),icon:"moon",color:theme.colors.sleep,detail:t("day.sleepDetail",{nap:duration(Math.round(data.napMinutes)),night:duration(Math.round(data.nightMinutes))})});
 if(activities.includes("bottle"))tiles.push({key:"day.bottleMilk",value:formatVolume(data.bottleMl,unit),icon:"bottle",color:theme.colors.bottle});
 if(activities.includes("pump"))tiles.push({key:"day.pumped",value:formatVolume(data.pumpMl,unit),icon:"pump",color:theme.colors.pumping});
 if(activities.includes("solids")&&tiles.length<4)tiles.push({key:"day.meals",value:String(data.meals),icon:"solids",color:theme.colors.nap});
 return <AppShell><ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={{padding:24,gap:20,paddingBottom:32}}>
  <PageHeader title={t("day.title")} subtitle={t("day.subtitle")}/>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
   <Pressable accessibilityRole="button" accessibilityLabel={t("day.previous")} onPress={()=>setSelectedDate(addDays(startOfDay(day),-1))} style={{padding:12,borderRadius:22,backgroundColor:theme.colors.surface}}><Icon name="back" color={theme.colors.textPrimary}/></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={t("day.backToday")} onPress={()=>setSelectedDate(null)}><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{isSameDay(day,now)?t("day.today"):format(day,"EEE d MMM",{locale})}</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={t("day.next")} disabled={isSameDay(day,now)} onPress={()=>setSelectedDate(addDays(startOfDay(day),1))} style={{padding:12,borderRadius:22,backgroundColor:theme.colors.surface,opacity:isSameDay(day,now)?.3:1}}><Icon name="arrow" color={theme.colors.textPrimary}/></Pressable>
  </View>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>{tiles.map(tile=><Card key={tile.key} style={{flexBasis:"44%",flexGrow:1,padding:16,gap:4}}><Icon name={tile.icon} color={tile.color}/><Text style={[theme.type.title,{color:theme.colors.textPrimary,fontSize:24}]}>{tile.value}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t(tile.key)}</Text>{tile.detail?<Text style={[theme.type.micro,{color:theme.colors.textSecondary}]}>{tile.detail}</Text>:null}</Card>)}</View>
  <Text style={[theme.type.micro,{color:theme.colors.textSecondary}]}>{t("day.loggedOnly")}</Text>
  <Card style={{gap:8,backgroundColor:theme.colors.surfaceRaised}}><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("day.summaryTitle")}</Text><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{summaryParts.join(" · ")}</Text></Card>
  <DayTimeline events={data.events} day={day}/>
  <WeeklySummary now={now} activities={activities} selectedDay={day} onSelectDay={setSelectedDate}/>
  {activities.some(key=>key==="nursing"||key==="bottle"||key==="sleep")?<RoutineOutlook now={now}/>:null}
 </ScrollView></AppShell>;
}

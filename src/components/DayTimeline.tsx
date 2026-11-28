import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { format, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useDurationFormatter } from "@/i18n/useDurationFormatter";
import { DayEvent, DayEventKind } from "@/domain/daySummary";
import { foodName } from "@/domain/foods";
import { formatVolume } from "@/domain/units";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useFoodStore } from "@/store/useFoodStore";
import { Icon, IconName } from "./Icon";
import { profilePhotoUri } from "@/services/profilePhoto";
import { Card } from "./Card";
const icons:Record<DayEventKind,IconName>={nursing:"heart",bottle:"bottle",pump:"pump",nap:"nap",night:"moon",solids:"solids",moment:"sparkles"};
const labels:Record<DayEventKind,string>={nursing:"refresh.feed",bottle:"home.bottle",pump:"refresh.pump",nap:"sleep.nap",night:"sleep.night",solids:"solids.title",moment:"moments.title"};
export function DayTimeline({events,day}:{events:DayEvent[];day:Date}) {
 const theme=useTheme(),{t,i18n}=useTranslation(),router=useRouter(),duration=useDurationFormatter();
 const unit=useSettingsStore(s=>s.unit),foods=useFoodStore(s=>s.foods);
 return <Card style={{gap:4}}>
  <Text style={[theme.type.subtitle,{color:theme.colors.textPrimary,marginBottom:12}]}>{t("day.timeline")}</Text>
  {!events.length?<Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("day.empty")}</Text>:events.map((event,index)=>{
   const color=event.kind==="nap"?theme.colors.nap:event.kind==="night"?theme.colors.sleep:event.kind==="bottle"?theme.colors.bottle:event.kind==="pump"?theme.colors.pumping:event.kind==="solids"?theme.colors.nap:theme.colors.nursing;
   const title=event.kind==="moment"?event.title:event.kind==="solids"?event.foodIds?.map(id=>foodName(foods.find(f=>f.id===id)??{id},i18n.resolvedLanguage??i18n.language)).join(", "):t(labels[event.kind]);
   return <Pressable key={`${event.kind}-${event.id}`} accessibilityRole="button" accessibilityLabel={`${format(event.at,"p")} ${title}`} onPress={()=>router.push(event.route)} style={{flexDirection:"row",gap:12,minHeight:88}}>
    <View style={{width:48,alignItems:"center"}}><View style={{width:44,height:44,borderRadius:16,backgroundColor:color+"16",alignItems:"center",justifyContent:"center"}}>{event.photoUri?<Image source={{uri:profilePhotoUri(event.photoUri)!}} accessibilityLabel={event.title} style={{width:44,height:44,borderRadius:16}}/>:<Icon name={icons[event.kind]} color={color} size={23}/>}</View>{index<events.length-1?<View style={{width:2,flex:1,minHeight:22,backgroundColor:theme.colors.border,marginVertical:4}}/>:null}</View>
    <View style={{flex:1,paddingBottom:16,gap:3}}><Text style={[theme.type.micro,{color:theme.colors.textSecondary}]}>{format(event.at,"p")}{!isSameDay(event.at,day)?` · ${t("day.previousDay")}`:""}{event.end?` – ${format(event.end,"p")}`:""}</Text><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{title}</Text>
     <Text style={[theme.type.caption,{color:event.running?color:theme.colors.textSecondary}]}>{event.running?t("forecast.active"):[event.minutes!=null?duration(Math.round(event.minutes)):null,event.ml!=null?formatVolume(event.ml,unit):null].filter(Boolean).join(" · ")||t("day.recorded")}</Text>
    </View><Icon name="arrow" size={16} color={theme.colors.textMuted}/>
   </Pressable>;
  })}
 </Card>;
}

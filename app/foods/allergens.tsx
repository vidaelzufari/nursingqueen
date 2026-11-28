import React,{useEffect,useState} from "react";
import {Linking,Text,View} from "react-native";
import {format} from "date-fns";
import {useRouter} from "expo-router";
import {useTranslation} from "react-i18next";
import {Screen} from "@/components/Screen";
import {ScreenBack} from "@/components/ScreenBack";
import {Card,Button} from "@/components";
import {ListRow} from "@/components/ListRow";
import {Icon} from "@/components/Icon";
import {FoodPhoto} from "@/components/FoodPhoto";
import {AllergenId,allergenChecklist} from "@/domain/allergens";
import {foodName} from "@/domain/foods";
import {dateLocale} from "@/domain/dateLocale";
import {useFoodStore} from "@/store/useFoodStore";
import {useActiveBaby} from "@/store/useBabyStore";
import {useTheme} from "@/theme/ThemeProvider";
export default function AllergenChecklist(){
 const {t,i18n}=useTranslation(),theme=useTheme(),router=useRouter(),baby=useActiveBaby();
 const foods=useFoodStore(s=>s.foods),refresh=useFoodStore(s=>s.refresh);
 const [expanded,setExpanded]=useState<AllergenId|null>(null);
 useEffect(()=>{if(baby)refresh(baby.id);},[baby?.id,refresh]); // eslint-disable-line react-hooks/exhaustive-deps
 const rows=allergenChecklist(foods),language=i18n.resolvedLanguage??i18n.language,locale=dateLocale(language);
 return <Screen><ScreenBack/><Text style={[theme.type.display,{color:theme.colors.textPrimary}]}>{t("allergens.title")}</Text>
  <Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("allergens.intro")}</Text>
  {!baby?<Button label={t("profile.addBaby")} onPress={()=>router.push("/profile/edit")}/>:<>
  <Card style={{gap:8,backgroundColor:theme.colors.surfaceRaised}}><Text style={[theme.type.bodyStrong,{color:theme.colors.accent}]}>{t("allergens.progress",{count:rows.filter(row=>row.logged.length).length,total:rows.length})}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("allergens.recordMeaning")}</Text></Card>
  <Card padded={false} style={{paddingHorizontal:16}}>{rows.map((row,index)=><View key={row.id}>
   <ListRow testID={`allergen-group-${row.id}`} title={t(`allergens.groups.${row.id}`)} subtitle={t(row.logged.length?"allergens.recorded":"allergens.notRecorded")} divider={index>0} leading={<View style={{width:30,height:30,borderRadius:10,borderWidth:1,borderColor:row.logged.length?theme.colors.accent:theme.colors.border,backgroundColor:row.logged.length?theme.colors.accent:"transparent",justifyContent:"center",alignItems:"center"}}>{row.logged.length?<Icon name="check" size={18} color={theme.colors.accentContrast}/>:null}</View>} onPress={()=>setExpanded(expanded===row.id?null:row.id)}/>
   {expanded===row.id?<View style={{gap:10,paddingBottom:16,paddingStart:12}}>
    {row.firstAt?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("solids.first")}: {format(new Date(row.firstAt),"PP",{locale})} · {t("solids.last")}: {format(new Date(row.lastAt!),"PP",{locale})}</Text>:null}
    {row.members.map(member=>{const food=foods.find(f=>f.id===member.id)!;return <ListRow key={food.id} testID={`allergen-food-${food.id}`} title={foodName(food,language)} subtitle={t(food.firstAt?"allergens.recorded":"allergens.notRecorded")} leading={<FoodPhoto id={food.catalogKey??food.id} uri={food.photoUri} label={foodName(food,language)} size={36}/>} onPress={()=>router.push({pathname:"/modals/meal-entry",params:{food:food.id}})}/>;})}
    <Button label={t("allergens.custom")} variant="soft" onPress={()=>router.push("/foods/custom")}/>
   </View>:null}
  </View>)}</Card>
  <Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("allergens.recipeHint")}</Text>
  <Button label={t("allergens.guidance")} variant="ghost" onPress={()=>void Linking.openURL("https://www.nhs.uk/baby/weaning-and-feeding/food-allergies-in-babies-and-young-children/")}/>
  </>}
 </Screen>;
}

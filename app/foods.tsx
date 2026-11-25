import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Screen } from "@/components/Screen";
import { ScreenBack } from "@/components/ScreenBack";
import { Card, Button } from "@/components";
import { Field } from "@/components/Field";
import { SelectField } from "@/components/SelectField";
import { ListRow } from "@/components/ListRow";
import { FoodPhoto } from "@/components/FoodPhoto";
import { useActiveBaby } from "@/store/useBabyStore";
import { useFoodStore } from "@/store/useFoodStore";
import { foodRepository } from "@/db/repositories/foodRepository";
import { FOOD_CATEGORIES, FOOD_CATALOG, foodName, matchesFood } from "@/domain/foods";
import { dateLocale } from "@/domain/dateLocale";
import { useTheme } from "@/theme/ThemeProvider";
export default function FoodsScreen(){
 const theme=useTheme();const {t,i18n}=useTranslation();const router=useRouter();const baby=useActiveBaby();const {foods,meals,refresh}=useFoodStore();
 const language=i18n.resolvedLanguage??i18n.language;const locale=dateLocale(language);
 const [limit,setLimit]=useState(30);
 const [tab,setTab]=useState<'catalog'|'planned'|'tasted'>('planned');const [query,setQuery]=useState('');const [category,setCategory]=useState('all');
 useEffect(()=>{if(baby)refresh(baby.id);},[baby?.id,refresh]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>setLimit(30),[tab,query,category]);
 const list=foods.filter(f=>(tab==='catalog'||tab==='planned'&&f.planned&&!f.firstAt||tab==='tasted'&&f.firstAt)&&matchesFood(f,query)&&(category==='all'||FOOD_CATALOG.find(c=>c.id===f.catalogKey)?.category===category)).sort((a,b)=>foodName(a,language).localeCompare(foodName(b,language),language));
 const when=(value:string)=>format(new Date(value),'PP',{locale});
 return <Screen><ScreenBack/><Text accessibilityRole="header" style={[theme.type.title,{color:theme.colors.textPrimary}]}>{t('solids.title')}</Text><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('solids.intro')}</Text>
 {!baby?<><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('setup.reason')}</Text><Button label={t('profile.addBaby')} onPress={()=>router.push({pathname:'/profile/edit',params:{intent:'solids'}})}/></>:<>
 <Button label={t('foodAI.title')} variant="soft" onPress={()=>router.push('/foods/scan')}/>
 <Button testID="foods-new-meal" label={t('solids.logMeal')} onPress={()=>router.push('/modals/meal-entry')}/>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{(['planned','tasted','catalog'] as const).map(key=><Button key={key} testID={`foods-tab-${key}`} label={t(`solids.${key}`)} active={tab===key} variant={tab===key?'soft':'ghost'} onPress={()=>setTab(key)} style={{flexGrow:1,paddingHorizontal:10}}/>)}</View>
 <Field testID="foods-search" label={t('solids.search')} value={query} onChangeText={setQuery} placeholder={t('solids.searchHint')}/>
 <SelectField label={t('solids.category')} value={category} options={['all',...FOOD_CATEGORIES].map(value=>({value,label:t(`solids.categories.${value}`)}))} onChange={setCategory}/>
 <Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t('solids.catalogCount',{count:FOOD_CATALOG.length})}</Text>
 {list.length?<Card padded={false} style={{paddingHorizontal:16}}>{list.slice(0,limit).map((food,index)=>{
 const name=foodName(food,language);return <ListRow key={food.id} testID={`food-${food.id}`} title={name} subtitle={food.firstAt?`${t('solids.first')}: ${when(food.firstAt)}\n${t('solids.last')}: ${when(food.lastAt!)}`:undefined} leading={<FoodPhoto id={food.catalogKey??food.id} uri={food.photoUri} label={name}/>} divider={index>0} onPress={tab==='planned'||tab==='tasted'?()=>router.push({pathname:'/modals/meal-entry',params:{food:food.id}}):undefined} trailing={tab==='catalog'?<Button compact label={t(food.firstAt?'solids.tasted':food.planned?'solids.planned':'solids.plan')} variant="soft" onPress={()=>{if(food.firstAt){router.push({pathname:'/modals/meal-entry',params:{food:food.id}});return;}foodRepository.plan(baby.id,food.id,!food.planned);refresh(baby.id);}}/>:undefined}/>;
 })}</Card>:<Card><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('solids.empty')}</Text>{tab==='planned'?<Button label={t('solids.browse')} variant="ghost" onPress={()=>setTab('catalog')}/>:null}</Card>}
 {list.length>limit?<Button label={t('solids.more')} variant="ghost" onPress={()=>setLimit(value=>value+30)}/>:null}
 <Button label={t('solids.custom')} variant="outline" onPress={()=>router.push({pathname:'/foods/custom',params:{name:query}})}/>
 {meals.length?<><Text style={[theme.type.subtitle,{color:theme.colors.textPrimary}]}>{t('solids.recent')}</Text><Card padded={false} style={{paddingHorizontal:16}}>{meals.slice(0,10).map((meal,index)=><ListRow key={meal.id} title={meal.foodIds.map(id=>foodName(foods.find(f=>f.id===id)??{id},language)).join(', ')} subtitle={format(new Date(meal.occurredAt),'PPp',{locale})} divider={index>0} onPress={()=>router.push({pathname:'/modals/meal-entry',params:{id:meal.id}})}/>)}</Card></>:null}
 <Button label={t('solids.photoCredits')} variant="ghost" onPress={()=>router.push('/foods/credits')}/>
 </>}
 </Screen>;
}

import React from "react";
import {Pressable,Text,View} from "react-native";
import {useTranslation} from "react-i18next";
import {ALLERGEN_GROUPS,AllergenId} from "@/domain/allergens";
import {useTheme} from "@/theme/ThemeProvider";
import {Icon} from "./Icon";
export function AllergenPicker({value,onChange}:{value:AllergenId[];onChange:(ids:AllergenId[])=>void}){
 const theme=useTheme(),{t}=useTranslation();return <View style={{gap:8}}><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("allergens.ingredients")}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("allergens.recipeHint")}</Text>
 {ALLERGEN_GROUPS.map(id=><Pressable key={id} testID={`allergen-pick-${id}`} accessibilityRole="checkbox" accessibilityState={{checked:value.includes(id)}} accessibilityLabel={t(`allergens.groups.${id}`)} onPress={()=>onChange(value.includes(id)?value.filter(item=>item!==id):[...value,id])} style={{flexDirection:"row",alignItems:"center",gap:12,minHeight:44}}><View style={{width:24,height:24,borderRadius:7,borderWidth:1,borderColor:theme.colors.accent,backgroundColor:value.includes(id)?theme.colors.accent:"transparent",alignItems:"center",justifyContent:"center"}}>{value.includes(id)?<Icon name="check" size={16} color={theme.colors.accentContrast}/>:null}</View><Text style={[theme.type.body,{color:theme.colors.textPrimary,flex:1}]}>{t(`allergens.groups.${id}`)}</Text></Pressable>)}
 </View>;
}

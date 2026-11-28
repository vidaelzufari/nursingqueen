import React from "react";
import {Text,View} from "react-native";
import {useTranslation} from "react-i18next";
import {AllergenFood,foodAllergens} from "@/domain/allergens";
import {useTheme} from "@/theme/ThemeProvider";
export function AllergenBadge({food}:{food:AllergenFood}){
 const theme=useTheme(),{t}=useTranslation();const groups=foodAllergens(food);if(!groups.length)return null;
 return <View accessibilityLabel={`${t("allergens.badge")}: ${groups.map(id=>t(`allergens.groups.${id}`)).join(", ")}`} style={{alignSelf:"flex-start",paddingHorizontal:8,paddingVertical:3,borderRadius:8,backgroundColor:theme.colors.accent+"12"}}><Text style={[theme.type.micro,{color:theme.colors.accent,fontWeight:"600"}]}>{t("allergens.badge")}</Text></View>;
}

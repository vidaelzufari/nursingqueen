import React, { useState } from "react";
import { Image, View } from "react-native";
import { FOOD_PHOTOS } from "@/assets/foodPhotos";
import { Icon } from "./Icon";
import { useTheme } from "@/theme/ThemeProvider";
export function FoodPhoto({ id, uri, label, size=64 }: {id:string;uri?:string|null;label:string;size?:number}) {
 const theme=useTheme();const [failed,setFailed]=useState(false);const source=uri?{uri}:FOOD_PHOTOS[id];
 return source&&!failed?<Image source={source} accessibilityLabel={label} resizeMode="cover" onError={()=>setFailed(true)} style={{width:size,height:size,borderRadius:16,backgroundColor:theme.colors.surfaceRaised}}/>:<View accessibilityLabel={label} style={{width:size,height:size,borderRadius:16,backgroundColor:theme.colors.surfaceRaised,alignItems:"center",justifyContent:"center"}}><Icon name="solids" color={theme.colors.nap} size={size/2}/></View>;
}

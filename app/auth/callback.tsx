import React,{useEffect,useState} from "react";
import {Text} from "react-native";
import {useLocalSearchParams,useRouter} from "expo-router";
import {useTranslation} from "react-i18next";
import {Screen} from "@/components/Screen";
import {Button} from "@/components";
import {useTheme} from "@/theme/ThemeProvider";
import {completeSocialSignIn} from "@/services/socialAuth";
export default function AuthCallback(){
 const {code,flow}=useLocalSearchParams<{code?:string;flow?:string}>(),router=useRouter(),{t}=useTranslation(),theme=useTheme(),[error,setError]=useState(false);
 useEffect(()=>{if(!code||!flow){setError(true);return;}void completeSocialSignIn(code,flow).then(()=>router.replace("/account")).catch(()=>setError(true));},[code,flow,router]);
 return <Screen><Text style={[theme.type.body,{color:theme.colors.textPrimary}]}>{t(error?"account.error":"account.connecting")}</Text>{error?<Button label={t("common.back")} onPress={()=>router.replace("/account")}/>:null}</Screen>;
}

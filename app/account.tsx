import React,{useEffect,useState} from "react";
import {Text} from "react-native";
import {useTranslation} from "react-i18next";
import {useTheme} from "@/theme/ThemeProvider";
import {Screen} from "@/components/Screen";
import {ScreenBack} from "@/components/ScreenBack";
import {Button,Card} from "@/components";
import {AccountSession,currentAccount,socialSignInConfigured,signInWithProvider,signOutAccount,SocialProvider} from "@/services/socialAuth";
export default function AccountScreen(){
 const {t}=useTranslation(),theme=useTheme();const [account,setAccount]=useState<AccountSession|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{void currentAccount().then(setAccount).catch(()=>setError(true));},[]);
 const signIn=async(provider:SocialProvider)=>{setBusy(true);setError(false);try{const session=await signInWithProvider(provider);if(session)setAccount(session);}catch{setError(true);}finally{setBusy(false);}};
 return <Screen><ScreenBack/><Text style={[theme.type.display,{color:theme.colors.textPrimary}]}>{t("account.title")}</Text><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("account.optional")}</Text><Card style={{gap:16}}>
  {account?<><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{account.email??t("account.connected")}</Text><Button label={t("account.signOut")} disabled={busy} variant="soft" onPress={()=>{setBusy(true);void signOutAccount().then(()=>setAccount(null)).catch(()=>setError(true)).finally(()=>setBusy(false));}}/></>:<>
   {!socialSignInConfigured()?<Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("account.setup")}</Text>:null}
   <Button label={t("account.apple")} variant="outline" disabled={busy||!socialSignInConfigured()} onPress={()=>void signIn("apple")}/>
   <Button label={t("account.google")} variant="outline" disabled={busy||!socialSignInConfigured()} onPress={()=>void signIn("google")}/>
  </>}
  {error?<Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t("account.error")}</Text>:null}
 </Card><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("account.local")}</Text></Screen>;
}

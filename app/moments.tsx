import React,{useEffect,useRef,useState} from "react";
import {Alert,Image,Platform,Pressable,Text} from "react-native";
import {format,parse} from "date-fns";
import {useLocalSearchParams,useRouter} from "expo-router";
import {useTranslation} from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import {Screen} from "@/components/Screen";
import {ScreenBack} from "@/components/ScreenBack";
import {Button,Card} from "@/components";
import {Field} from "@/components/Field";
import {DateTimeField} from "@/components/DateTimeField";
import {Icon} from "@/components/Icon";
import {SelectField} from "@/components/SelectField";
import {useTheme} from "@/theme/ThemeProvider";
import {useActiveBaby} from "@/store/useBabyStore";
import {useMomentStore} from "@/store/useMomentStore";
import {MOMENT_KINDS,MomentKind,momentRepository} from "@/db/repositories/momentRepository";
import {persistProfilePhoto,profilePhotoUri} from "@/services/profilePhoto";
const DATE_FORMAT="yyyy-MM-dd HH:mm";
export default function MomentsScreen(){
 const theme=useTheme(),{t}=useTranslation(),router=useRouter(),baby=useActiveBaby();
 const loadedId=useRef<string|undefined>();
 const {id}=useLocalSearchParams<{id?:string}>();
 const moments=useMomentStore(s=>s.moments),refresh=useMomentStore(s=>s.refresh);
 const [editing,setEditing]=useState(Boolean(id)),[entryId,setEntryId]=useState<string|undefined>(id);
 const [kind,setKind]=useState<MomentKind>("tooth"),[title,setTitle]=useState(""),[date,setDate]=useState(format(new Date(),DATE_FORMAT)),[note,setNote]=useState(""),[photo,setPhoto]=useState<string|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{if(baby)refresh(baby.id);},[baby?.id,refresh]); // eslint-disable-line react-hooks/exhaustive-deps
 const open=(momentId?:string)=>{
  const m=moments.find(m=>m.id===momentId);setEntryId(m?.id);setKind(m?.kind??"tooth");setTitle(m?.title??"");setDate(format(m?new Date(m.occurredAt):new Date(),DATE_FORMAT));setNote(m?.note??"");setPhoto(m?.photoUri??null);setError(false);setEditing(true);
 };
 useEffect(()=>{if(id&&loadedId.current!==id&&moments.some(m=>m.id===id)){loadedId.current=id;open(id);}},[id,moments]); // eslint-disable-line react-hooks/exhaustive-deps
 const pick=async()=>{setBusy(true);try{
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setError(true);return;}
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,quality:0.85,base64:Platform.OS==="web"});
  if(!result.canceled&&result.assets[0])setPhoto(await persistProfilePhoto(result.assets[0].uri,result.assets[0].base64));
 }catch{setError(true);}finally{setBusy(false);}};
 const save=()=>{if(!baby){router.push("/profile/edit");return;}try{
  const at=parse(date,DATE_FORMAT,new Date());
  momentRepository.save(baby.id,{id:entryId,kind,title:title||t(`moments.${kind}`),occurredAt:at,note,photoUri:photo});
  refresh(baby.id);setEditing(false);setEntryId(undefined);setError(false);
 }catch{setError(true);}};
 return <Screen footer={editing?<Button label={t("common.save")} testID="moment-save" disabled={busy} onPress={save}/>:undefined}>
  <ScreenBack/><Text style={[theme.type.display,{color:theme.colors.textPrimary}]}>{t("moments.title")}</Text>
  <Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t("moments.subtitle")}</Text>
  {editing?<>
   <SelectField label={t("moments.kind")} value={kind} options={MOMENT_KINDS.map(value=>({value,label:t(`moments.${value}`)}))} onChange={setKind}/>
   <Card style={{gap:16}}>{photo?<Image source={{uri:profilePhotoUri(photo)!}} accessibilityLabel={t("moments.photo")} style={{width:"100%",height:240,borderRadius:20}}/>:null}<Button label={t(photo?"moments.changePhoto":"moments.addPhoto")} variant="soft" icon={<Icon name="photo" color={theme.colors.accent}/>} disabled={busy} onPress={()=>void pick()}/>{photo?<Button label={t("moments.removePhoto")} variant="ghost" onPress={()=>setPhoto(null)}/>:null}</Card>
   <Field label={t("moments.caption")} value={title} onChangeText={setTitle} placeholder={t(`moments.${kind}`)} maxLength={100}/>
   <DateTimeField label={t("moments.date")} value={date} onChange={setDate}/>
   <Field label={t("moments.note")} value={note} onChangeText={setNote} multiline maxLength={2000}/>
   {error?<Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t("moments.error")}</Text>:null}
   <Button label={t("common.cancel")} variant="ghost" onPress={()=>setEditing(false)}/>
   {entryId?<Button label={t("common.delete")} tone="danger" variant="ghost" onPress={()=>Alert.alert(t("moments.delete"),undefined,[{text:t("common.cancel"),style:"cancel"},{text:t("common.delete"),style:"destructive",onPress:()=>{if(baby){momentRepository.remove(baby.id,entryId);refresh(baby.id);setEditing(false);}}}])}/>:null}
  </>:<>
   <Button label={t("moments.add")} onPress={()=>open()} icon={<Icon name="plus" color={theme.colors.accentContrast}/>}/>
   {!moments.length?<Card style={{gap:12}}><Icon name="sparkles" color={theme.colors.accent} size={32}/><Text style={[theme.type.bodyStrong,{color:theme.colors.textPrimary}]}>{t("moments.empty")}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("moments.noPressure")}</Text></Card>:moments.map(m=><Pressable accessibilityRole="button" key={m.id} onPress={()=>open(m.id)}><Card style={{gap:14}}>{m.photoUri?<Image accessibilityLabel={m.title} source={{uri:profilePhotoUri(m.photoUri)!}} style={{width:"100%",height:230,borderRadius:20}}/>:<Icon name="sparkles" size={28} color={theme.colors.accent}/>}<Text style={[theme.type.subtitle,{color:theme.colors.textPrimary}]}>{m.title}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{format(new Date(m.occurredAt),"PPP")}</Text>{m.note?<Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{m.note}</Text>:null}</Card></Pressable>)}
   <Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t("moments.local")}</Text>
  </>}
 </Screen>;
}

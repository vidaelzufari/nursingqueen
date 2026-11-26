import React,{useRef,useState} from 'react';
import {ActivityIndicator,Image,Text,View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useRouter} from 'expo-router';import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';import {ScreenBack} from '@/components/ScreenBack';import {Button,Card} from '@/components';import {Field} from '@/components/Field';
import {useTheme} from '@/theme/ThemeProvider';import {useActiveBaby} from '@/store/useBabyStore';import {useFoodStore} from '@/store/useFoodStore';
import {FoodSuggestion,foodIdForEditedName} from '@/domain/foodRecognition';import {foodRepository} from '@/db/repositories/foodRepository';import {foodRecognitionConfigured,recognizeFoodPhoto} from '@/services/foodRecognition';
export default function ScanFood(){
 const {t,i18n}=useTranslation();const theme=useTheme();const baby=useActiveBaby();const router=useRouter();
 const [photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);const [suggestions,setSuggestions]=useState<FoodSuggestion[]|null>(null);const [busy,setBusy]=useState(false);const lock=useRef(false);const alive=useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [error,setError]=useState('');const configured=foodRecognitionConfigured();
 const choose=async(camera:boolean)=>{if(lock.current)return;setError('');try{
  const permission=camera?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted){setError('permission');return;}
  const options={mediaTypes:ImagePicker.MediaTypeOptions.Images,base64:true,quality:.5,allowsEditing:true};
  const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
  if(result.canceled)return;const asset=result.assets[0];if(!asset?.base64){setError('unavailable');return;}
  setPhoto({uri:asset.uri,base64:asset.base64});setSuggestions(null);
 }catch{setError('unavailable');}};
 const analyze=async()=>{if(!photo||lock.current)return;lock.current=true;setBusy(true);setError('');try{
  const result=await recognizeFoodPhoto(photo.base64,i18n.resolvedLanguage??i18n.language);if(alive.current)setSuggestions(result);
 }catch(e){if(alive.current){const code=e instanceof Error?e.message:'unavailable';setError(['not_configured','too_large','limit'].includes(code)?code:'unavailable');}}
 finally{lock.current=false;if(alive.current)setBusy(false);}};
 const edit=(index:number,name:string)=>setSuggestions(current=>current?.map((row,i)=>i===index?{...row,name,catalogId:null}:row)??null);
 const proceed=()=>{if(!baby||!suggestions?.length||suggestions.some(s=>!s.name.trim())||lock.current)return;lock.current=true;try{
  const ids=[...new Set(suggestions.map(s=>foodIdForEditedName(s.name)??foodRepository.custom(baby.id,s.name)))];
  useFoodStore.getState().refresh(baby.id);router.replace({pathname:'/modals/meal-entry',params:{foods:JSON.stringify(ids)}});
 }catch{setError('unavailable');lock.current=false;}};
 if(!configured)return <Screen><ScreenBack/><Text accessibilityRole="header" style={[theme.type.title,{color:theme.colors.textPrimary}]}>{t('foodAI.title')}</Text><Card><Text accessibilityRole="alert" style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('foodAI.not_configured')}</Text></Card><Button label={t('foodAI.manual')} onPress={()=>router.replace('/modals/meal-entry')}/></Screen>;
 return <Screen><ScreenBack/><Text accessibilityRole="header" style={[theme.type.title,{color:theme.colors.textPrimary}]}>{t('foodAI.title')}</Text><Text style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('foodAI.intro')}</Text>
 {!configured?<Card><Text accessibilityRole="alert" style={[theme.type.body,{color:theme.colors.textSecondary}]}>{t('foodAI.not_configured')}</Text></Card>:null}
 <Card style={{gap:16}}>{photo?<Image source={{uri:photo.uri}} accessibilityLabel={t('foodAI.photo')} style={{width:'100%',height:220,borderRadius:20}}/>:null}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button label={t('foodAI.camera')} variant="soft" disabled={busy} onPress={()=>void choose(true)}/><Button label={t('foodAI.library')} variant="outline" disabled={busy} onPress={()=>void choose(false)}/></View><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t('foodAI.privacy')}</Text><Button label={t(busy?'foodAI.analyzing':'foodAI.analyze')} disabled={!configured||!photo||busy||!baby} onPress={()=>void analyze()}/>{busy?<ActivityIndicator accessibilityLabel={t('foodAI.analyzing')} color={theme.colors.accent}/>:null}</Card>
 {error?<Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t(`foodAI.${error}`)}</Text>:null}
 {suggestions!==null?<Card style={{gap:16}}><Text style={[theme.type.subtitle,{color:theme.colors.textPrimary}]}>{t('foodAI.review')}</Text><Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t('foodAI.reviewHint')}</Text>{!suggestions.length?<Text style={{color:theme.colors.textSecondary}}>{t('foodAI.empty')}</Text>:null}{suggestions.map((row,index)=><View key={index} style={{gap:6}}><Field label={t('foodAI.food',{number:index+1})} value={row.name} maxLength={80} onChangeText={value=>edit(index,value)}/>{row.certainty==='uncertain'?<Text style={[theme.type.caption,{color:theme.colors.textSecondary}]}>{t('foodAI.uncertain')}</Text>:null}<Button compact variant="ghost" label={t('foodAI.remove')} onPress={()=>setSuggestions(current=>current?.filter((_,i)=>i!==index)??null)}/></View>)}<Button variant="soft" label={t('foodAI.add')} disabled={suggestions.length>=12} onPress={()=>setSuggestions(current=>[...(current??[]),{name:'',catalogId:null,certainty:'uncertain'}])}/><Button label={t('foodAI.continue')} disabled={!baby||!suggestions.length||suggestions.some(s=>!s.name.trim())} onPress={proceed}/></Card>:null}
 <Button label={t('foodAI.manual')} variant="ghost" onPress={()=>router.replace('/modals/meal-entry')}/>
 </Screen>;
}

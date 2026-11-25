import React,{useState} from 'react';
import {Text,Platform} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {Screen} from '@/components/Screen';import {ScreenBack} from '@/components/ScreenBack';import {Field} from '@/components/Field';import {Button,Card} from '@/components';import {FoodPhoto} from '@/components/FoodPhoto';
import {useActiveBaby} from '@/store/useBabyStore';import {useFoodStore} from '@/store/useFoodStore';import {useTheme} from '@/theme/ThemeProvider';import {foodRepository} from '@/db/repositories/foodRepository';
export default function CustomFood(){
 const {name:initial}=useLocalSearchParams<{name?:string}>();const [name,setName]=useState(initial??'');const [photo,setPhoto]=useState<string|null>(null);const [error,setError]=useState(false);const [saving,setSaving]=useState(false);const baby=useActiveBaby();const router=useRouter();const {t}=useTranslation();const theme=useTheme();
 const choose=async()=>{try{const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setError(true);return;}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,base64:Platform.OS==='web',quality:.7,allowsEditing:true,aspect:[1,1]});const asset=!result.canceled&&result.assets[0];if(asset)setPhoto(Platform.OS==='web'&&asset.base64?`data:${asset.mimeType??'image/jpeg'};base64,${asset.base64}`:asset.uri);}catch{setError(true);}};
 const save=async()=>{if(!baby||saving)return;setSaving(true);try{let uri=photo;if(photo&&Platform.OS!=='web'){const folder=FileSystem.documentDirectory+'foods/';await FileSystem.makeDirectoryAsync(folder,{intermediates:true});uri=folder+Date.now()+'.jpg';await FileSystem.copyAsync({from:photo,to:uri});}const id=foodRepository.custom(baby.id,name,uri);foodRepository.plan(baby.id,id,true);useFoodStore.getState().refresh(baby.id);router.back();}catch{setError(true);setSaving(false);}};
 return <Screen><ScreenBack/><Text style={[theme.type.title,{color:theme.colors.textPrimary}]}>{t('solids.custom')}</Text><Card style={{gap:16}}><FoodPhoto id="custom" uri={photo} label={name||t('solids.custom')}/><Button label={t('solids.choosePhoto')} variant="outline" onPress={()=>void choose()}/><Field label={t('solids.foodName')} testID="food-custom-name" value={name} maxLength={80} onChangeText={setName}/>{error?<Text accessibilityRole="alert" style={{color:theme.colors.danger}}>{t('solids.error')}</Text>:null}<Button label={t('solids.plan')} disabled={!baby||!name.trim()||saving} onPress={()=>void save()}/></Card></Screen>;
}

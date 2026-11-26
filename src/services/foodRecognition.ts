import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseFoodSuggestions } from '@/domain/foodRecognition';
const base=(process.env.EXPO_PUBLIC_SUPABASE_URL??'').replace(/\/$/,'');
const publishable=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'';
const sessionKey='nq-food-ai-session';
type Session={access_token:string;refresh_token:string;expires_at:number};
let pending:Promise<Session>|undefined;
export function foodRecognitionConfigured(){return process.env.EXPO_PUBLIC_FOOD_AI_ENABLED==='true'&&/^https:\/\/[^/]+\.supabase\.co$/.test(base)&&Boolean(publishable);}
async function session():Promise<Session>{
 if(pending)return pending;
 pending=(async()=>{
  let saved:Session|null=null;try{saved=JSON.parse(await AsyncStorage.getItem(sessionKey)??'null');}catch{/* recover a damaged local session */}
  if(saved?.access_token&&saved.expires_at>Date.now()/1000+60)return saved;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
   let response=saved?.refresh_token?await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:publishable,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:saved.refresh_token}),signal:controller.signal}):null;
   if(!response||response.status===400||response.status===401)response=await fetch(base+'/auth/v1/signup',{method:'POST',headers:{apikey:publishable,'Content-Type':'application/json'},body:JSON.stringify({data:{}}),signal:controller.signal});
   if(!response.ok)throw new Error('unavailable');
   const data=await response.json();if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string')throw new Error('unavailable');
   const next={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Number(data.expires_at)||Date.now()/1000+Number(data.expires_in||3600)};
   await AsyncStorage.setItem(sessionKey,JSON.stringify(next));return next;
  }finally{clearTimeout(timer);}
 })();
 try{return await pending;}finally{pending=undefined;}
}
export async function recognizeFoodPhoto(imageBase64:string,language:string){
 if(!foodRecognitionConfigured())throw new Error('not_configured');
 if(imageBase64.length>4*1024*1024)throw new Error('too_large');
 const token=await session();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
 try{
  const response=await fetch(base+'/functions/v1/recognize-food',{method:'POST',headers:{apikey:publishable,Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:JSON.stringify({imageBase64,language:language.startsWith('ar')?'ar':language.startsWith('fr')?'fr':'en'}),signal:controller.signal});
  if(response.status===401){await AsyncStorage.removeItem(sessionKey);throw new Error('unavailable');}
  if(response.status===429)throw new Error('limit');
  if(!response.ok)throw new Error('unavailable');
  return parseFoodSuggestions(await response.json());
 }finally{clearTimeout(timer);}
}

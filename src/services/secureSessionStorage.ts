import * as SecureStore from "expo-secure-store";
import { randomUUID } from "expo-crypto";
const manifest="nq-account-session-index";
type Index={generation:string;count:number};
async function index():Promise<Index|null>{
 const raw=await SecureStore.getItemAsync(manifest);if(!raw)return null;
 try{const value=JSON.parse(raw);return typeof value.generation==="string"&&/^[a-zA-Z0-9-]+$/.test(value.generation)&&Number.isInteger(value.count)&&value.count>0&&value.count<=64?value:null;}catch{return null;}
}
const key=(generation:string,i:number)=>`nq-account-${generation}-${i}`;
export async function readAccountSession():Promise<string|null>{
 const ref=await index();if(!ref)return null;const parts=await Promise.all(Array.from({length:ref.count},(_,i)=>SecureStore.getItemAsync(key(ref.generation,i))));
 return parts.every((part):part is string=>part!==null)?parts.join(""):null;
}
export async function writeAccountSession(value:string):Promise<void>{
 if(value.length>32768)throw new Error("Session too large");
 const old=await index(),generation=randomUUID(),chunks=value.match(/[\s\S]{1,512}/g)??[];
 try{
  for(let i=0;i<chunks.length;i++)await SecureStore.setItemAsync(key(generation,i),chunks[i]!,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  await SecureStore.setItemAsync(manifest,JSON.stringify({generation,count:chunks.length}));
 }catch(error){await Promise.all(chunks.map((_,i)=>SecureStore.deleteItemAsync(key(generation,i)).catch(()=>{})));throw error;}
 if(old)await Promise.all(Array.from({length:old.count},(_,i)=>SecureStore.deleteItemAsync(key(old.generation,i)).catch(()=>{})));
}
export async function clearAccountSession(){const old=await index();await SecureStore.deleteItemAsync(manifest);if(old)await Promise.all(Array.from({length:old.count},(_,i)=>SecureStore.deleteItemAsync(key(old.generation,i))));}

import {Platform} from "react-native";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {clearAccountSession,readAccountSession,writeAccountSession} from "./secureSessionStorage";
const base=(process.env.EXPO_PUBLIC_SUPABASE_URL??"").replace(/\/$/,"");
const publicKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
const callback="nursingqueen:///auth/callback";
const pendingKey="nq-account-pkce";
export type SocialProvider="apple"|"google";
export type AccountSession={accessToken:string;refreshToken:string;expiresAt:number;email:string|null;userId:string};
export function socialSignInConfigured(){return Platform.OS!=="web"&&process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED==="true"&&/^https:\/\/[^/]+\.supabase\.co$/.test(base)&&Boolean(publicKey);}
async function request(path:string,body?:object,token?:string){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),15000);
 try{return await fetch(base+path,{method:"POST",headers:{apikey:publicKey,"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:abort.signal});}finally{clearTimeout(timer);}
}
function parseSession(data:Record<string,unknown>):AccountSession{
 const user=data.user as {id?:unknown;email?:unknown}|undefined;
 if(typeof data.access_token!=="string"||typeof data.refresh_token!=="string"||typeof user?.id!=="string")throw new Error("invalid_session");
 return {accessToken:data.access_token,refreshToken:data.refresh_token,expiresAt:typeof data.expires_at==="number"?data.expires_at:Date.now()/1000+Number(data.expires_in??3600),email:typeof user.email==="string"?user.email:null,userId:user.id};
}
let completing:Promise<AccountSession>|null=null;
let completingKey="";
let lastCompleted:{key:string;session:AccountSession;at:number}|null=null;
/** The single-use code is bound to the verifier held only in the device keychain. */
export async function completeSocialSignIn(code:string,nonce:string):Promise<AccountSession>{
 const completionKey=code+":"+nonce;
 if(lastCompleted?.key===completionKey&&Date.now()-lastCompleted.at<30000)return lastCompleted.session;
 if(completing){if(completingKey!==completionKey)throw new Error("invalid_callback");return completing;}
 completingKey=completionKey;
 completing=(async()=>{
  if(!socialSignInConfigured()||!code||code.length>4096)throw new Error("unavailable");
  const pending=JSON.parse(await SecureStore.getItemAsync(pendingKey)??"null") as {verifier:string;nonce:string;createdAt:number}|null;
  if(!pending||pending.nonce!==nonce||Date.now()-pending.createdAt>600000)throw new Error("invalid_callback");
  const response=await request("/auth/v1/token?grant_type=pkce",{auth_code:code,code_verifier:pending.verifier});
  if(!response.ok)throw new Error("sign_in_failed");
  const session=parseSession(await response.json());await writeAccountSession(JSON.stringify(session));await SecureStore.deleteItemAsync(pendingKey);lastCompleted={key:completionKey,session,at:Date.now()};return session;
 })();try{return await completing;}finally{completing=null;}
}
let signingIn=false;
export async function signInWithProvider(provider:SocialProvider):Promise<AccountSession|null>{
 if(!socialSignInConfigured())throw new Error("not_configured");if(signingIn)throw new Error("sign_in_busy");signingIn=true;
 try{
  const verifier=Array.from(Crypto.getRandomBytes(32),b=>b.toString(16).padStart(2,"0")).join("");
  const nonce=Crypto.randomUUID(),challenge=(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,verifier,{encoding:Crypto.CryptoEncoding.BASE64})).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  await SecureStore.setItemAsync(pendingKey,JSON.stringify({verifier,nonce,createdAt:Date.now()}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  const redirect=`${callback}?flow=${encodeURIComponent(nonce)}`;
  const authorize=`${base}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirect)}&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=s256`;
  const result=await WebBrowser.openAuthSessionAsync(authorize,callback);
  if(result.type!=="success"){await SecureStore.deleteItemAsync(pendingKey);return null;}
  if(!result.url.startsWith(callback+"?"))throw new Error("invalid_callback");
  const params=Object.fromEntries(result.url.slice(result.url.indexOf("?")+1).split("&").map(pair=>{const [key,...value]=pair.split("=");return [decodeURIComponent(key??""),decodeURIComponent(value.join("=").replace(/\+/g," "))];}));
  return await completeSocialSignIn(params.code??"",params.flow??"");
 }finally{signingIn=false;}
}
export async function currentAccount():Promise<AccountSession|null>{
 if(!socialSignInConfigured())return null;
 let saved:AccountSession|null=null;try{saved=JSON.parse(await readAccountSession()??"null");}catch{return null;}
 if(!saved?.refreshToken)return null;if(saved.expiresAt>Date.now()/1000+60)return saved;
 const response=await request("/auth/v1/token?grant_type=refresh_token",{refresh_token:saved.refreshToken});
 if(response.status===400||response.status===401){await clearAccountSession();return null;}
 if(!response.ok)throw new Error("unavailable");const session=parseSession(await response.json());await writeAccountSession(JSON.stringify(session));return session;
}
export async function signOutAccount(){
 const saved=await readAccountSession();const session=saved?JSON.parse(saved) as AccountSession:null;
 if(session){const response=await request("/auth/v1/logout",undefined,session.accessToken);if(!response.ok&&response.status!==401)throw new Error("unavailable");}
 await clearAccountSession();await SecureStore.deleteItemAsync(pendingKey);lastCompleted=null;
}

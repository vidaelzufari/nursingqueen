export interface FoodRecognitionDependencies {
 authenticate(token:string):Promise<string|null>;
 reserve(userId:string):Promise<boolean>;
 infer(image:string,language:string):Promise<unknown>;
}
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
/** No image, profile, meal or model response is logged or persisted by this handler. */
export function createFoodRecognitionHandler(deps:FoodRecognitionDependencies){return async(req:Request):Promise<Response>=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'method'});
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return reply(401,{error:'auth'});
 try{
  const userId=await deps.authenticate(token);if(!userId)return reply(401,{error:'auth'});
  if(!req.headers.get('content-type')?.includes('application/json'))return reply(415,{error:'format'});
  const reader=req.body?.getReader();if(!reader)return reply(400,{error:'image'});
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>4*1024*1024+1024){await reader.cancel();return reply(413,{error:'too_large'});}chunks.push(part.value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let body:Record<string,unknown>;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply(400,{error:'json'});}
  if(!body||typeof body!=='object')return reply(400,{error:'image'});
  const image=body.imageBase64;
  if(typeof image!=='string'||image.length>4*1024*1024||image.length<16||image.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(image))return reply(400,{error:'image'});
  const mime=image.startsWith('/9j/')?'image/jpeg':image.startsWith('iVBORw0KGgo')?'image/png':image.startsWith('UklGR')?'image/webp':null;
  if(!mime)return reply(415,{error:'image'});
  if(!await deps.reserve(userId))return reply(429,{error:'limit'});
  const output=await deps.infer(`data:${mime};base64,${image}`,body.language==='ar'?'ar':body.language==='fr'?'fr':'en');
  return reply(200,output);
 }catch{return reply(503,{error:'unavailable'});}
};}

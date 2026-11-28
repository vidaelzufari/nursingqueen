import { getDatabase } from "../client";
import { generateId } from "../id";
export const MOMENT_KINDS=["tooth","clap","steps","roll","smile","word","sit","crawl","custom"] as const;
export type MomentKind=typeof MOMENT_KINDS[number];
export interface Moment {id:string;babyId:string;kind:MomentKind;title:string;occurredAt:string;note:string|null;photoUri:string|null}
type Row={id:string;baby_id:string;kind:MomentKind;title:string;occurred_at:string;note:string|null;photo_uri:string|null};
export const momentRepository={
 list(babyId:string):Moment[]{return getDatabase().getAllSync<Row>("SELECT * FROM moments WHERE baby_id=? ORDER BY occurred_at DESC,created_at DESC",[babyId]).map(r=>({id:r.id,babyId:r.baby_id,kind:r.kind,title:r.title,occurredAt:r.occurred_at,note:r.note,photoUri:r.photo_uri}));},
 save(babyId:string,input:{id?:string;kind:MomentKind;title:string;occurredAt:Date;note?:string;photoUri?:string|null}):string{
  const title=input.title.trim(),now=new Date();
  if(!MOMENT_KINDS.includes(input.kind)||!title||title.length>100||!Number.isFinite(input.occurredAt.getTime())||input.occurredAt>now||(input.note?.length??0)>2000)throw new Error("Invalid moment");
  const db=getDatabase();
  if(input.id&&!db.getFirstSync("SELECT id FROM moments WHERE id=? AND baby_id=?",[input.id,babyId]))throw new Error("Unknown moment");
  const id=input.id??generateId();
  if(input.id)db.runSync("UPDATE moments SET kind=?,title=?,occurred_at=?,note=?,photo_uri=?,updated_at=? WHERE id=? AND baby_id=?",[input.kind,title,input.occurredAt.toISOString(),input.note?.trim()||null,input.photoUri??null,now.toISOString(),id,babyId]);
  else db.runSync("INSERT INTO moments(id,baby_id,kind,title,occurred_at,note,photo_uri,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",[id,babyId,input.kind,title,input.occurredAt.toISOString(),input.note?.trim()||null,input.photoUri??null,now.toISOString(),now.toISOString()]);
  return id;
 },
 remove(babyId:string,id:string){getDatabase().runSync("DELETE FROM moments WHERE id=? AND baby_id=?",[id,babyId]);}
};

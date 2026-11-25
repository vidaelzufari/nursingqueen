import { getDatabase } from "../client";
import { generateId } from "../id";
import { FOOD_CATALOG, normalizeFoodName } from "@/domain/foods";
export interface Food { id:string; name:string|null; catalogKey:string|null; photoUri:string|null; firstAt:string|null; lastAt:string|null; times:number; planned:boolean }
export const MEAL_TYPES = ["breakfast","lunch","snack","dinner"] as const;
export type MealType = typeof MEAL_TYPES[number];
export interface SolidMeal { mealType:MealType|null; id:string; babyId:string; occurredAt:string; note:string|null; spoons:number|null; ml:number|null; foodIds:string[] }
type FoodRow={id:string;name:string|null;catalog_key:string|null;photo_uri:string|null;first_at:string|null;last_at:string|null;times:number;planned:number};
function seed() {
 const db=getDatabase();
 const count=db.getFirstSync<{count:number}>("SELECT COUNT(*) AS count FROM foods WHERE catalog_key IS NOT NULL")?.count ?? 0;
 if(count===FOOD_CATALOG.length)return;
 db.withTransactionSync(()=>{for(const f of FOOD_CATALOG)db.runSync("INSERT OR IGNORE INTO foods(id,catalog_key,name,created_at) VALUES(?,?,?,?)",[f.id,f.id,f.en,new Date().toISOString()]);});
}
function ensureFood(foodId:string,babyId:string) { if(!getDatabase().getFirstSync("SELECT id FROM foods WHERE id=? AND (baby_id IS NULL OR baby_id=?)",[foodId,babyId]))throw new Error("Unknown food"); }
export const foodRepository={
 list(babyId:string):Food[] {
  seed();
  return getDatabase().getAllSync<FoodRow>(`SELECT f.*,s.first_at,s.last_at,COALESCE(s.times,0) AS times,EXISTS(SELECT 1 FROM food_plans p WHERE p.food_id=f.id AND p.baby_id=?) AS planned FROM foods f LEFT JOIN (SELECT mf.food_id,MIN(m.occurred_at) AS first_at,MAX(m.occurred_at) AS last_at,COUNT(*) AS times FROM meal_foods mf JOIN solid_meals m ON m.id=mf.meal_id WHERE m.baby_id=? GROUP BY mf.food_id) s ON s.food_id=f.id WHERE f.baby_id IS NULL OR f.baby_id=?`,[babyId,babyId,babyId]).map(r=>({id:r.id,name:r.name,catalogKey:r.catalog_key,photoUri:r.photo_uri,firstAt:r.first_at,lastAt:r.last_at,times:r.times,planned:Boolean(r.planned)}));
 },
 plan(babyId:string,foodId:string,planned:boolean) {seed();ensureFood(foodId,babyId);getDatabase().runSync(planned?"INSERT OR IGNORE INTO food_plans(baby_id,food_id) VALUES(?,?)":"DELETE FROM food_plans WHERE baby_id=? AND food_id=?",[babyId,foodId]);},
 custom(babyId:string,name:string,photoUri:string|null=null):string {
  seed();const clean=name.trim().replace(/\s+/g," ");const normalized=normalizeFoodName(clean);
  if(!normalized||clean.length>80)throw new Error("Invalid food name");
  const known=FOOD_CATALOG.find(f=>[f.en,f.fr,f.ar,f.wiki].some(n=>normalizeFoodName(n)===normalized));
  if(known)return known.id;
  const existing=getDatabase().getFirstSync<{id:string}>("SELECT id FROM foods WHERE baby_id=? AND normalized_name=?",[babyId,normalized]);if(existing)return existing.id;
  const id=generateId();getDatabase().runSync("INSERT INTO foods(id,baby_id,name,normalized_name,photo_uri,created_at) VALUES(?,?,?,?,?,?)",[id,babyId,clean,normalized,photoUri,new Date().toISOString()]);return id;
 },
 meals(babyId:string):SolidMeal[] {
  const db=getDatabase();const rows=db.getAllSync<{id:string;baby_id:string;occurred_at:string;note:string|null;spoons:number|null;ml:number|null;meal_type:MealType|null}>("SELECT * FROM solid_meals WHERE baby_id=? ORDER BY occurred_at DESC,created_at DESC",[babyId]);
  const joins=db.getAllSync<{meal_id:string;food_id:string}>("SELECT mf.meal_id,mf.food_id FROM meal_foods mf JOIN solid_meals m ON m.id=mf.meal_id WHERE m.baby_id=? ORDER BY mf.position",[babyId]);
  const ids=new Map<string,string[]>();for(const row of joins)ids.set(row.meal_id,[...(ids.get(row.meal_id)??[]),row.food_id]);
  return rows.map(r=>({id:r.id,babyId:r.baby_id,mealType:r.meal_type??null,occurredAt:r.occurred_at,note:r.note,spoons:r.spoons,ml:r.ml,foodIds:ids.get(r.id)??[]}));
 },
 save(babyId:string,input:{id?:string;foodIds:string[];occurredAt:Date;note?:string;spoons?:number|null;ml?:number|null;mealType?:MealType|null}):string {
  seed();const ids=[...new Set(input.foodIds)];if(!ids.length||!Number.isFinite(input.occurredAt.getTime())||input.occurredAt.getTime()>Date.now())throw new Error("Invalid meal");
  for(const value of [input.spoons,input.ml])if(value!=null&&(!Number.isFinite(value)||value<=0||value>Number.MAX_SAFE_INTEGER))throw new Error("Invalid meal amount");
  if(input.mealType!=null&&!MEAL_TYPES.includes(input.mealType))throw new Error("Invalid meal type");
  if((input.note?.length??0)>2000)throw new Error("Note too long");for(const id of ids)ensureFood(id,babyId);
  const db=getDatabase();const id=input.id??generateId();const now=new Date().toISOString();
  if(input.id&&!db.getFirstSync("SELECT id FROM solid_meals WHERE id=? AND baby_id=?",[id,babyId]))throw new Error("Unknown meal");
  db.withTransactionSync(()=>{
   if(input.id)db.runSync("UPDATE solid_meals SET occurred_at=?,note=?,spoons=?,ml=?,meal_type=?,updated_at=? WHERE id=? AND baby_id=?",[input.occurredAt.toISOString(),input.note?.trim()||null,input.spoons??null,input.ml??null,input.mealType??null,now,id,babyId]);
   else db.runSync("INSERT INTO solid_meals(id,baby_id,occurred_at,note,spoons,ml,meal_type,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",[id,babyId,input.occurredAt.toISOString(),input.note?.trim()||null,input.spoons??null,input.ml??null,input.mealType??null,now,now]);
   db.runSync("DELETE FROM meal_foods WHERE meal_id=?",[id]);ids.forEach((food,index)=>db.runSync("INSERT INTO meal_foods(meal_id,food_id,position) VALUES(?,?,?)",[id,food,index]));
  });return id;
 },
 remove(babyId:string,id:string) {const db=getDatabase();db.withTransactionSync(()=>{db.runSync("DELETE FROM meal_foods WHERE meal_id IN (SELECT id FROM solid_meals WHERE baby_id=? AND id=?)",[babyId,id]);db.runSync("DELETE FROM solid_meals WHERE baby_id=? AND id=?",[babyId,id]);});}
};

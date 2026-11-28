import {migrations} from '@/db/schema';
import {foodRepository} from '@/db/repositories/foodRepository';
import {FOOD_CATALOG,foodName,matchesFood,normalizeFoodName,parseMealQuantity} from '@/domain/foods';
let mockDatabase:object;
jest.mock('@/db/client',()=>({getDatabase:()=>mockDatabase}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs=require('sql.js/dist/sql-asm.js');
let SQL:Awaited<ReturnType<typeof initSqlJs>>;
let db:any; // eslint-disable-line @typescript-eslint/no-explicit-any
beforeAll(async()=>{SQL=await initSqlJs();});
beforeEach(()=>{db=new SQL.Database();db.run('PRAGMA foreign_keys=ON');for(const m of migrations)for(const s of m.statements)db.run(s);for(const id of ['qa','other'])db.run("INSERT INTO babies VALUES (?, 'QA',NULL,'2026-06-01',0,'2026-06-01')",[id]);const query=(sql:string,args:unknown[]=[])=>{const s=db.prepare(sql);try{s.bind(args);const rows=[];while(s.step())rows.push(s.getAsObject());return rows;}finally{s.free();}};mockDatabase={runSync:(sql:string,args:unknown[])=>db.run(sql,args),getFirstSync:(sql:string,args:unknown[])=>query(sql,args)[0]??null,getAllSync:query,withTransactionSync:(fn:()=>void)=>{db.run('BEGIN');try{fn();db.run('COMMIT');}catch(e){db.run('ROLLBACK');throw e;}}};});
afterEach(()=>db.close());
const meal=(foodIds=['sweet_potato'],occurredAt=new Date('2026-01-02T12:15Z'))=>({foodIds,occurredAt});
it('provides at least 152 unique foods with searchable names in all three languages',()=>{expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(152);expect(new Set(FOOD_CATALOG.map(f=>f.id)).size).toBe(FOOD_CATALOG.length);for(const f of FOOD_CATALOG)for(const lang of ['en','fr','ar']){expect(foodName(f,lang).trim()).not.toBe('');expect(matchesFood(f,foodName(f,lang))).toBe(true);}});
it('searches accents, ligatures, custom text and Arabic names',()=>{expect(matchesFood({id:'egg_as_food'},'oeuf')).toBe(true);expect(matchesFood({id:'sweet_potato'},'بطاطا')).toBe(true);expect(normalizeFoodName('  PÊCHE   mûre ')).toBe('peche mure');expect(foodName({id:'custom',name:'Mon plat'},'fr')).toBe('Mon plat');expect(matchesFood({id:'custom',name:'Mon plat'},'PLAT')).toBe(true);expect(matchesFood({id:'custom'},'xxx')).toBe(false);});
it('moves a planned food to tasted and derives first/last from meal dates',()=>{foodRepository.plan('qa','sweet_potato',true);expect(foodRepository.list('qa').find(f=>f.id==='sweet_potato')).toMatchObject({planned:true,firstAt:null});foodRepository.save('qa',meal());foodRepository.save('qa',meal(['sweet_potato'],new Date('2026-01-01T10:00Z')));expect(foodRepository.list('qa').find(f=>f.id==='sweet_potato')).toMatchObject({firstAt:'2026-01-01T10:00:00.000Z',lastAt:'2026-01-02T12:15:00.000Z',times:2});});
it('saves multiple foods, spoon count, ml and note in a single meal without duplicate foods',()=>{foodRepository.save('qa',{...meal(['sweet_potato','zucchini','sweet_potato']),spoons:3.5,ml:45,note:'  Smooth texture  '});expect(foodRepository.meals('qa')).toEqual([expect.objectContaining({foodIds:['sweet_potato','zucchini'],spoons:3.5,ml:45,note:'Smooth texture'})]);});
it('recalculates tasting dates when a meal is edited or deleted, preserving its planned state',()=>{foodRepository.plan('qa','sweet_potato',true);const id=foodRepository.save('qa',meal());foodRepository.save('qa',{id,...meal(['carrot'])});expect(foodRepository.list('qa').find(f=>f.id==='sweet_potato')).toMatchObject({firstAt:null,planned:true});expect(foodRepository.list('qa').find(f=>f.id==='carrot')?.firstAt).not.toBeNull();foodRepository.remove('qa',id);expect(foodRepository.meals('qa')).toEqual([]);expect(foodRepository.list('qa').find(f=>f.id==='carrot')?.firstAt).toBeNull();});
it('does not modify another child’s meals or expose custom foods across profiles',()=>{const custom=foodRepository.custom('qa','My custom meal','file:///photo.jpg');const id=foodRepository.save('qa',meal([custom]));expect(foodRepository.list('other').find(f=>f.id===custom)).toBeUndefined();expect(()=>foodRepository.save('other',meal([custom]))).toThrow('Unknown food');expect(()=>foodRepository.save('other',{id,...meal(['carrot'])})).toThrow('Unknown meal');foodRepository.remove('other',id);expect(foodRepository.meals('qa')).toHaveLength(1);});
it('reuses a custom food and resolves canonical foods in each language',()=>{const id=foodRepository.custom('qa','  Purée maison ');expect(foodRepository.custom('qa','purée MAISON')).toBe(id);expect(foodRepository.custom('qa','Œuf')).toBe('egg_as_food');expect(foodRepository.custom('qa','بيض')).toBe('egg_as_food');expect(foodRepository.custom('qa','Egg as food')).toBe('egg_as_food');});
it('removes a food from the test list without deleting meal history',()=>{foodRepository.plan('qa','carrot',true);foodRepository.save('qa',meal(['carrot']));foodRepository.plan('qa','carrot',false);expect(foodRepository.list('qa').find(f=>f.id==='carrot')).toMatchObject({planned:false,times:1});});
it.each(['', ' ', 'x'.repeat(81)])('rejects invalid custom food name %j',name=>{expect(()=>foodRepository.custom('qa',name)).toThrow('Invalid food name');});
it.each([0,-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])('rejects invalid meal amounts %s without writing',amount=>{expect(()=>foodRepository.save('qa',{...meal(),spoons:amount})).toThrow();expect(()=>foodRepository.save('qa',{...meal(),ml:amount})).toThrow();expect(foodRepository.meals('qa')).toEqual([]);});
it.each([new Date('invalid'),new Date('2099-01-01')])('rejects invalid meal date %s',occurredAt=>{expect(()=>foodRepository.save('qa',meal(['carrot'],occurredAt))).toThrow('Invalid meal');});
it('rejects empty meals, unknown foods and overlong notes without partial writes',()=>{expect(()=>foodRepository.save('qa',meal([]))).toThrow();expect(()=>foodRepository.save('qa',meal(['carrot','invalid']))).toThrow();expect(()=>foodRepository.save('qa',{...meal(),note:'x'.repeat(2001)})).toThrow();expect(foodRepository.meals('qa')).toEqual([]);});
it.each(['3,5','3.5','٣٫٥','۳٫۵'])('parses spoon count %s',value=>{expect(parseMealQuantity(value)).toBe(3.5);});
it.each(['', '0','-1','3.1234','NaN','1e3','999999999999999999999'])('rejects malformed spoon count %j',value=>{expect(parseMealQuantity(value)).toBeNull();});
it('provides one licensed bundled photo for every catalogue food',()=>{
 // eslint-disable-next-line @typescript-eslint/no-var-requires
 const credits=require('../../assets/foods/attribution.json') as {id:string;file:string;license:string;source:string}[];
 // eslint-disable-next-line @typescript-eslint/no-var-requires
 const fs=require('fs');
 expect(new Set(credits.map(p=>p.id)).size).toBe(FOOD_CATALOG.length);
 for(const food of FOOD_CATALOG){const photo=credits.find(p=>p.id===food.id)!;expect(photo).toBeDefined();expect(photo.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);expect(photo.license.length).toBeGreaterThan(0);expect(fs.statSync('assets/foods/'+photo.file).size).toBeGreaterThan(100);}
});
it.each(['breakfast','lunch','snack','dinner'] as const)('persists %s and allows changing the meal type later',mealType=>{
 const id=foodRepository.save('qa',{...meal(),mealType});expect(foodRepository.meals('qa')[0]?.mealType).toBe(mealType);
 foodRepository.save('qa',{id,...meal(),mealType:'snack'});expect(foodRepository.meals('qa')).toHaveLength(1);expect(foodRepository.meals('qa')[0]?.mealType).toBe('snack');
});
it('rejects an unknown meal type without writing',()=>{
 expect(()=>foodRepository.save('qa',{...meal(),mealType:'invalid' as never})).toThrow('Invalid meal type');expect(foodRepository.meals('qa')).toEqual([]);
});

it('finds baby cereals by everyday names and records them as distinct foods',()=>{
 expect(matchesFood({id:'rice_cereal'},'baby rice')).toBe(true);
 expect(matchesFood({id:'rice_cereal'},'céréales de riz')).toBe(true);
 expect(matchesFood({id:'oat_cereal'},'oatmeal')).toBe(true);
 foodRepository.list('qa');
 foodRepository.save('qa',meal(['rice_cereal','oat_cereal']));
 expect(foodRepository.list('qa').find(f=>f.id==='rice_cereal')?.times).toBe(1);
 expect(foodRepository.list('qa').find(f=>f.id==='rice')?.times).toBe(0);
});

it('stores explicitly selected allergens for a custom recipe and derives checklist dates from real meals',()=>{
 const {allergenChecklist,foodAllergens}=jest.requireActual('@/domain/allergens');
 const id=foodRepository.custom('qa','Homemade sesame yogurt',null,['milk','sesame']);
 expect(foodAllergens(foodRepository.list('qa').find(f=>f.id===id))).toEqual(['milk','sesame']);
 const mealId=foodRepository.save('qa',meal([id]));
 expect(allergenChecklist(foodRepository.list('qa')).find((row:{id:string})=>row.id==='sesame')).toMatchObject({firstAt:'2026-01-02T12:15:00.000Z'});
 expect(foodRepository.list('other').find(f=>f.id===id)).toBeUndefined();
 foodRepository.remove('qa',mealId);
 expect(allergenChecklist(foodRepository.list('qa')).find((row:{id:string})=>row.id==='sesame')).toMatchObject({firstAt:null,lastAt:null});
});
it('reuses a custom recipe without discarding its recorded history when its allergen ingredients are corrected',()=>{
 const id=foodRepository.custom('qa','Family cereal',null,['milk']);foodRepository.save('qa',meal([id]));
 expect(foodRepository.custom('qa','Family cereal',null,['soy'])).toBe(id);
 expect(foodRepository.list('qa').find(f=>f.id===id)).toMatchObject({allergens:['soy'],times:1});
 expect(()=>foodRepository.custom('qa','Bad recipe',null,['invalid'] as never)).toThrow('Unknown allergen group');
});

import {ALLERGEN_GROUPS,allergenChecklist,foodAllergens,parseAllergens,validateAllergens} from '@/domain/allergens';
it.each([['egg_as_food','egg'],['peanut_butter','peanut'],['almond_butter','tree_nuts'],['tahini','sesame'],['tofu','soy'],['wheat_cereal','cereals'],['oat_cereal','cereals'],['yogurt','milk'],['shrimp','crustaceans'],['scallop','molluscs'],['salmon_as_food','fish'],['celery','celery']])('identifies %s in %s', (id,group)=>expect(foodAllergens({id})).toContain(group));
it.each(['rice_cereal','rice','buckwheat','coconut','carrot'])('does not invent a declared allergen group for %s',id=>expect(foodAllergens({id})).toEqual([]));
it('keeps peanuts and tree nuts separate and never infers that all nuts were eaten',()=>{
 const rows=allergenChecklist([{id:'almond_butter',firstAt:'2026-01-01',lastAt:'2026-01-03'},{id:'walnut',firstAt:null},{id:'peanut_butter',firstAt:null}]);
 expect(rows.find(r=>r.id==='tree_nuts')?.logged.map(f=>f.id)).toEqual(['almond_butter']);expect(rows.find(r=>r.id==='peanut')?.firstAt).toBeNull();
});
it('groups all 14 declared allergens while filtering malformed or unknown custom metadata',()=>{
 expect(ALLERGEN_GROUPS).toHaveLength(14);expect(parseAllergens('bad')).toEqual([]);expect(parseAllergens('["milk","unknown","milk"]')).toEqual(['milk']);expect(()=>validateAllergens(['unknown'])).toThrow();
});
it('combines catalogue identifiers and explicit recipe ingredients without duplicate labels',()=>{
 expect(foodAllergens({id:'custom',catalogKey:'yogurt',allergens:['milk','sesame']})).toEqual(['milk','sesame']);
});

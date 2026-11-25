import { FOOD_CATALOG, normalizeFoodName } from './foods';
export type FoodSuggestion = { name: string; catalogId: string | null; certainty: 'likely' | 'uncertain' };
/** Treat model output as untrusted. Suggestions never write to the journal. */
export function parseFoodSuggestions(value: unknown): FoodSuggestion[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as {foods?:unknown}).foods)) throw new Error('invalid_response');
  const foods=(value as {foods:unknown[]}).foods;
  if (foods.length>12) throw new Error('invalid_response');
  const seen=new Set<string>();
  return foods.map(row=>{
    if(!row||typeof row!=='object')throw new Error('invalid_response');
    const item=row as Record<string,unknown>;
    if(typeof item.name!=='string'||!item.name.trim()||item.name.trim().length>80||!['likely','uncertain'].includes(String(item.certainty)))throw new Error('invalid_response');
    const name=item.name.trim();const key=normalizeFoodName(name);
    if(seen.has(key))return null;seen.add(key);
    const catalogId=typeof item.catalogId==='string'&&FOOD_CATALOG.some(f=>f.id===item.catalogId)?item.catalogId:null;
    return {name,catalogId,certainty:item.certainty as FoodSuggestion['certainty']};
  }).filter((x):x is FoodSuggestion=>x!==null);
}
/** Name edits take precedence over the model's proposed catalogue ID. */
export function foodIdForEditedName(name:string):string|null {
  const normalized=normalizeFoodName(name);
  return FOOD_CATALOG.find(f=>[f.en,f.fr,f.ar].some(n=>normalizeFoodName(n)===normalized))?.id??null;
}
export function parseMealFoodIds(value: string | undefined): string[] {
  if(!value)return [];
  try{const data:unknown=JSON.parse(value);return Array.isArray(data)?[...new Set(data.filter((x):x is string=>typeof x==='string'&&x.length<=100))].slice(0,12):[];}catch{return [];}
}

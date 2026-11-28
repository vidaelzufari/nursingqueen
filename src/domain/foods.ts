import catalog from "@/assets/food-catalog.json";
export const FOOD_CATALOG = catalog;
export const FOOD_CATEGORIES = [...new Set(catalog.map(f=>f.category))];
export function normalizeFoodName(name: string): string { return name.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f]/g, "").replace(/œ/g,"oe").trim().replace(/\s+/g," ").toLocaleLowerCase(); }
export function foodName(food: {id:string;name?:string|null;catalogKey?:string|null},language:string):string {
 const entry=catalog.find(f=>f.id===(food.catalogKey ?? food.id));
 return entry ? language.startsWith("ar") ? entry.ar : language.startsWith("fr") ? entry.fr : entry.en : food.name ?? "";
}
export function matchesFood(food:{id:string;name?:string|null;catalogKey?:string|null},query:string):boolean {
 const entry=catalog.find(f=>f.id===(food.catalogKey ?? food.id));const needle=normalizeFoodName(query);
 return [food.name,entry?.en,entry?.fr,entry?.ar,...(entry && "aliases" in entry ? entry.aliases ?? [] : [])].some(value=>value && normalizeFoodName(value).includes(needle));
}
export function parseMealQuantity(input:string):number|null {
 const normalized=input.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace(/[٫،,]/g,".");
 if(!/^\d+(?:\.\d{1,3})?$/.test(normalized))return null;
 const value=Number(normalized);return Number.isFinite(value)&&value>0&&value<=Number.MAX_SAFE_INTEGER?value:null;
}

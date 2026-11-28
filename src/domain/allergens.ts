/** Catalogue grouping follows the FSA's 14 declared allergen groups.
 * https://www.food.gov.uk/business-guidance/allergen-guidance-for-food-businesses
 * These are food labels, never a diagnosis or proof of tolerance.
 */
export const ALLERGEN_GROUPS=["milk","egg","peanut","tree_nuts","sesame","soy","cereals","fish","crustaceans","molluscs","celery","mustard","lupin","sulphites"] as const;
export type AllergenId=typeof ALLERGEN_GROUPS[number];
const GROUP_FOODS:Record<AllergenId,readonly string[]>={
 milk:["yogurt","greek_yogurt","fromage_blanc","cottage_cheese","ricotta","mozzarella","cream_cheese","kefir","cheddar_cheese","emmental_cheese","butter"],
 egg:["egg_as_food"],peanut:["peanut_butter"],tree_nuts:["almond_butter","cashew","walnut","hazelnut","pistachio","pecan"],sesame:["tahini"],soy:["edamame","tofu","tempeh","soybean"],
 cereals:["wheat","barley","rye","oat","semolina","couscous","pasta","bread","bulgur","oat_cereal","wheat_cereal","barley_cereal"],
 fish:["salmon_as_food","cod_as_food","hake","trout","sardine","mackerel_as_food","sole_fish","sea_bass","haddock","tuna"],crustaceans:["shrimp"],molluscs:["scallop"],celery:["celery"],mustard:[],lupin:[],sulphites:[],
};
export type AllergenFood={id:string;catalogKey?:string|null;allergens?:readonly AllergenId[];firstAt?:string|null;lastAt?:string|null;times?:number};
export function foodAllergens(food:AllergenFood):AllergenId[]{const key=food.catalogKey??food.id;return ALLERGEN_GROUPS.filter(group=>GROUP_FOODS[group].includes(key)||food.allergens?.includes(group));}
export function validateAllergens(value:readonly string[]):AllergenId[]{if(value.some(id=>!ALLERGEN_GROUPS.includes(id as AllergenId)))throw new Error("Unknown allergen group");return ALLERGEN_GROUPS.filter(id=>value.includes(id));}
export function parseAllergens(value?:string|null):AllergenId[]{try{const parsed=JSON.parse(value??"[]");return Array.isArray(parsed)?ALLERGEN_GROUPS.filter(id=>parsed.includes(id)):[];}catch{return [];}}
export function allergenChecklist(foods:AllergenFood[]){return ALLERGEN_GROUPS.map(id=>{
 const members=foods.filter(f=>foodAllergens(f).includes(id)),logged=members.filter(f=>Boolean(f.firstAt));
 const first=logged.map(f=>f.firstAt!).sort()[0]??null,last=logged.map(f=>f.lastAt??f.firstAt!).sort().at(-1)??null;
 return {id,members,logged,firstAt:first,lastAt:last};
});}

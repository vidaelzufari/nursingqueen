import { create } from "zustand";
import { Food, SolidMeal, foodRepository } from "@/db/repositories/foodRepository";
interface FoodState { babyId:string|null;foods:Food[];meals:SolidMeal[];refresh:(babyId:string)=>void }
export const useFoodStore=create<FoodState>()(set=>({babyId:null,foods:[],meals:[],refresh:babyId=>set({babyId,foods:foodRepository.list(babyId),meals:foodRepository.meals(babyId)})}));

import {create} from "zustand";
import {Moment,momentRepository} from "@/db/repositories/momentRepository";
export const useMomentStore=create<{moments:Moment[];refresh:(babyId:string)=>void}>(set=>({moments:[],refresh:babyId=>set({moments:momentRepository.list(babyId)})}));

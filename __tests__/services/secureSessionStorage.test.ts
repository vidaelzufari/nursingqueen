import {readAccountSession,writeAccountSession,clearAccountSession} from "@/services/secureSessionStorage";
const mockStorage=new Map<string,string>();
let mockGeneration=0;
jest.mock("expo-secure-store",()=>({getItemAsync:jest.fn(async(key:string)=>mockStorage.get(key)??null),setItemAsync:jest.fn(async(key:string,value:string)=>{mockStorage.set(key,value);}),deleteItemAsync:jest.fn(async(key:string)=>{mockStorage.delete(key);}),WHEN_UNLOCKED_THIS_DEVICE_ONLY:1}));
jest.mock("expo-crypto",()=>({randomUUID:()=>`generation-${++mockGeneration}`}));
beforeEach(()=>mockStorage.clear());
it("stores large sessions in small keychain chunks, replaces them and removes them on sign-out",async()=>{
 const first=JSON.stringify({token:"a".repeat(7000)});await writeAccountSession(first);expect(await readAccountSession()).toBe(first);
 for(const [key,value]of mockStorage)if(key!=="nq-account-session-index")expect(value.length).toBeLessThanOrEqual(512);
 await writeAccountSession('"replacement"');expect(await readAccountSession()).toBe('"replacement"');expect([...mockStorage.keys()].filter(k=>k.startsWith("nq-account-generation-1-"))).toEqual([]);
 await clearAccountSession();expect(await readAccountSession()).toBeNull();expect(mockStorage.size).toBe(0);
});
it("returns no session if a chunk is missing",async()=>{await writeAccountSession("a".repeat(700));mockStorage.delete([...mockStorage.keys()].find(k=>k.endsWith("-0"))!);expect(await readAccountSession()).toBeNull();});

import {migrations} from "@/db/schema";
import {bottleRepository} from "@/db/repositories/bottleRepository";
import {pumpRepository} from "@/db/repositories/pumpRepository";
import {computeStatusStrip} from "@/store/useLogStore";
import {summarizeDay} from "@/domain/daySummary";
let mockDatabase:object;
jest.mock("@/db/client",()=>({getDatabase:()=>mockDatabase}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs=require("sql.js/dist/sql-asm.js");
let SQL:Awaited<ReturnType<typeof initSqlJs>>;
// sql.js is bundled without declarations.
let db:any; // eslint-disable-line @typescript-eslint/no-explicit-any
const at=new Date("2026-11-20T10:00:37Z");
beforeAll(async()=>{SQL=await initSqlJs();});
beforeEach(()=>{
 db=new SQL.Database();db.run("PRAGMA foreign_keys=ON");for(const m of migrations)for(const s of m.statements)db.run(s);
 for(const id of ["b","other"])db.run("INSERT INTO babies VALUES (?, 'Liam',NULL,'2026-01-01',0,'2026-01-01')",[id]);
 const query=(sql:string,args:unknown[]=[])=>{const stmt=db.prepare(sql);try{stmt.bind(args);const rows=[];while(stmt.step())rows.push(stmt.getAsObject());return rows;}finally{stmt.free();}};
 mockDatabase={getAllSync:query,getFirstSync:(sql:string,args:unknown[])=>query(sql,args)[0]??null,runSync:(sql:string,args:unknown[])=>db.run(sql,args)};
});
afterEach(()=>db.close());
const bottle=(ml:number|null=90)=>bottleRepository.create({babyId:"b",ml,milkType:"breast_milk",occurredAt:at});
const pump=()=>pumpRepository.logPending("b",at);
it.each(["breast_milk","formula"] as const)("BP01 bottle %s persists its exact type, volume and timestamp",milkType=>{
 const item=bottleRepository.create({babyId:"b",ml:125,milkType,occurredAt:at});expect(bottleRepository.listByBaby("b")).toEqual([expect.objectContaining({id:item.id,ml:125,milkType,occurredAt:at.toISOString(),needsDetail:false})]);
});
it("BP02 optional bottle amount stays unknown until added and becomes unknown again when cleared",()=>{
 const item=bottle(null);expect(item.needsDetail).toBe(true);expect(item.ml).toBeNull();bottleRepository.update(item.id,{ml:120});expect(bottleRepository.listByBaby("b")[0]).toMatchObject({ml:120,needsDetail:false});bottleRepository.update(item.id,{ml:null});expect(bottleRepository.listByBaby("b")[0]).toMatchObject({ml:null,needsDetail:true});
});
it.each([0,-1,NaN,Infinity,-Infinity,Number.MAX_SAFE_INTEGER+1])("BP03 rejects invalid bottle volume %s before creating a record",ml=>{expect(()=>bottle(ml)).toThrow("Invalid bottle amount");expect(bottleRepository.listByBaby("b")).toHaveLength(0);});
it.each([0,-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])("BP04 invalid bottle update %s leaves the original record intact",ml=>{const item=bottle();expect(()=>bottleRepository.update(item.id,{ml})).toThrow();expect(bottleRepository.listByBaby("b")[0]?.ml).toBe(90);});
it.each([new Date("bad"),new Date("2099-01-01")])("BP05 rejects invalid/future bottle creation and editing %s",date=>{
 expect(()=>bottleRepository.create({babyId:"b",ml:90,milkType:"formula",occurredAt:date})).toThrow();const item=bottle();expect(()=>bottleRepository.update(item.id,{occurredAt:date.toString(),ml:200})).toThrow();expect(bottleRepository.listByBaby("b")[0]).toMatchObject({ml:90,occurredAt:at.toISOString()});
});
it("BP06 can correct milk type without changing volume, date or count",()=>{const item=bottle();bottleRepository.update(item.id,{milkType:"formula"});expect(bottleRepository.listByBaby("b")).toEqual([expect.objectContaining({ml:90,milkType:"formula",occurredAt:at.toISOString()})]);});
it("BP07 rejects unsupported milk type at creation and edit",()=>{expect(()=>bottleRepository.create({babyId:"b",ml:90,milkType:"other" as never})).toThrow();const item=bottle();expect(()=>bottleRepository.update(item.id,{milkType:"other" as never})).toThrow();expect(bottleRepository.listByBaby("b")[0]?.milkType).toBe("breast_milk");});
it("BP08 pending pumping is durable without inventing amounts",()=>{const item=pump();expect(pumpRepository.listByBaby("b")).toEqual([expect.objectContaining({id:item.id,totalMl:null,leftMl:null,rightMl:null,needsDetail:true})]);});
it("BP09 total-only and per-side entries can replace each other",()=>{
 const item=pump();pumpRepository.addTotal(item.id,120);expect(pumpRepository.listByBaby("b")[0]).toMatchObject({totalMl:120,leftMl:null,rightMl:null});pumpRepository.addDetail(item.id,40,80);expect(pumpRepository.listByBaby("b")[0]).toMatchObject({totalMl:120,leftMl:40,rightMl:80});pumpRepository.addTotal(item.id,150);expect(pumpRepository.listByBaby("b")[0]).toMatchObject({totalMl:150,leftMl:null,rightMl:null});
});
it.each([[0,80],[80,0],[null,80],[80,null]])("BP10 records one breast or an explicit zero (%s/%s)",(left,right)=>{const item=pump();pumpRepository.addDetail(item.id,left,right);expect(pumpRepository.listByBaby("b")[0]).toMatchObject({leftMl:left,rightMl:right,totalMl:80,needsDetail:false});});
it.each([[-1,80],[80,-1],[NaN,80],[80,Infinity],[0,0],[null,null],[Number.MAX_SAFE_INTEGER,80]])("BP11 rejects invalid splits (%s/%s) without altering the pending event",(left,right)=>{const item=pump();expect(()=>pumpRepository.addDetail(item.id,left,right)).toThrow();expect(pumpRepository.listByBaby("b")[0]).toMatchObject({totalMl:null,needsDetail:true});});
it.each([0,-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])("BP12 rejects invalid pump total %s",total=>{const item=pump();expect(()=>pumpRepository.addTotal(item.id,total)).toThrow();expect(pumpRepository.listByBaby("b")[0]?.totalMl).toBeNull();});
it("BP13 atomic pump edit changes date and volume together and clears an obsolete split",()=>{const item=pump();pumpRepository.addDetail(item.id,40,60);pumpRepository.update(item.id,{startedAt:"2026-11-20T09:00:37Z",totalMl:130});expect(pumpRepository.listByBaby("b")[0]).toMatchObject({startedAt:"2026-11-20T09:00:37Z",totalMl:130,leftMl:null,rightMl:null});});
it("BP14 date-only pumping edit preserves the recorded side breakdown",()=>{const item=pump();pumpRepository.addDetail(item.id,40,60);pumpRepository.update(item.id,{startedAt:"2026-11-20T09:00:37Z"});expect(pumpRepository.listByBaby("b")[0]).toMatchObject({leftMl:40,rightMl:60,totalMl:100});});
it("BP15 clearing a pumping total restores the pending state",()=>{const item=pump();pumpRepository.addTotal(item.id,100);pumpRepository.update(item.id,{totalMl:null});expect(pumpRepository.listByBaby("b")[0]).toMatchObject({leftMl:null,rightMl:null,totalMl:null,needsDetail:true});});
it.each(["bad","2099-01-01T10:00:00Z"])("BP16 invalid pump date %s cannot partially update an amount",date=>{expect(()=>pumpRepository.logPending("b",new Date(date))).toThrow();const item=pump();pumpRepository.addTotal(item.id,90);expect(()=>pumpRepository.update(item.id,{startedAt:date,totalMl:120})).toThrow();expect(pumpRepository.listByBaby("b")[0]).toMatchObject({startedAt:at.toISOString(),totalMl:90});});
it("BP17 invalid side patches and conflicting totals are rejected",()=>{const item=pump();pumpRepository.addTotal(item.id,90);for(const patch of [{leftMl:-1},{leftMl:0},{leftMl:40,totalMl:100}])expect(()=>pumpRepository.update(item.id,patch)).toThrow();expect(pumpRepository.listByBaby("b")[0]?.totalMl).toBe(90);});
it("BP18 totals and edits survive a real SQLite export and reopen",()=>{const b=bottle(75),p=pump();pumpRepository.addDetail(p.id,35,55);const bytes=db.export();db.close();db=new SQL.Database(bytes);expect(bottleRepository.listByBaby("b")[0]).toMatchObject({id:b.id,ml:75});expect(pumpRepository.listByBaby("b")[0]).toMatchObject({id:p.id,leftMl:35,rightMl:55,totalMl:90});});
it("BP19 histories remain isolated and deletion removes only the requested event",()=>{const b=bottle(),p=pump();expect(bottleRepository.listByBaby("other")).toEqual([]);expect(pumpRepository.listByBaby("other")).toEqual([]);bottleRepository.delete(b.id);expect(bottleRepository.listByBaby("b")).toEqual([]);expect(pumpRepository.listByBaby("b")).toHaveLength(1);pumpRepository.delete(p.id);expect(pumpRepository.listByBaby("b")).toEqual([]);});
it("BP20 unknown IDs do not create phantom records",()=>{bottleRepository.update("missing",{ml:90});pumpRepository.addTotal("missing",90);pumpRepository.update("missing",{note:"test"});expect(bottleRepository.listByBaby("b")).toEqual([]);expect(pumpRepository.listByBaby("b")).toEqual([]);});
it("BP21 statistics do not truncate after 200 logs and respect explicit list limits",()=>{
 for(let i=0;i<205;i++){bottle(10);const p=pump();pumpRepository.addTotal(p.id,20);}
 const bottles=bottleRepository.listByBaby("b"),pumps=pumpRepository.listByBaby("b"),now=new Date("2026-11-20T20:00Z");expect(bottles).toHaveLength(205);expect(pumps).toHaveLength(205);expect(bottleRepository.listByBaby("b",5)).toHaveLength(5);expect(pumpRepository.listByBaby("b",5)).toHaveLength(5);
 expect(computeStatusStrip([],pumps,bottles,now)).toMatchObject({todayBottleMl:2050,todayPumpMl:4100});expect(summarizeDay(now,now,[],bottles,pumps,[],[])).toMatchObject({feeds:205,bottleMl:2050,pumpMl:4100});
});
it("BP22 unknown quantities count as a feed but do not invent milk volume",()=>{bottle(null);pump();const now=new Date("2026-11-20T20:00Z");expect(summarizeDay(now,now,[],bottleRepository.listByBaby("b"),pumpRepository.listByBaby("b"),[],[])).toMatchObject({feeds:1,bottleMl:0,pumpMl:0});});

import {migrations} from "@/db/schema";
import {momentRepository} from "@/db/repositories/momentRepository";
let mockDatabase:object;
jest.mock("@/db/client",()=>({getDatabase:()=>mockDatabase}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs=require("sql.js/dist/sql-asm.js");
let SQL:Awaited<ReturnType<typeof initSqlJs>>;
let close:()=>void;
beforeAll(async()=>{SQL=await initSqlJs();});
beforeEach(()=>{
 const db=new SQL.Database();close=()=>db.close();db.run("PRAGMA foreign_keys=ON");for(const m of migrations)for(const s of m.statements)db.run(s);
 for(const id of ["baby","other"])db.run("INSERT INTO babies VALUES (?, 'Liam',NULL,'2026-06-01',0,'2026-06-01')",[id]);
 const query=(sql:string,args:unknown[]=[])=>{const statement=db.prepare(sql);try{statement.bind(args);const rows=[];while(statement.step())rows.push(statement.getAsObject());return rows;}finally{statement.free();}};
 mockDatabase={getAllSync:query,getFirstSync:(sql:string,args:unknown[])=>query(sql,args)[0]??null,runSync:(sql:string,args:unknown[])=>db.run(sql,args)};
});
afterEach(()=>close());
const input={kind:"clap" as const,title:"First clap",occurredAt:new Date("2026-11-20T12:00Z"),photoUri:"profile-photo:synthetic.jpg",note:"A little celebration"};
it("persists, edits and deletes a moment without losing the photo or duplicating it",()=>{
 const id=momentRepository.save("baby",input);
 momentRepository.save("baby",{...input,id,title:"Clapping with mum"});
 expect(momentRepository.list("baby")).toEqual([expect.objectContaining({id,title:"Clapping with mum",photoUri:input.photoUri,note:input.note})]);
 momentRepository.remove("baby",id);expect(momentRepository.list("baby")).toEqual([]);
});
it("does not expose, edit or delete another profile’s moments",()=>{
 const id=momentRepository.save("baby",input);expect(momentRepository.list("other")).toEqual([]);
 expect(()=>momentRepository.save("other",{...input,id})).toThrow("Unknown moment");
 momentRepository.remove("other",id);expect(momentRepository.list("baby")).toHaveLength(1);
});
it("rejects invalid dates, empty titles and overlong notes without writing",()=>{
 for(const patch of [{occurredAt:new Date("2099-01-01")},{occurredAt:new Date("bad")},{title:" "},{note:"a".repeat(2001)}])expect(()=>momentRepository.save("baby",{...input,...patch})).toThrow("Invalid moment");
 expect(momentRepository.list("baby")).toEqual([]);
});

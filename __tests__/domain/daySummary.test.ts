import {summarizeDay} from "@/domain/daySummary";
import {sleepSecondsBetween} from "@/domain/sleep";
import {SleepSession} from "@/db/types";
const sleep=(id:string,start:string,end:string|null,period:"nap"|"night"="night"):SleepSession=>({id,babyId:"b",startedAt:start,endedAt:end,period,createdAt:start,updatedAt:start});
it("splits an overnight session at local midnight and keeps an active nap separate",()=>{
 const now=new Date(2026,10,20,15);
 const overnight=sleep("night",new Date(2026,10,19,22).toISOString(),new Date(2026,10,20,7).toISOString());
 const nap=sleep("nap",new Date(2026,10,20,14).toISOString(),null,"nap");
 const data=summarizeDay(now,now,[],[],[],[overnight,nap],[]);
 expect(data.nightMinutes).toBe(420);expect(data.napMinutes).toBe(60);
 expect(data.events.map(e=>e.kind)).toEqual(["night","nap"]);expect(data.events[1]?.running).toBe(true);
});
it("does not double count overlapping sleep or allow corrupt dates to poison totals",()=>{
 const from=new Date("2026-11-20T00:00Z"),now=new Date("2026-11-20T15:00Z");
 expect(sleepSecondsBetween([sleep("a","2026-11-20T10:00Z","2026-11-20T12:00Z"),sleep("b","2026-11-20T11:00Z","2026-11-20T13:00Z"),sleep("bad","bad",null)],from,now)).toBe(3*3600);
});
it("includes a moment on its day without treating it as a feed",()=>{
 const now=new Date("2026-11-20T15:00Z");const data=summarizeDay(now,now,[],[],[],[],[],[{id:"m",babyId:"b",kind:"clap",title:"First clap!",occurredAt:now.toISOString(),photoUri:"profile-photo:test.jpg",note:null}]);
 expect(data.events[0]?.kind).toBe("moment");expect(data.feeds).toBe(0);
});

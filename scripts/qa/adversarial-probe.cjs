// Diagnostic probes against a disposable SQLite database. Does not touch app/user data.
const fs = require('fs'); const path = require('path'); const ts = require('typescript');
(async () => {
 const SQL = await require('sql.js/dist/sql-asm.js')(); const db = new SQL.Database(); const cache = {};
 const query=(sql,params=[])=>{const s=db.prepare(sql);try{s.bind(params);const rows=[];while(s.step())rows.push(s.getAsObject());return rows;}finally{s.free();}};
 const adapter={runSync:(sql,params)=>db.run(sql,params),getFirstSync:(sql,params)=>query(sql,params)[0]??null,getAllSync:query};
 function load(file) {
  if(file.endsWith('/db/client'))return {getDatabase:()=>adapter};
  if(!file.endsWith('.ts'))file+='.ts'; if(cache[file])return cache[file];
  const out={}; cache[file]=out;
  new Function('exports','require',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS}))(out,ref=>ref.startsWith('.')?load(path.resolve(path.dirname(file),ref)):ref.startsWith('@/')?load(path.resolve('src',ref.slice(2))):require(ref));return out;
 }
 const {migrations}=load(path.resolve('src/db/schema'));for(const m of migrations)for(const s of m.statements)db.run(s);
 const {nursingRepository:n}=load(path.resolve('src/db/repositories/nursingRepository'));const {bottleRepository:b}=load(path.resolve('src/db/repositories/bottleRepository'));const {parseAmount}=load(path.resolve('src/domain/units'));
 n.startSession('qa','left');n.startSession('qa','right');
 const open=n.listByBaby('qa'); const first=open[0]; let futureRejected=false;try { n.stopSession(first.id,new Date(Date.now()+86400000)); } catch { futureRejected=true; }
 let negativeRejected=false;try { b.create({babyId:'qa',ml:-20,milkType:'formula'}); } catch { negativeRejected=true; }
 const findings=[
 {id:'QA-O01',case:'Direct repeated nursing start',expected:'At most one open session',actual:open.length,resolved:open.length===1},
 {id:'QA-O02',case:'Direct nursing stop with future end date',expected:'Reject future end',actual:futureRejected?'Rejected':'Accepted',resolved:futureRejected},
 {id:'QA-O03',case:'Direct bottle repository negative amount',expected:'Reject negative amount',actual:negativeRejected?'Rejected':'Accepted',resolved:negativeRejected},
 {id:'QA-O04',case:'Arabic-Indic amount in volume parser',expected:'Parse 95 ml',actual:parseAmount('٩٥','ml'),resolved:parseAmount('٩٥','ml')===95}
 ];
 fs.writeFileSync('artifacts/qa-2026-11-25/evidence/adversarial-probes.json',JSON.stringify(findings,null,2)); console.log(JSON.stringify(findings,null,2)); db.close(); if(findings.some(x=>!x.resolved))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});

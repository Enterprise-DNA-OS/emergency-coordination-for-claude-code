#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { parseCsv, pick } from './lib/csv.mjs';

// The CLI is the sole ordinary mutation path. Actor labels record attribution,
// not authentication. Database-owner access is for trusted internal operators.
export const commands = {
 help: ['',0], programs:['',0], sites:['',0], resources:['',0], 'request-queue':['',0], 'resource-balance':['',0],
 readiness:['',0], attention:['',0], 'exercise-actions':['',0], 'receipt-register':['',0], compliance:['',0], insights:['',0], imports:['',0],
 show:['',2], history:['',2],
 'add-program':['code name owner kind actor',0], 'add-site':['code name owner jurisdiction actor',0],
 'update-plan':['plan-ref evacuation-ref notification-ref medical-ref communication-ref training-ref test-ref test-interval-days last-test review-due actor',1],
 'add-resource':['code name site item unit quantity inspection-due owner actor',0],
 'update-resource':['quantity inspection-due state note actor',1],
 add:['code name program site item unit quantity owner due priority actor',0],
 approve:['note actor',1], reserve:['code resource quantity actor',1], receive:['receipt actor',1], release:['note actor',1], cancel:['note actor',1],
 'add-action':['code name program owner due actor',0], 'close-action':['evidence actor',1], 'close-program':['note actor',1], log:['note actor',2],
 import:['source mapping dry-run actor',2], export:['out format',0], 'draft-situation':['',1], 'weekly-review':['',0]
};
const entities=['programs','sites','resources','requests','allocations','actions'];
const dataTables=[...entities,'events','imports'];
const readQueries={
 programs:'select code,name,owner,kind,status from programs order by code',
 sites:'select code,name,owner,jurisdiction from sites order by code',
 resources:'select code,name,site,item,unit,quantity,inspection_due,state,owner from resource_balance order by code',
 'request-queue':'select code,name,program,site,quantity,unit,status,reserved,received,unallocated,due from request_queue order by due,code',
 'resource-balance':'select code,item,unit,quantity,reserved,received,available,inspection_due,state from resource_balance order by code',
 readiness:'select code,owner,review_due,next_test,gaps from readiness order by code',
 attention:'select kind,code,owner,due,reason from attention order by due nulls first,code',
 'exercise-actions':'select a.code,a.name,p.code as program,a.owner,a.due,a.status,a.evidence from actions a join programs p on p.id=a.program_id order by a.due,a.code',
 'receipt-register':'select a.code,q.code as request,r.code as resource,a.quantity,r.unit,a.receipt_ref,a.received_by,a.received_at from allocations a join requests q on q.id=a.request_id join resources r on r.id=a.resource_id where a.status=\'received\' order by a.received_at,a.code',
 imports:'select source,file_hash,row_count,actor,created_at from imports order by created_at,id'
};
export function date(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a valid YYYY-MM-DD date');return s;
}
function integer(s,{zero=false}={}){if(!/^\d+$/.test(String(s))||!Number.isSafeInteger(Number(s))||Number(s)>(2**31-1)||Number(s)<(zero?0:1))throw Error('Quantity must be a whole number in range');return Number(s);}
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Missing --${k}`);return o[k].trim();};
const choice=(s,values)=>{if(!values.includes(s))throw Error(`Expected one of: ${values.join(', ')}`);return s;};
function parse(argv){
 const cmd=argv[0]||'help',spec=commands[cmd];if(!spec)throw Error(`Unknown command ${cmd}`);
 const opts={},pos=[];
 for(const a of argv.slice(1)){
  if(!a.startsWith('--')){pos.push(a);continue;}
  const [key,...parts]=a.slice(2).split('='),value=parts.join('=');
  if(!['json',...spec[0].split(' ')].includes(key))throw Error(`Unknown option --${key}`);
  if(key in opts)throw Error(`Duplicate option --${key}`);
  if(['json','dry-run'].includes(key)){if(parts.length)throw Error(`--${key} takes no value`);opts[key]=true;}
  else {if(!parts.length||!value.trim())throw Error(`--${key} needs =value`);opts[key]=value;}
 }
 if(pos.length!==spec[1])throw Error(`Usage: ${cmd} expects ${spec[1]} positional argument(s)`);
 return {cmd,opts,pos};
}
async function resolve(db,entity,ref,{lock=false}={}){
 if(!entities.includes(entity))throw Error(`Entity must be ${entities.join(', ')}`);
 const q=String(ref??'').trim().toLowerCase();if(!q)throw Error('Record reference must not be blank');
 const rows=await db.query(`select * from ${entity} order by code${lock?' for update':''}`);
 const exact=rows.filter(r=>[r.code,r.name,r.id].some(v=>String(v||'').toLowerCase()===q));
 const matches=exact.length?exact:rows.filter(r=>r.id.toLowerCase().startsWith(q)||String(r.name||'').toLowerCase().includes(q));
 if(matches.length!==1)throw Error(matches.length?`Ambiguous ${entity}: ${matches.map(r=>r.code+' '+(r.name||'')).join('; ')}`:`No matching ${entity}: ${ref}`);
 return matches[0];
}
async function audit(db,entity,row,actor,action,detail){await db.query('insert into events(entity_type,entity_id,actor,action,detail) values($1,$2,$3,$4,$5)',[entity,row.id,actor,action,JSON.stringify(detail)]);}
async function insert(db,entity,values,actor){
 const cols=Object.keys(values),params=Object.values(values);
 const [r]=await db.query(`insert into ${entity}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,params);
 await audit(db,entity,r,actor,'add',values);return r;
}
async function activeProgram(db,ref){const p=await resolve(db,'programs',ref,{lock:true});if(p.status!=='active')throw Error('Program is closed');return p;}
function outFile(dir,name,content){const folder=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);fs.mkdirSync(folder,{recursive:true,mode:0o700});const file=path.join(folder,`${name}-${randomUUID()}.md`);fs.writeFileSync(file,content,{flag:'wx',mode:0o600});return {file};}
export function format(data){
 if(Array.isArray(data)){if(!data.length)return '  (none)';return table(data,Object.keys(data[0]).map(key=>({key,label:key,format:v=>v&&typeof v==='object'?JSON.stringify(v):String(v??'')})));}
 return JSON.stringify(data,null,2);
}
export const insightQueries=[
 ['Which approved requests still lack resources?',"select code,name,unallocated,unit from request_queue where status='approved' and unallocated>0 order by code"],
 ['Which requests are past their needed date?',"select code,owner,due from requests where status in ('new','approved') and due<current_date order by due,code"],
 ['Which resources are reserved but not received?',"select a.code,q.code as request,r.code as resource,a.quantity,r.unit from allocations a join requests q on q.id=a.request_id join resources r on r.id=a.resource_id where a.status='reserved' order by a.code"],
 ['Which stock has an overdue inspection?',"select code,available,inspection_due from resource_balance where inspection_due<current_date and state='available' order by code"],
 ['Which sites have incomplete plan evidence?',"select code,gaps from readiness where gaps<>'' order by code"],
 ['Which sites missed their own testing interval?',"select code,last_test,next_test from readiness where next_test<current_date order by code"],
 ['Which exercise actions are overdue and who owns them?',"select code,name,owner,due from actions where status='open' and due<current_date order by code"],
 ['Which imported requests still need a local decision?',"select code,source,source_status,owner from requests where source is not null and status='new' order by code"],
 ['Which owners have both overdue requests and open exercise actions?',"select distinct q.owner from requests q join actions a on a.owner=q.owner where q.status in ('new','approved') and q.due<current_date and a.status='open' order by q.owner"],
 ['Which item demand exceeds inspected available stock?',`with demand as (select item,unit,sum(unallocated) as needed from request_queue where status in ('new','approved') group by item,unit), stock as (select item,unit,sum(available) as available from resource_balance where state='available' and inspection_due>=current_date group by item,unit) select d.item,d.unit,d.needed,coalesce(s.available,0) as available,d.needed-coalesce(s.available,0) as shortage from demand d left join stock s on lower(s.item)=lower(d.item) and lower(s.unit)=lower(d.unit) where d.needed>coalesce(s.available,0) order by d.item,d.unit`]
];
const importFields=['id','name','program','site','item','unit','quantity','owner','due','priority','status'];
const defaultHeaders={id:'Request ID',name:'Request Name',program:'Program Code',site:'Site Code',item:'Resource Type',unit:'Unit',quantity:'Quantity',owner:'Owner',due:'Needed By',priority:'Priority',status:'Status'};
async function importRequests(db,pos,o,actor){
 if(pos[0]!=='salesforce')throw Error('Import supports salesforce report CSV');
 const source=need(o,'source'),bytes=fs.readFileSync(pos[1]);
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('Export or convert the report as UTF-8 CSV');}
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 if(!mapping||Array.isArray(mapping)||typeof mapping!=='object')throw Error('Mapping must be an object');
 for(const [key,v] of Object.entries(mapping))if(!importFields.includes(key)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping key or header: ${key}`);
 const headers={...defaultHeaders,...mapping};const rows=parseCsv(text);if(!rows.length)throw Error('CSV has no records');
 for(const f of importFields)if(!Object.keys(rows[0]).some(k=>k.toLowerCase()===headers[f].toLowerCase()))throw Error(`Missing report column ${headers[f]}; use --mapping`);
 const hash=createHash('sha256').update(bytes).digest('hex');
 const old=await db.query('select row_count from imports where source=$1 and file_hash=$2',[source,hash]);
 if(old.length)return {already_imported:true,rows:old[0].row_count,source};
 const seen=new Set(),plans=[];
 for(const row of rows){
  const f=Object.fromEntries(importFields.map(k=>[k,pick(row,headers[k]).trim()]));
  if(!f.id||seen.has(f.id))throw Error('Missing or duplicate Request ID in import');seen.add(f.id);
  if((await db.query('select id from requests where source=$1 and external_id=$2',[source,f.id])).length)throw Error(`Existing source ID ${f.id}; reconcile changes explicitly, no overwrite`);
  const p=await activeProgram(db,f.program),s=await resolve(db,'sites',f.site);
  for(const k of ['name','item','unit','owner','status'])if(!f[k])throw Error(`Blank import field ${k}`);
  const code='SF-'+createHash('sha256').update(source+'\0'+f.id).digest('hex').slice(0,16);
  plans.push({code,name:f.name,program_id:p.id,site_id:s.id,item:f.item.toLowerCase(),unit:f.unit.toLowerCase(),quantity:integer(f.quantity),owner:f.owner,due:date(f.due),priority:choice(f.priority.toLowerCase(),['routine','urgent']),source,external_id:f.id,source_status:f.status,source_record:JSON.stringify(row)});
 }
 if(!o['dry-run']){
  for(const v of plans)await insert(db,'requests',v,actor);
  await db.query('insert into imports(source,file_hash,row_count,actor) values($1,$2,$3,$4)',[source,hash,plans.length,actor]);
 }
 return {dry_run:!!o['dry-run'],rows:plans.length,source,local_status:'new',source_status_preserved:true};
}
async function execute(db,cmd,pos,o){
 if(cmd==='help')return Object.entries(commands).map(([command,[flags,args]])=>({command,arguments:args,options:flags}));
 if(cmd in readQueries)return db.query(readQueries[cmd]);
 if(cmd==='compliance')return db.query(`select code,jurisdiction,gaps,case when jurisdiction='NZ' then 'NZ-GRWM-14' when jurisdiction='AU' then 'AU-MODEL-43' else 'LOCAL-REVIEW' end as rule,case when gaps='' then 'record checks complete; human review required' else 'evidence review required' end as result from readiness order by code`);
 if(cmd==='insights'){const results=[];for(const [question,sql] of insightQueries)results.push({question,records:await db.query(sql)});return results;}
 if(cmd==='show'||cmd==='history'){
  const r=await resolve(db,pos[0],pos[1]);if(cmd==='history')return db.query('select actor,action,detail,created_at from events where entity_type=$1 and entity_id=$2 order by created_at,id',[pos[0],r.id]);
  const result={record:r};if(pos[0]==='requests')result.allocations=await db.query('select * from allocations where request_id=$1 order by code',[r.id]);return result;
 }
 if(cmd==='export'){
  const target=path.resolve(need(o,'out')),fmt=choice(o.format||'json',['json','csv']);let content;
  if(fmt==='json'){const data={format_version:1,exported_at:new Date().toISOString()};for(const t of dataTables)data[t]=await db.query(`select * from ${t} order by id`);content=JSON.stringify(data,null,2)+'\n';}
  else{const rows=await db.query('select * from request_queue order by code');const cols=['code','name','program','site','item','unit','quantity','priority','owner','due','status','reserved','received','unallocated','source','external_id','source_status'];const quote=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';content=[cols.map(quote).join(','),...rows.map(r=>cols.map(c=>quote(r[c])).join(','))].join('\r\n')+'\r\n';}
  fs.writeFileSync(target,content,{flag:'wx',mode:0o600});return {file:target,format:fmt};
 }
 if(cmd==='draft-situation'){
  const p=await resolve(db,'programs',pos[0]);const q=await db.query('select * from request_queue where program=$1 order by code',[p.code]);const a=await db.query('select code,name,owner,due,status from actions where program_id=$1 order by due,code',[p.id]);
  return outFile('drafts','situation',`# Draft situation record: ${p.name}\n\n${p.kind}. Recorded evidence only. Human review required. No dispatch or notification performed.\n\n## Requests\n\n${format(q)}\n\n## Follow-up\n\n${format(a)}\n`);
 }
 if(cmd==='weekly-review'){
  const sections=[];for(const c of ['request-queue','resource-balance','attention'])sections.push(`## ${c}\n\n${format(await db.query(readQueries[c]))}`);
  return outFile('drafts','weekly-review','# Draft coordination review\n\nRecords for internal review. Confirm current conditions with responsible people.\n\n'+sections.join('\n\n')+'\n');
 }
 const actor=need(o,'actor');
 if(cmd==='import')return importRequests(db,pos,o,actor);
 if(cmd==='add-program')return insert(db,'programs',{code:need(o,'code'),name:need(o,'name'),owner:need(o,'owner'),kind:choice(need(o,'kind'),['exercise','coordination'])},actor);
 if(cmd==='add-site')return insert(db,'sites',{code:need(o,'code'),name:need(o,'name'),owner:need(o,'owner'),jurisdiction:choice(need(o,'jurisdiction'),['NZ','AU','other'])},actor);
 if(cmd==='update-plan'){
  const r=await resolve(db,'sites',pos[0],{lock:true}),v={};
  for(const k of ['plan-ref','evacuation-ref','notification-ref','medical-ref','communication-ref','training-ref','test-ref','test-interval-days','last-test','review-due'])if(k in o)v[k.replaceAll('-','_')]=k==='test-interval-days'?integer(o[k]):['last-test','review-due'].includes(k)?date(o[k]):o[k].trim();
  if(!Object.keys(v).length)throw Error('Provide at least one plan field');
  if(v.last_test && v.last_test>(await db.query('select current_date::text as today'))[0].today)throw Error('Last test cannot be in the future');
  const keys=Object.keys(v);const [row]=await db.query(`update sites set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(v),r.id]);await audit(db,'sites',row,actor,cmd,v);return row;
 }
 if(cmd==='add-resource'){
  const s=await resolve(db,'sites',need(o,'site'));
  return insert(db,'resources',{code:need(o,'code'),name:need(o,'name'),site_id:s.id,item:need(o,'item').toLowerCase(),unit:need(o,'unit').toLowerCase(),quantity:integer(need(o,'quantity'),{zero:true}),inspection_due:date(need(o,'inspection-due')),owner:need(o,'owner')},actor);
 }
 if(cmd==='update-resource'){
  const r=await resolve(db,'resources',pos[0],{lock:true}),note=need(o,'note');const [b]=await db.query('select * from resource_balance where id=$1',[r.id]);
  if(!['quantity','inspection-due','state'].some(k=>k in o))throw Error('Provide a resource field');
  const quantity=o.quantity===undefined?r.quantity:integer(o.quantity,{zero:true});if(quantity<b.reserved+b.received)throw Error('Quantity below committed stock');
  const [row]=await db.query('update resources set quantity=$1,inspection_due=$2,state=$3 where id=$4 returning *',[quantity,o['inspection-due']?date(o['inspection-due']):r.inspection_due,o.state?choice(o.state,['available','withdrawn']):r.state,r.id]);await audit(db,'resources',row,actor,cmd,{note,before:r,after:row});return row;
 }
 if(cmd==='add'||cmd==='add-action'){
  const p=await activeProgram(db,need(o,'program'));const v={code:need(o,'code'),name:need(o,'name'),program_id:p.id,owner:need(o,'owner'),due:date(need(o,'due'))};
  if(cmd==='add-action')return insert(db,'actions',v,actor);
  const s=await resolve(db,'sites',need(o,'site'));return insert(db,'requests',{...v,site_id:s.id,item:need(o,'item').toLowerCase(),unit:need(o,'unit').toLowerCase(),quantity:integer(need(o,'quantity')),priority:choice(need(o,'priority'),['routine','urgent'])},actor);
 }
 if(cmd==='approve'||cmd==='reserve'||cmd==='cancel'){
  const q=await resolve(db,'requests',pos[0],{lock:true});
  if(cmd==='approve'){
   if(q.status!=='new')throw Error('Only new requests can be approved');const note=need(o,'note');
   const [r]=await db.query("update requests set status='approved',approved_by=$1,approval_note=$2,approved_at=now() where id=$3 returning *",[actor,note,q.id]);await audit(db,'requests',r,actor,cmd,{note});return r;
  }
  if(cmd==='cancel'){
   if(!['new','approved'].includes(q.status))throw Error('Request is not open');const note=need(o,'note');
   if((await db.query("select id from allocations where request_id=$1 and status='received'",[q.id])).length)throw Error('Received quantities cannot be cancelled');
   const released=await db.query("update allocations set status='cancelled' where request_id=$1 and status='reserved' returning *",[q.id]);
   for(const r of released)await audit(db,'allocations',r,actor,'cancel',{note});
   const [r]=await db.query("update requests set status='cancelled' where id=$1 returning *",[q.id]);await audit(db,'requests',r,actor,cmd,{note});return r;
  }
  if(q.status!=='approved')throw Error('Request needs local approval before reservation');
  const r=await resolve(db,'resources',need(o,'resource'),{lock:true});const n=integer(need(o,'quantity'));const today=(await db.query('select current_date::text as today'))[0].today;
  if(r.state!=='available'||r.inspection_due<today)throw Error('Resource unavailable or inspection overdue');
  if(r.item.toLowerCase()!==q.item.toLowerCase()||r.unit.toLowerCase()!==q.unit.toLowerCase())throw Error('Item and unit must match request');
  const [b]=await db.query('select * from resource_balance where id=$1',[r.id]),[balance]=await db.query('select * from request_queue where id=$1',[q.id]);
  if(n>b.available)throw Error('Insufficient available stock');if(n>balance.unallocated)throw Error('Reservation exceeds remaining request');
  const a=await insert(db,'allocations',{code:need(o,'code'),request_id:q.id,resource_id:r.id,quantity:n},actor);await audit(db,'requests',q,actor,'reserve',{allocation:a.code,quantity:n,resource:r.code});return a;
 }
 if(cmd==='receive'||cmd==='release'){
  const initial=await resolve(db,'allocations',pos[0]);const q=await resolve(db,'requests',initial.request_id,{lock:true});const a=await resolve(db,'allocations',pos[0],{lock:true});
  if(q.status!=='approved'||a.status!=='reserved')throw Error('Only a reserved allocation on an approved request can change');
  let r;
  if(cmd==='receive'){
   const receipt=need(o,'receipt');[r]=await db.query("update allocations set status='received',receipt_ref=$1,received_by=$2,received_at=now() where id=$3 returning *",[receipt,actor,a.id]);
   const [b]=await db.query('select * from request_queue where id=$1',[q.id]);if(b.received===q.quantity)await db.query("update requests set status='fulfilled' where id=$1",[q.id]);
  }else{need(o,'note');[r]=await db.query("update allocations set status='cancelled' where id=$1 returning *",[a.id]);}
  await audit(db,'allocations',r,actor,cmd,cmd==='receive'?{receipt:o.receipt}:{note:o.note});await audit(db,'requests',q,actor,cmd,{allocation:a.code,quantity:a.quantity});return r;
 }
 if(cmd==='close-action'){
  const a=await resolve(db,'actions',pos[0],{lock:true});if(a.status!=='open')throw Error('Action is already closed');
  const [r]=await db.query("update actions set status='closed',evidence=$1 where id=$2 returning *",[need(o,'evidence'),a.id]);await audit(db,'actions',r,actor,cmd,{evidence:o.evidence});return r;
 }
 if(cmd==='close-program'){
  const p=await activeProgram(db,pos[0]);need(o,'note');
  const open=await db.query("select code from requests where program_id=$1 and status in ('new','approved') union all select code from actions where program_id=$1 and status='open'",[p.id]);
  if(open.length)throw Error('Open work prevents closure: '+open.map(r=>r.code).join(', '));
  const [r]=await db.query("update programs set status='closed' where id=$1 returning *",[p.id]);await audit(db,'programs',r,actor,cmd,{note:o.note});return r;
 }
 if(cmd==='log'){const r=await resolve(db,pos[0],pos[1]);await audit(db,pos[0],r,actor,'note',{note:need(o,'note')});return {code:r.code,logged:true};}
 throw Error('Unhandled command');
}
export async function run(db,argv){
 const {cmd,pos,opts}=parse(argv);
 // One transaction gives reads a consistent snapshot and writes atomicity.
 const writing=commands[cmd][0].split(' ').includes('actor');
 await db.exec(writing?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{const result=await execute(db,cmd,pos,opts);await db.exec(opts['dry-run']?'ROLLBACK':'COMMIT');return result;}
 catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}

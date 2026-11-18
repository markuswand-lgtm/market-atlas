import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {ASSETS,ARCHIVED_IDS} from '../lib/catalog.ts';
import {download} from '../lib/providers.ts';
import {cleanPoints} from '../lib/analytics.ts';
const directory='work/data';await fs.mkdir(directory,{recursive:true});
const bootstrap=[...JSON.parse(gunzipSync(await fs.readFile('data/bootstrap.json.gz'))).series,...JSON.parse(await fs.readFile('data/debt-bootstrap.json','utf8')).series];
const previous=process.env.MARKET_ATLAS_URL;
async function getJson(url){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
let published;
if(previous){try{published=await getJson(new URL('data/manifest.json',previous));if(!/^[a-f0-9]{16}$/.test(published.snapshot))throw new Error('Invalid snapshot');}catch{console.log('No previous publication available; using local cache or original sources.');published=null;}}
let missing=0,failures=0;
for(const asset of ASSETS){
 const filename=directory+'/'+asset.id+'.json';let cached;
 try{cached=JSON.parse(await fs.readFile(filename,'utf8'));}catch{}
 const initial=bootstrap.find(s=>s.id===asset.id);if(initial&&(!cached||initial.retrievedAt>cached.retrievedAt))cached=initial;
 if(published){try{const restored=await getJson(new URL(`data/${published.snapshot}/${asset.id}.json`,previous));if(!cached||restored.retrievedAt>cached.retrievedAt)cached=restored;}catch{}}
 try{
  if(cached&&ARCHIVED_IDS.includes(asset.id)){await fs.writeFile(filename,JSON.stringify(cached));console.log(`${asset.id}: verified archive retained`);continue;}
  let fresh;
  if(asset.provider==='archive'){
   execFileSync(process.env.PYTHON||'python',['scripts/download-gold-history.py'],{stdio:'inherit',timeout:120000});
   const archive=JSON.parse(await fs.readFile(filename,'utf8'));fresh={rows:archive.rows,url:archive.sourceUrl,retrievedAt:archive.retrievedAt};
  }else{
   for(let attempt=0;;attempt++){try{fresh=await download(asset);break;}catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,2000*(attempt+1)));}}
  }
  const rows=cleanPoints([...(cached?.rows||[]),...fresh.rows]);
  const entry={id:asset.id,name:asset.name,sourceName:asset.sourceName,sourceUrl:fresh.url,retrievedAt:fresh.retrievedAt,frequency:asset.frequency,unit:asset.unit,first:rows[0].date,last:rows.at(-1).date,count:rows.length,note:asset.note,rows};
  await fs.writeFile(filename,JSON.stringify(entry));console.log(`${asset.id}: ${rows.length} observations through ${entry.last}`);
 }catch(e){failures++;if(cached?.rows?.length){await fs.writeFile(filename,JSON.stringify({...cached,refreshError:'Source refresh failed'}));console.warn(`${asset.id}: retaining last successful snapshot (${e.message})`);}else{missing++;console.error(`${asset.id}: no usable history (${e.message})`);}}
}
console.log(JSON.stringify({series:ASSETS.length,sourceFailures:failures,missing}));
if(missing)throw new Error('Incomplete initial archive; publication stopped to protect the previous version.');

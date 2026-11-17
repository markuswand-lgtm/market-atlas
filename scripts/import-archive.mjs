import fs from 'node:fs/promises';
import readline from 'node:readline';
import {ASSETS} from '../lib/catalog.ts';
const url=process.argv[2];if(!url||!/^https?:\/\//.test(url))throw new Error('Usage: node scripts/import-archive.mjs <site-origin>');
console.log('Ready for import credentials JSON on stdin (input is hidden).');
if(process.stdin.isTTY&&process.stdin.setRawMode)process.stdin.setRawMode(true);
let input='';for await(const chunk of process.stdin){input+=chunk;if(/[\r\n]/.test(input))break;}
if(process.stdin.isTTY&&process.stdin.setRawMode)process.stdin.setRawMode(false);
const {token}=JSON.parse(input.trim()||'{}');
const headers={'Content-Type':'application/json',...(token?{'OAI-Sites-Authorization':'Bearer '+token}:{})};
async function post(body){const r=await fetch(url+'/api/import',{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error('Import HTTP '+r.status+': '+(await r.text()).slice(0,300));return r.json();}
let failures=0;for(const a of ASSETS){try{const data=JSON.parse(await fs.readFile('work/data/'+a.id+'.json','utf8'));const {job}=await post({id:a.id,action:'begin',retrievedAt:data.retrievedAt});for(let i=0;i<data.rows.length;i+=600)await post({id:a.id,action:'chunk',job,rows:data.rows.slice(i,i+600)});const result=await post({id:a.id,action:'finish',job});console.log(`${a.id}: ${result.count} rows persisted (${result.first} → ${result.last})`);}catch(e){failures++;console.error(a.id+': '+e.message);}}
const r=await fetch(url+'/api/data',{headers});const meta=await r.json();console.log(JSON.stringify({failures,series:meta.series?.length,observations:meta.series?.reduce((n,v)=>n+v.count,0)}));if(failures)process.exitCode=1;


// Unattended HTTP client. Credentials are accepted through hidden stdin only.
const origin=process.argv[2];
if(!origin||!/^https?:\/\//.test(origin))throw new Error('Usage: node scripts/refresh-site.mjs <site-origin> [ids...]');
console.log('Ready for refresh credentials JSON on stdin (input is hidden).');
if(process.stdin.isTTY&&process.stdin.setRawMode)process.stdin.setRawMode(true);
let input='';for await(const chunk of process.stdin){input+=chunk;if(/[\r\n]/.test(input))break;}
if(process.stdin.isTTY&&process.stdin.setRawMode)process.stdin.setRawMode(false);
const {token}=JSON.parse(input.trim()||'{}');input='';
const headers={'Content-Type':'application/json',...(token?{'OAI-Sites-Authorization':'Bearer '+token}:{})};
async function request(path,body){
 const response=await fetch(origin+path,{headers,redirect:'error',...(body?{method:'POST',body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
 const result=await response.json();if(!response.ok)throw new Error(`HTTP ${response.status}: ${result.error||'Request failed'}`);return result;
}
const before=(await request('/api/data')).series,manifest=await request('/api/refresh'),requested=process.argv.slice(3);
if(requested.some(id=>!manifest.ids.includes(id)))throw new Error('Unbekannte Reihe.');
const ids=requested.length?requested:manifest.ids,successful=[],failed=[];
for(const id of ids){
 try{let remaining=1,updated=0,last;
  for(let pass=0;remaining>0&&pass<100;pass++){
   for(let attempt=0;;attempt++){
    try{last=await request('/api/refresh',{id});break;}
    catch(e){if(attempt>=2)throw e;await new Promise(resolve=>setTimeout(resolve,attempt?15000:5000));}
   }
   remaining=last.remaining;updated+=last.updated;
  }
  if(remaining)throw new Error('Unvollständige Aktualisierung.');
  successful.push({id,retrievedAt:last.retrievedAt});console.log(JSON.stringify({id,updated,remaining}));
 }catch(e){failed.push(id);console.error(`${id}: ${e.message}`);}
}
const after=(await request('/api/data')).series;
for(const success of successful){
 const old=before.find(s=>s.id===success.id),row=after.find(s=>s.id===success.id);
 if(!row||row.status!=='ready'||row.retrieved_at<success.retrievedAt||row.count<old.count||row.last_date<old.last_date){failed.push(success.id);console.error(`${success.id}: Readback failed`);}
}
console.log(JSON.stringify({verified:successful.length,failed,series:after.length,observations:after.reduce((sum,s)=>sum+s.count,0)}));
if(failed.length)process.exitCode=1;

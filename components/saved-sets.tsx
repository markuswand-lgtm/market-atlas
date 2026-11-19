'use client';
import {useEffect,useRef,useState} from 'react';
import {AUTH_ENABLED,browserAuth} from '../lib/browser-auth';
import type {Point} from '../lib/analytics';
import type {LabOptions,Variant} from '../lib/strategy-lab';
import JointSearch from './joint-search';
import type {FixedSet,SavedGroup,replay} from '../lib/fixed-sets';
import MultiReplay from './multi-replay';
import HoldoutCharts from './holdout-charts';
import DataTable from './data-table';
type Props={sets:FixedSet[];variants:Variant[];asset:string;points:Point[];from:string;to:string;options:LabOptions;currency:string;loading:boolean};
function storageKey(){return 'market-atlas:saved-strategies:v1:'+(AUTH_ENABLED?browserAuth().currentUser!.uid:'local');}
function readGroups():SavedGroup[]{const data=JSON.parse(localStorage.getItem(storageKey())||'[]');if(!Array.isArray(data))throw Error('Gespeicherte Auswahl ist nicht lesbar.');return data;}
export default function SavedSets({sets,variants,asset,points,from,to,options,currency,loading}:Props){
 const [groups,update]=useState<SavedGroup[]>([]),[id,pick]=useState(''),[name,rename]=useState(''),[message,notify]=useState('');
 const [report,show]=useState<ReturnType<typeof replay>|null>(null),[busy,setBusy]=useState(false);
 const worker=useRef<Worker|null>(null);
 function stop(){worker.current?.terminate();worker.current=null;setBusy(false);}
 useEffect(()=>{try{const g=readGroups();update(g);pick(g.at(-1)?.id||'');}catch(e){notify((e as Error).message);}return ()=>worker.current?.terminate();},[]);
 function persistGroup(group:SavedGroup){
  const next=[...readGroups(),group];localStorage.setItem(storageKey(),JSON.stringify(next));update(next);pick(group.id);rename('');stop();show(null);notify('Auswahl auf diesem Gerät gespeichert.');
 }
 function save(){
  try{
   const group:SavedGroup={id:crypto.randomUUID(),name:name.trim()||asset+' · '+from+' bis '+to,source:asset,from,to,options,sets:sets.map(({variant,settings,color})=>({variant,settings,color}))};
   persistGroup(group);
  }catch(e){notify('Speichern fehlgeschlagen: '+(e as Error).message);}
 }
 const group=groups.find(g=>g.id===id);
 function run(){
  if(!group)return;stop();show(null);notify('');
  try{const w=new Worker(new URL('./replay.worker.ts',import.meta.url),{type:'module'});worker.current=w;setBusy(true);
   w.onmessage=e=>{if(worker.current!==w)return;show(e.data.report??null);notify(e.data.error??'');stop();};
   w.onerror=e=>{notify(e.message||'Test fehlgeschlagen.');stop();};w.postMessage({group,points,from,to,options});
  }catch(e){notify((e as Error).message);stop();}
 }
 const money=(n:number)=>n.toLocaleString('de-DE',{style:'currency',currency});
 const pct=(n:number)=>n.toLocaleString('de-DE',{style:'percent',maximumFractionDigits:2});
 return <section className="lab-settings"><h3>Gespeicherte Parametersätze</h3><div className="strategy-controls">
 <label>Name der Auswahl<input value={name} maxLength={100} onChange={e=>rename(e.target.value)} placeholder="z. B. RSI und SMA"/></label>
 <button className="quiet-button" disabled={!sets.length} onClick={save}>Markierte Parametersätze speichern ({sets.length})</button>
 <label>Gespeicherte Auswahl<select value={id} onChange={e=>{stop();pick(e.target.value);show(null);notify('');}}><option value="">Auswahl wählen</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} ({g.sets.length})</option>)}</select></label>
 <button className="primary-button" disabled={loading||busy||!group} onClick={run}>Ohne Optimierung testen</button>{busy&&<button onClick={stop}>Abbrechen</button>}</div>
 <p>Die Auswahl bleibt in diesem Browser gespeichert. Für den Test gelten das oben gewählte Asset, der Zeitraum, Startkapital, Monatsrate, Gebühren und Slippage.</p>
 {group&&<p>Gespeichert aus {group.source} · {group.from} bis {group.to} · {group.sets.map(s=>s.variant.name).join(', ')}</p>}{message&&<p role="status">{message}</p>}
 <JointSearch key={'joint-'+id} asset={asset} from={from} to={to} variants={variants} saved={group} options={options} save={persistGroup}/>
 {group&&<MultiReplay key={'replay-'+group.id} group={group} asset={asset} from={from} to={to} options={options}/>}
 {report&&<><h4>{asset} · {report.testFrom} bis {report.to}</h4><div className="table-scroll"><DataTable><thead><tr><th>Parametersatz</th><th>Endkapital</th><th>Rendite (TWR)</th><th>Maximaler Drawdown</th></tr></thead><tbody>{[{...report.benchmark,name:'Buy & Hold · Referenz',id:'reference'},...report.results.map(r=>({...r,name:r.variant.name,id:r.variant.id}))].sort((a,b)=>b.capital.at(-1)!.value-a.capital.at(-1)!.value).map(r=><tr key={r.id}><td>{r.name}</td><td>{money(r.capital.at(-1)!.value)}</td><td>{pct(r.gain)}</td><td>{pct(r.drawdown)}</td></tr>)}</tbody></DataTable></div><HoldoutCharts report={report} currency={currency}/></>}
 </section>;
}

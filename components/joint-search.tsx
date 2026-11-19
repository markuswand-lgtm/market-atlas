'use client';
import {useEffect,useRef,useState} from 'react';
import {ASSETS} from '../lib/catalog';
import {apiJson} from '../lib/data-client';
import {labels} from '../lib/batch-search';
import type {Range} from '../lib/multi-replay';
import type {SavedGroup} from '../lib/fixed-sets';
import type {LabOptions,Variant} from '../lib/strategy-lab';
import {goals,validateRanges,type Goal,type jointSearch} from '../lib/joint-search';
import DataTable from './data-table';

type Props={asset:string;from:string;to:string;options:LabOptions;variants:Variant[];saved?:SavedGroup;save:(g:SavedGroup)=>void};
const assets=ASSETS.filter(a=>a.frequency==='daily');
const num=(n:number)=>n.toLocaleString('de-DE',{maximumFractionDigits:2});
function Periods({title,ranges,change}:{title:string;ranges:Range[];change:(r:Range[])=>void}){
 return <fieldset><legend>{title}</legend>{ranges.map((r,i)=><div key={i} className="strategy-controls">{(['from','to'] as const).map(k=><label key={k}>{title} {i+1} · {k==='from'?'von':'bis'}<input type="date" value={r[k]} onInput={e=>change(ranges.map((v,j)=>j===i?{...v,[k]:e.currentTarget.value}:v))} onChange={e=>change(ranges.map((v,j)=>j===i?{...v,[k]:e.target.value}:v))}/></label>)}<button disabled={ranges.length===1} onClick={()=>change(ranges.filter((_,j)=>j!==i))}>Entfernen</button></div>)}<button onClick={()=>change([...ranges,{from:'',to:''}])}>{title} hinzufügen</button></fieldset>;
}
export default function JointSearch({asset,from,to,options,variants,saved,save}:Props){
 const split=Math.floor((Date.parse(from)*0.3+Date.parse(to)*0.7)/86400000)*86400000;
 const date=(offset:number)=>Number.isFinite(split)?new Date(split+offset*86400000).toISOString().slice(0,10):'';
 const [training,train]=useState<Range[]>([{from,to:date(0)}]),[holdout,check]=useState<Range[]>([{from:date(1),to}]);
 const [ids,select]=useState(assets.filter(a=>a.name===asset||a.id==='gold').map(a=>a.id));
 const [source,setSource]=useState('lab'),[goal,setGoal]=useState<Goal>('all'),[limit,setLimit]=useState(128);
 const [report,show]=useState<ReturnType<typeof jointSearch>|null>(null),[status,notify]=useState(''),[error,fail]=useState('');
 const [chosen,pick]=useState<string[]>([]);
 const worker=useRef<Worker|null>(null);
 useEffect(()=>()=>{worker.current?.terminate();worker.current=null;},[]);
 function stop(){worker.current?.terminate();worker.current=null;notify('');}
 function clear(){show(null);fail('');}
 const useSaved=source==='saved'&&!!saved;
 const config=useSaved?{...saved.options,capital:options.capital,monthly:options.monthly,costBps:options.costBps,slippageBps:options.slippageBps}:options;
 const seeds=useSaved?saved.sets:variants.map((variant,i)=>({variant,settings:{},color:'hsl('+i*137+' 72% 72%)'}));
 async function start(){
  clear();stop();
  try{
   validateRanges(training,holdout);
   const w=new Worker(new URL('./joint.worker.ts',import.meta.url),{type:'module'});worker.current=w;notify('Kursdaten laden …');
   w.onmessage=e=>{if(worker.current!==w)return;if(e.data.status){notify(e.data.status);return;}
    if(e.data.report){const r=e.data.report as ReturnType<typeof jointSearch>;show(r);pick(r.results[0]?[r.results[0].set.variant.id]:[]);}
    fail(e.data.error||'');stop();};
   w.onerror=e=>{if(worker.current===w){fail(e.message);stop();}};
   const markets=[];
   for(const a of assets.filter(a=>ids.includes(a.id))){
    try{const data=await apiJson('/api/data?id='+a.id);if(worker.current!==w)return;markets.push({name:a.name,points:data.rows});}
    catch(e){if(worker.current!==w)return;throw Error(a.name+' · '+(e as Error).message);}
   }
   w.postMessage({markets,seeds,training,holdout,options:config,goal,limit});
  }catch(e){fail((e as Error).message);stop();}
 }
 function persist(){
  if(!report)return;
  try{save({id:crypto.randomUUID(),name:'Gemeinsame Optimierung · '+goals[goal],source:assets.filter(a=>ids.includes(a.id)).map(a=>a.name).join(', '),from:training.map(r=>r.from).sort()[0],to:training.map(r=>r.to).sort().at(-1)!,options:config,sets:report.results.filter(r=>chosen.includes(r.set.variant.id)).map(r=>r.set)});}catch(e){fail((e as Error).message);}
 }
 return <details className="lab-settings"><summary>Gemeinsam über Assets und Zeiträume optimieren</summary><fieldset disabled={!!status} onChange={clear}>
 <div className="strategy-controls"><label>Ausgangssätze<select value={source} onChange={e=>setSource(e.target.value)}><option value="lab">Varianten im Strategielabor</option><option disabled={!saved} value="saved">Gespeicherte Auswahl</option></select></label>
 <label>Siegziel<select value={goal} onChange={e=>setGoal(e.target.value as Goal)}>{Object.entries(goals).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label>Kombinationen je Ausgangssatz<select value={limit} onChange={e=>setLimit(+e.target.value)}>{[32,128,512].map(n=><option key={n}>{n}</option>)}</select></label></div>
 <fieldset><legend>Trainings- und Prüfassets</legend><div className="strategy-controls">{assets.map(a=><label key={a.id}><input type="checkbox" checked={ids.includes(a.id)} onChange={e=>select(e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id))}/>{a.name}</label>)}</div></fieldset>
 <Periods title="Trainingszeitraum" ranges={training} change={r=>{clear();train(r);}}/><Periods title="Prüfzeitraum" ranges={holdout} change={r=>{clear();check(r);}}/>
 <p>Jede Kombination aus Asset und Trainingszeitraum zählt einmal. Bei gleicher Siegzahl entscheidet der mittlere Vorsprung im Ziel. Für das gemeinsame Ziel zählt je Fall der kleinste der drei Vorsprünge. Das Endkapital wird relativ zur Referenz verglichen, Rendite und Drawdown in Prozentpunkten.</p>
 <button className="primary-button" disabled={!ids.length||!seeds.length} onClick={start}>Gemeinsame Suche starten</button></fieldset>
 {status&&<p role="status">{status} <button onClick={stop}>Abbrechen</button></p>}{error&&<p role="alert">{error}</p>}
 {report&&<><h4>Trainingsrang und anschließende Prüfung · {goals[goal]}</h4><p>Bis zu drei Parametersätze je Ausgangssatz, geordnet nach Trainingsergebnis. Gleiche Werte gegenüber Buy &amp; Hold zählen als Gleichstand.</p>
 <div className="table-scroll"><DataTable><thead><tr>{['Speichern','Parametersatz','Geprüfte Kombinationen im Training','Trainingssiege','Prüfsiege','Parameter','Einzelne Prüffälle'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{report.results.map(r=><tr key={r.set.variant.id}><td><input type="checkbox" aria-label={r.set.variant.name+' speichern'} checked={chosen.includes(r.set.variant.id)} onChange={e=>pick(e.target.checked?[...chosen,r.set.variant.id]:chosen.filter(x=>x!==r.set.variant.id))}/></td><td>{r.set.variant.name}</td><td>{r.tested}</td><td>{r.wins} / {report.trainCases}</td><td>{r.checks.filter(c=>c.won).length} / {report.checkCases}</td><td>{Object.entries(r.set.settings).map(([k,v])=>(labels[k as keyof typeof labels]||k)+' '+String(v)).join(' · ')}</td><td><details><summary>Ergebnisse ansehen</summary>{r.checks.map(c=><p key={c.asset+c.range.from}><b>{c.asset} · {c.from} bis {c.to}</b><br/>{c.won?'Zielsieg':'Kein Zielsieg'} · Strategie / Buy &amp; Hold<br/>Endkapital {num(c.result.capital)} / {num(c.benchmark.capital)}<br/>Rendite {num(c.result.gain*100)} % / {num(c.benchmark.gain*100)} %<br/>Drawdown {num(c.result.drawdown*100)} % / {num(c.benchmark.drawdown*100)} %</p>)}</details></td></tr>)}</tbody></DataTable></div>
 <button disabled={!chosen.length} onClick={persist}>Markierte Trainingssätze speichern ({chosen.length})</button></>}</details>;
}

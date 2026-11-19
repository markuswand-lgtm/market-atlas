'use client';
import DataTable from './data-table';
import {useEffect,useRef,useState} from 'react';
import type {Point} from '../lib/analytics';
import type {LabOptions,Variant} from '../lib/strategy-lab';
import SavedSets from './saved-sets';
import HoldoutCharts from './holdout-charts';
import {grid,labels,type BatchReport} from '../lib/batch-search';
const pct=(v:number)=>v.toLocaleString('de-DE',{style:'percent',maximumFractionDigits:2});
const valueLabel=(v:unknown)=>({true:'ja',false:'nein',daily:'täglich',weekly:'wöchentlich',monthly:'monatlich'}[String(v)]??String(v));
type Props={asset:string;points:Point[];from:string;to:string;variants:Variant[];options:LabOptions;loading:boolean;currency:string};
export default function BatchSearch({asset,points,from,to,variants,options,loading,currency}:Props){
 const [objective,setObjective]=useState<'capital'|'return'>('capital');
 const [selected,setSelected]=useState<Set<string>>(new Set());
 function toggle(id:string){setSelected(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});}
 const worker=useRef<Worker|null>(null);
 const [limit,setLimit]=useState(128),[status,setStatus]=useState(''),[error,setError]=useState(''),[report,setReport]=useState<BatchReport|null>(null);
 useEffect(()=>()=>worker.current?.terminate(),[]);
 function stop(){worker.current?.terminate();worker.current=null;setStatus('');}
 function start(){
  stop();setError('');setReport(null);
  try{
   const job=new Worker(new URL('./batch.worker.ts',import.meta.url),{type:'module'});worker.current=job;
   job.onmessage=e=>{if(job!==worker.current)return;if(e.data.status){setStatus(e.data.status);return;}if(e.data.report)setSelected(new Set((e.data.report as BatchReport).results.map(r=>r.variant.id+'-0')));setReport(e.data.report??null);setError(e.data.error??'');stop();};
   job.onerror=e=>{setError(e.message||'Die Optimierung konnte nicht abgeschlossen werden.');stop();};
   setStatus('Startet …');job.postMessage({points,from,to,variants,options,limit,objective});
  }catch(e){setError((e as Error).message);stop();}
 }
 const money=(n:number)=>n.toLocaleString('de-DE',{style:'currency',currency});
 const compared=report?.results.flatMap((r,variantIndex)=>r.ranking.flatMap((candidate,index)=>{
  const id=r.variant.id+'-'+index;
  if(!selected.has(id))return [];
  return [{...r,color:'hsl('+((variantIndex*137.5+index*41)%360)+' 72% 72%)',...candidate.holdout,settings:candidate.settings,training:candidate.gain,variant:{...r.variant,id,name:r.variant.name+' · Rang '+(index+1)}}];
 }))??[];
 const balances=report?[{name:'Buy & Hold (Referenz)',end:report.benchmark.capital.at(-1)!.value},...compared.map(r=>({name:r.variant.name,end:r.capital.at(-1)!.value}))]:[];
 const maximum=Math.max(...balances.map(b=>b.end));
 const leaders=balances.filter(b=>b.end===maximum).map(b=>b.name);
 return <section className="lab-settings"><h3>Optimierter Prüfvergleich</h3>
 <p>Jede Variante erhält eigene Signal-, Positions- und Orderparameter. Aktivierte Automatiken gehen gemeinsam in die Suche ein. Kapital, Einzahlungen, Gebühren und Slippage gelten für alle Varianten gleich.</p>
 <div className="strategy-controls"><label>Optimierungsziel<select disabled={!!status} value={objective} onChange={e=>{setObjective(e.target.value as typeof objective);setReport(null);}}><option value="capital">Höchstes Endkapital</option><option value="return">Höchste zeitgewichtete Rendite</option></select></label><label>Suchumfang je Variante<select disabled={!!status} value={limit} onChange={e=>{setLimit(+e.target.value);setReport(null);}}><option value={128}>128 Kombinationen</option><option value={512}>512 Kombinationen</option><option value={0}>Vollständiges Parameterraster</option></select></label>
 <button className="primary-button" disabled={!!status||loading||!variants.length} onClick={start}>Alle Varianten gemeinsam optimieren</button>{status&&<button className="quiet-button" onClick={stop}>Abbrechen</button>}</div>
 <details><summary>Parameter und Umfang ansehen</summary>{variants.map(v=>{const g=grid(v,options);return <p key={v.id}><b>{v.name} · {g.size.toLocaleString('de-DE')} Kombinationen</b><br/>{g.keys.map((k,i)=>labels[k]+': '+g.axes[i].map(valueLabel).join(' / ')).join(' · ')}</p>;})}</details>
 <p className="method-note">Im vollständigen Raster wird jede gültige Kombination geprüft. Die begrenzte Suche testet eine reproduzierbare Auswahl. Das gewählte Ziel gilt im Training nach Kosten, bei Gleichstand der kleinere maximale Drawdown.</p>
 {status&&<p role="status">{status}</p>}{error&&<p role="alert">{error}</p>}
 <SavedSets sets={compared} variants={variants} asset={asset} from={from} to={to} points={points} options={options} currency={currency} loading={loading}/>
 {report&&<><p><b>Höchster Endwert im Prüfzeitraum: {leaders.join(' / ')} · {money(maximum)}</b></p><p>Start {money(options.capital)} · monatlich {money(options.monthly)} · Gebühr {options.costBps} bp · Slippage {options.slippageBps} bp · Buy &amp; Hold {money(report.benchmark.capital.at(-1)!.value)}</p><p>Training {report.from} bis {report.trainingEnd} (70 % der Kurse). Gemeinsamer Prüfzeitraum <b>{report.testFrom} bis {report.to}</b> mit neu gestarteten Depots.</p><details open><summary>Beste Trainingsparameter je Variante · Top 5</summary><div className="table-scroll"><DataTable><thead><tr>{['Vergleichen','Variante','Rang','Endkapital Training','Rendite Training','Max. Drawdown Training','Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{report.results.flatMap(r=>r.ranking.map((c,i)=><tr key={r.variant.id+'-'+i}><td><input type="checkbox" aria-label={r.variant.name+' Rang '+(i+1)+' vergleichen'} checked={selected.has(r.variant.id+'-'+i)} onChange={()=>toggle(r.variant.id+'-'+i)}/></td><td>{r.variant.name}</td><td>{i+1}</td><td>{money(c.capital)}</td><td>{pct(c.gain)}</td><td>{pct(c.drawdown)}</td><td>{Object.entries(c.settings).map(([k,v])=>labels[k as keyof typeof labels]+' '+valueLabel(v)).join(' · ')}</td></tr>))}</tbody></DataTable></div></details><p>{compared.length} Parametersätze im Prüfvergleich · Buy &amp; Hold als Referenz</p><HoldoutCharts report={{...report,results:compared}} currency={currency}/><div className="table-scroll"><DataTable><thead><tr>{['Variante','Endkapital','Prüfrendite (TWR)','Max. Drawdown im Prüfzeitraum','Trainingsrendite','Ausführungen im Prüfzeitraum','Getestet','Eigene Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody><tr><td>Buy &amp; Hold (Referenz)</td><td>{money(report.benchmark.capital.at(-1)!.value)}</td><td>{pct(report.benchmark.gain??0)}</td><td>{pct(report.benchmark.drawdown??0)}</td><td>—</td><td>{report.benchmark.trades}</td><td>—</td><td>100 % · Market</td></tr>{[...compared].sort((a,b)=>b.capital.at(-1)!.value-a.capital.at(-1)!.value).map(r=><tr key={r.variant.id}><td>{r.variant.name}</td><td>{money(r.capital.at(-1)!.value)}</td><td>{pct(r.gain)}</td><td>{pct(r.drawdown)}</td><td>{pct(r.training)}</td><td>{r.trades}</td><td>{r.tested.toLocaleString('de-DE')}</td><td><details><summary>Parametersatz</summary>{Object.entries(r.settings).map(([k,v])=><div key={k}>{labels[k as keyof typeof labels]}: {valueLabel(v)}</div>)}</details></td></tr>)}</tbody></DataTable></div></>}
 </section>;
}

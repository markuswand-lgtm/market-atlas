'use client';
import {useEffect,useRef,useState} from 'react';
import type {Point} from '../lib/analytics';
import type {LabOptions,Variant} from '../lib/strategy-lab';
import HoldoutCharts from './holdout-charts';
import {grid,labels,type BatchReport} from '../lib/batch-search';
const pct=(v:number)=>v.toLocaleString('de-DE',{style:'percent',maximumFractionDigits:2});
const valueLabel=(v:unknown)=>({true:'ja',false:'nein',daily:'täglich',weekly:'wöchentlich',monthly:'monatlich'}[String(v)]??String(v));
type Props={points:Point[];from:string;to:string;variants:Variant[];options:LabOptions;loading:boolean;currency:string};
export default function BatchSearch({points,from,to,variants,options,loading,currency}:Props){
 const [objective,setObjective]=useState<'capital'|'return'>('capital');
 const worker=useRef<Worker|null>(null);
 const [limit,setLimit]=useState(128),[status,setStatus]=useState(''),[error,setError]=useState(''),[report,setReport]=useState<BatchReport|null>(null);
 useEffect(()=>()=>worker.current?.terminate(),[]);
 function stop(){worker.current?.terminate();worker.current=null;setStatus('');}
 function start(){
  stop();setError('');setReport(null);
  try{
   const job=new Worker(new URL('./batch.worker.ts',import.meta.url),{type:'module'});worker.current=job;
   job.onmessage=e=>{if(job!==worker.current)return;if(e.data.status){setStatus(e.data.status);return;}setReport(e.data.report??null);setError(e.data.error??'');stop();};
   job.onerror=e=>{setError(e.message||'Die Optimierung konnte nicht abgeschlossen werden.');stop();};
   setStatus('Startet …');job.postMessage({points,from,to,variants,options,limit,objective});
  }catch(e){setError((e as Error).message);stop();}
 }
 const money=(n:number)=>n.toLocaleString('de-DE',{style:'currency',currency});
 const balances=report?[{name:'Buy & Hold (Referenz)',end:report.benchmark.capital.at(-1)!.value},...report.results.map(r=>({name:r.variant.name,end:r.capital.at(-1)!.value}))]:[];
 const maximum=Math.max(...balances.map(b=>b.end));
 const leaders=balances.filter(b=>b.end===maximum).map(b=>b.name);
 return <section className="lab-settings"><h3>Optimierter Prüfvergleich</h3>
 <p>Jede Variante erhält eigene Signal-, Positions- und Orderparameter. Aktivierte Automatiken gehen gemeinsam in die Suche ein. Kapital, Einzahlungen, Gebühren und Slippage gelten für alle Varianten gleich.</p>
 <div className="strategy-controls"><label>Optimierungsziel<select disabled={!!status} value={objective} onChange={e=>{setObjective(e.target.value as typeof objective);setReport(null);}}><option value="capital">Höchstes Endkapital</option><option value="return">Höchste zeitgewichtete Rendite</option></select></label><label>Suchumfang je Variante<select disabled={!!status} value={limit} onChange={e=>{setLimit(+e.target.value);setReport(null);}}><option value={128}>128 Kombinationen</option><option value={512}>512 Kombinationen</option><option value={0}>Vollständiges Parameterraster</option></select></label>
 <button className="primary-button" disabled={!!status||loading||!variants.length} onClick={start}>Alle Varianten gemeinsam optimieren</button>{status&&<button className="quiet-button" onClick={stop}>Abbrechen</button>}</div>
 <details><summary>Parameter und Umfang ansehen</summary>{variants.map(v=>{const g=grid(v,options);return <p key={v.id}><b>{v.name} · {g.size.toLocaleString('de-DE')} Kombinationen</b><br/>{g.keys.map((k,i)=>labels[k]+': '+g.axes[i].map(valueLabel).join(' / ')).join(' · ')}</p>;})}</details>
 <p className="method-note">Im vollständigen Raster wird jede gültige Kombination geprüft. Die begrenzte Suche testet eine reproduzierbare Auswahl. Das gewählte Ziel gilt im Training nach Kosten, bei Gleichstand der kleinere maximale Drawdown.</p>
 {status&&<p role="status">{status}</p>}{error&&<p role="alert">{error}</p>}
 {report&&<><p><b>Höchster Endwert im Prüfzeitraum: {leaders.join(' / ')} · {money(maximum)}</b></p><p>Start {money(options.capital)} · monatlich {money(options.monthly)} · Gebühr {options.costBps} bp · Slippage {options.slippageBps} bp · Buy &amp; Hold {money(report.benchmark.capital.at(-1)!.value)}</p><p>Training {report.from} bis {report.trainingEnd} (70 % der Kurse). Gemeinsamer Prüfzeitraum <b>{report.testFrom} bis {report.to}</b> mit neu gestarteten Depots.</p><HoldoutCharts report={report} currency={currency}/><div className="table-scroll"><table><thead><tr>{['Variante','Endkapital','Prüfrendite (TWR)','Max. Drawdown im Prüfzeitraum','Trainingsrendite','Ausführungen im Prüfzeitraum','Getestet','Eigene Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{[...report.results].sort((a,b)=>b.capital.at(-1)!.value-a.capital.at(-1)!.value).map(r=><tr key={r.variant.id}><td>{r.variant.name}</td><td>{money(r.capital.at(-1)!.value)}</td><td>{pct(r.gain)}</td><td>{pct(r.drawdown)}</td><td>{pct(r.training)}</td><td>{r.trades}</td><td>{r.tested.toLocaleString('de-DE')}</td><td><details><summary>Parametersatz</summary>{Object.entries(r.settings).map(([k,v])=><div key={k}>{labels[k as keyof typeof labels]}: {valueLabel(v)}</div>)}</details></td></tr>)}</tbody></table></div></>}
 </section>;
}

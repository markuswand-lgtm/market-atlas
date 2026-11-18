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
   setStatus('Startet …');job.postMessage({points,from,to,variants,options,limit});
  }catch(e){setError((e as Error).message);stop();}
 }
 return <section className="lab-settings"><h3>Optimierter Prüfvergleich</h3>
 <p>Jede Variante erhält eigene Signal-, Positions- und Orderparameter. Aktivierte Automatiken gehen gemeinsam in die Suche ein. Kapital, Einzahlungen, Gebühren und Slippage gelten für alle Varianten gleich.</p>
 <div className="strategy-controls"><label>Suchumfang je Variante<select disabled={!!status} value={limit} onChange={e=>{setLimit(+e.target.value);setReport(null);}}><option value={128}>128 Kombinationen</option><option value={512}>512 Kombinationen</option><option value={0}>Vollständiges Parameterraster</option></select></label>
 <button className="primary-button" disabled={!!status||loading||!variants.length} onClick={start}>Alle Varianten gemeinsam optimieren</button>{status&&<button className="quiet-button" onClick={stop}>Abbrechen</button>}</div>
 <details><summary>Parameter und Umfang ansehen</summary>{variants.map(v=>{const g=grid(v,options);return <p key={v.id}><b>{v.name} · {g.size.toLocaleString('de-DE')} Kombinationen</b><br/>{g.keys.map((k,i)=>labels[k]+': '+g.axes[i].map(valueLabel).join(' / ')).join(' · ')}</p>;})}</details>
 <p className="method-note">Im vollständigen Raster wird jede gültige Kombination geprüft. Die begrenzte Suche testet eine reproduzierbare Auswahl. Auswahlkriterium ist die höchste Trainingsrendite nach Kosten, bei Gleichstand der kleinere maximale Drawdown.</p>
 {status&&<p role="status">{status}</p>}{error&&<p role="alert">{error}</p>}
 {report&&<><p>Training {report.from} bis {report.trainingEnd} (70 % der Kurse). Gemeinsamer Prüfzeitraum <b>{report.testFrom} bis {report.to}</b> mit neu gestarteten Depots.</p><HoldoutCharts report={report} currency={currency}/><div className="table-scroll"><table><thead><tr>{['Variante','Prüfrendite (TWR)','Max. Drawdown im Prüfzeitraum','Trainingsrendite','Ausführungen im Prüfzeitraum','Getestet','Eigene Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{[...report.results].sort((a,b)=>b.gain-a.gain).map(r=><tr key={r.variant.id}><td>{r.variant.name}</td><td>{pct(r.gain)}</td><td>{pct(r.drawdown)}</td><td>{pct(r.training)}</td><td>{r.trades}</td><td>{r.tested.toLocaleString('de-DE')}</td><td><details><summary>Parametersatz</summary>{Object.entries(r.settings).map(([k,v])=><div key={k}>{labels[k as keyof typeof labels]}: {valueLabel(v)}</div>)}</details></td></tr>)}</tbody></table></div></>}
 </section>;
}

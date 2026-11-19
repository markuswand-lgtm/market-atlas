'use client';
import {useEffect,useRef,useState} from 'react';
import type {RollingInput,rollingTest} from '../lib/rolling-test';
import {labels} from '../lib/batch-search';
import Chart from './chart';
import DataTable from './data-table';

type Props=Omit<RollingInput,'limit'|'trainMonths'|'testMonths'>&{loading:boolean;currency:string};
export default function RollingTest({loading,currency,...input}:Props){
 const [train,setTrain]=useState(36),[test,setTest]=useState(12),[limit,setLimit]=useState(32);
 const [report,show]=useState<ReturnType<typeof rollingTest>|null>(null),[status,notify]=useState(''),[error,fail]=useState(''),[hidden,hide]=useState<string[]>([]);
 const job=useRef<Worker|null>(null);
 useEffect(()=>()=>job.current?.terminate(),[]);
 function stop(){job.current?.terminate();job.current=null;notify('');}
 function clear(){show(null);fail('');hide([]);}
 function start(){
  clear();stop();
  try{const w=new Worker(new URL('./rolling.worker.ts',import.meta.url),{type:'module'});job.current=w;
   w.onmessage=({data})=>{if(job.current!==w)return;if(data.status){notify(data.status);return;}show(data.report??null);fail(data.error||'');stop();};
   w.onerror=e=>{if(job.current===w){fail(e.message);stop();}};notify('Training läuft …');w.postMessage({...input,trainMonths:train,testMonths:test,limit});
  }catch(e){fail((e as Error).message);stop();}
 }
 const money=(n:number)=>n.toLocaleString('de-DE',{style:'currency',currency});
 return <details className="lab-settings"><summary>Rollierender Test (Walk-forward)</summary>
 <p>{input.asset} · {input.from} bis {input.to}. Asset, Gesamtzeitraum und Strategien werden oben im Strategielabor gewählt.</p>
 <fieldset disabled={!!status}><div className="strategy-controls"><label>Training (Monate)<input type="number" min={1} max={1200} value={train} onChange={e=>{clear();setTrain(+e.target.value);}}/></label><label>Prüfung (Monate)<input type="number" min={1} max={1200} value={test} onChange={e=>{clear();setTest(+e.target.value);}}/></label>
 <label>Suchumfang pro Strategie und Phase<select value={limit} onChange={e=>{clear();setLimit(+e.target.value);}}>{[32,128,512].map(n=><option key={n}>{n}</option>)}</select></label><button className="primary-button" disabled={loading||!input.variants.length||!train||!test} onClick={start}>Rollierenden Test starten</button></div></fieldset>
 <p>Jedes Fenster rückt um die Prüfdauer vor. Der höchste Trainingsgewinn nach Kosten bestimmt die Parameter für die nächste Phase. Das Depot wird am Phasenende zum Schlusskurs mit Kosten glattgestellt. Das Kapital fließt samt Monatsraten in die nächste Phase. Buy &amp; Hold läuft über dieselben Prüfkurse durch. Ein verkürztes Schlussfenster wird ab drei Kursen ausgewertet.</p>
 {status&&<p role="status">{status} <button onClick={stop}>Abbrechen</button></p>}{error&&<p role="alert">{error}</p>}
 {report&&<><h4>Kapitalverlauf der Prüfphasen</h4><p>{report.from} bis {report.to} · {report.phases.length} Prüfphasen · eingezahlt {money(report.paidIn)}</p>
 {report.lines.map(l=><label className="check-option" key={l.id}><input type="checkbox" checked={!hidden.includes(l.id)} onChange={e=>hide(e.target.checked?hidden.filter(id=>id!==l.id):[...hidden,l.id])}/>{l.name} · {money(l.points.at(-1)!.value)}</label>)}
 {report.lines.some(l=>!hidden.includes(l.id))&&<Chart lines={report.lines.filter(l=>!hidden.includes(l.id))} from={report.from} to={report.to} label={'Depotkapital ('+currency+')'}/>}
 <div className="table-scroll"><DataTable><thead><tr>{['Phase','Training von','Training bis','Prüfung von','Prüfung bis','Strategie','Trainingsgewinn','Depot nach Prüfung','Gewählte Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{report.phases.flatMap((p,i)=>p.winners.map((w,j)=><tr key={i+'-'+j}><td>{i+1}</td><td>{p.trainingFrom}</td><td>{p.trainingTo}</td><td>{p.from}</td><td>{p.to}</td><td>{w.name}</td><td>{money(w.trainingProfit)}</td><td>{money(w.end)}</td><td>{Object.entries(w.settings).map(([k,v])=>(labels[k as keyof typeof labels]||k)+' '+String(v)).join(' · ')}</td></tr>))}</tbody></DataTable></div></>}
 </details>;
}

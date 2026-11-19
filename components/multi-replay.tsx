'use client';
import {useEffect,useRef,useState} from 'react';
import {ASSETS} from '../lib/catalog';
import {apiJson} from '../lib/data-client';
import {validDate} from '../lib/analytics';
import type {SavedGroup} from '../lib/fixed-sets';
import type {LabOptions} from '../lib/strategy-lab';
import type {Range,Comparison,compareRanges} from '../lib/multi-replay';
import DataTable from './data-table';
import HoldoutCharts from './holdout-charts';
import StrategyRanking from './strategy-ranking';

const assets=ASSETS.filter(a=>a.frequency==='daily');
const fmt=(v:number)=>v.toLocaleString('de-DE',{maximumFractionDigits:2});
export default function MultiReplay({group,asset,from,to,options}:{group:SavedGroup;asset:string;from:string;to:string;options:LabOptions}){
 const [ids,setIds]=useState(assets.filter(a=>a.name===asset).map(a=>a.id));
 const [ranges,setRanges]=useState<Range[]>(group.testRanges===undefined?[{from,to}]:group.testRanges.length?group.testRanges:[{from:'',to:''}]);
 const [rows,setRows]=useState<Comparison[]>([]),[errors,setErrors]=useState<string[]>([]),[status,setStatus]=useState('');
 const [charts,setCharts]=useState<ReturnType<typeof compareRanges>['charts']>([]),[caseIndex,chooseCase]=useState(0);
 const chart=charts[caseIndex];
 const job=useRef<Worker|null>(null);
 useEffect(()=>()=>{job.current?.terminate();job.current=null;},[]);
 function clear(){setRows([]);setErrors([]);setCharts([]);chooseCase(0);}
 function stop(){job.current?.terminate();job.current=null;setStatus('');}
 function editRange(i:number,key:keyof Range,value:string){clear();setRanges(previous=>previous.map((range,j)=>j===i?{...range,[key]:value}:range));}
 const valid=ranges.every(r=>validDate(r.from)&&validDate(r.to)&&r.from<=r.to);
 const unique=[...new Map(ranges.map(r=>[r.from+'/'+r.to,r])).values()];
 async function run(){
  clear();stop();
  try{
   const worker=new Worker(new URL('./multi-replay.worker.ts',import.meta.url),{type:'module'});job.current=worker;
   const queue=assets.filter(a=>ids.includes(a.id));
   async function next(){
    if(job.current!==worker)return;
    const a=queue.shift();if(!a){stop();return;}
    setStatus(a.name+' · Asset '+(ids.length-queue.length)+' von '+ids.length);
    try{
     const data=await apiJson('/api/data?id='+a.id);
     if(job.current!==worker)return;
     if(!Array.isArray(data.rows))throw Error('Kursdaten fehlen.');
     worker.postMessage({asset:a.name,points:data.rows,ranges:unique,group,options});
    }catch(e){if(job.current!==worker)return;setErrors(old=>[...old,a.name+' · '+(e as Error).message]);void next();}
   }
   worker.onmessage=({data}:{data:ReturnType<typeof compareRanges>})=>{
    if(job.current!==worker)return;
    setCharts(old=>[...old,...data.charts]);setRows(old=>[...old,...data.rows]);setErrors(old=>[...old,...data.errors]);void next();
   };
   worker.onerror=e=>{if(job.current!==worker)return;setErrors(old=>[...old,e.message||'Berechnung fehlgeschlagen.']);stop();};
   await next();
  }catch(e){setErrors([(e as Error).message]);stop();}
 }
 return <details open={group.testRanges!==undefined?true:undefined} className="lab-settings"><summary>Mehrere Assets und Zeiträume testen</summary>
 <p>Für jeden Prüffall werden die gespeicherten Parameter auf das gewählte Asset angewandt. Wähle eigene Prüfzeiträume oder übernimm die Zeiträume aus der gemeinsamen Optimierung.</p>
 <fieldset disabled={!!status}><legend>Assets</legend><div className="strategy-controls">{assets.map(a=><label key={a.id}><input type="checkbox" checked={ids.includes(a.id)} onChange={e=>{clear();setIds(e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id));}}/>{a.name}</label>)}</div></fieldset>
 <fieldset disabled={!!status}><legend>Prüfzeiträume</legend>{ranges.map((r,i)=><div className="strategy-controls" key={i}>{(['from','to'] as const).map(k=><label key={k}>{k==='from'?'Von':'Bis'} · Zeitraum {i+1}<input type="date" value={r[k]} onInput={e=>editRange(i,k,e.currentTarget.value)} onChange={e=>editRange(i,k,e.currentTarget.value)}/></label>)}<button disabled={ranges.length===1} onClick={()=>{clear();setRanges(ranges.filter((_,j)=>j!==i));}}>Zeitraum entfernen</button></div>)}
 <button onClick={()=>{clear();setRanges([...ranges,{from:'',to:''}]);}}>Zeitraum hinzufügen</button></fieldset>
 <button className="primary-button" disabled={!valid||!ids.length||!!status} onClick={run}>Mehrfachvergleich starten</button> {status&&<><span role="status">{status}</span> <button onClick={stop}>Abbrechen</button></>}
 {errors.map((error,i)=><p key={i} role="alert">{error}</p>)}
 {chart&&<section><h4>Kapitalverläufe je Prüffall</h4><label>Asset und Prüfzeitraum<select value={caseIndex} onChange={e=>chooseCase(+e.target.value)}>{charts.map((c,i)=><option key={i} value={i}>{c.asset} · {c.range.from} bis {c.range.to}</option>)}</select></label><p>Gemeinsam ausgewertet von {chart.report.testFrom} bis {chart.report.to}.</p>
 <HoldoutCharts key={caseIndex} report={chart.report} currency={chart.asset==='DAX'?'EUR':chart.asset==='Nikkei 225'?'JPY':'USD'}/></section>}
 {rows.length>0&&<StrategyRanking rows={rows} group={group} expected={ids.length*unique.length}/> }
 {rows.length>0&&<><p>Eine positive Differenz bedeutet einen Vorteil gegenüber Buy &amp; Hold. Beim Drawdown zählt der geringere Verlust. Gleichstände zählen als null Siege. Kapitalbeträge gelten in der jeweiligen Asset-Währung.</p><div className="table-scroll"><DataTable><thead><tr>{['Asset','Gewünscht von','Gewünscht bis','Geprüft von','Geprüft bis','Parametersatz','Siege von 3','Endkapital','Buy & Hold Kapital','Δ Kapital','Rendite','Buy & Hold Rendite','Δ Rendite (Pp.)','Max. Drawdown','Buy & Hold Drawdown','Δ Drawdown (Pp.)'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{rows.map(r=>{const unit=r.asset==='DAX'?' EUR':r.asset==='Nikkei 225'?' JPY':' USD';
 function delta(v:number){return <td className={v>0?'positive':v<0?'negative':''}>{(v>0?'+':'')+fmt(v)}</td>;}
 return <tr key={[r.asset,r.range.from,r.range.to,r.id].join('/')}><td>{r.asset}</td><td>{r.range.from}</td><td>{r.range.to}</td><td>{r.actual.from}</td><td>{r.actual.to}</td><td>{r.name}</td><td>{r.wins}</td><td>{fmt(r.metrics.capital)+unit}</td><td>{fmt(r.benchmark.capital)+unit}</td>{delta(r.delta.capital)}<td>{fmt(r.metrics.gain*100)+' %'}</td><td>{fmt(r.benchmark.gain*100)+' %'}</td>{delta(r.delta.gain*100)}<td>{fmt(r.metrics.drawdown*100)+' %'}</td><td>{fmt(r.benchmark.drawdown*100)+' %'}</td>{delta(r.delta.drawdown*100)}</tr>;})}</tbody></DataTable></div></>}
 </details>;
}

'use client';
import DataTable from './data-table';
import {useState} from 'react';
import {labels,type BatchReport} from '../lib/batch-search';
import Chart from './chart';


const modes={capital:'Kapital',losses:'Drawdown'} as const;
type Mode=keyof typeof modes;
function setting(value:unknown){
 return ({weekly:'wöchentlich',daily:'täglich',monthly:'monatlich',true:'ja',false:'nein'}[String(value)]??String(value));
}
export default function HoldoutCharts({report,currency}:{report:Pick<BatchReport,'testFrom'|'to'|'benchmark'>&{results:(Pick<BatchReport['results'][number],'variant'|'settings'|'capital'|'losses'>&{color:string})[]};currency:string}){
 const [hidden,setHidden]=useState<Set<string>>(()=>new Set());
 const series=[{...report.benchmark,id:'reference',name:'Buy & Hold',color:'#cad3e2',dashPattern:'8 4',description:'Referenz · 100 % investiert · Market'},...report.results.map(r=>({
  capital:r.capital,losses:r.losses,id:'variant-'+r.variant.id,name:r.variant.name,color:r.color,dashPattern:undefined,
  description:[r.variant.order,...Object.entries(r.settings).map(([k,v])=>labels[k as keyof typeof labels]+' '+setting(v))].join(' · ')
 }))];
 function toggle(key:string){setHidden(old=>{const next=new Set(old);if(next.has(key))next.delete(key);else next.add(key);return next;});}
 return <section aria-label="Grafischer Prüfvergleich"><h4>Kurven im Prüfzeitraum</h4>
 <p>Das Depotkapital enthält die monatlichen Einzahlungen. Der Drawdown zeigt den prozentualen Rückgang vom bisherigen Höchststand der um Einzahlungen bereinigten Wertentwicklung.</p>
 <div className="table-scroll"><DataTable><caption>Kurvenlegende und optimierte Parameter</caption><thead><tr><th>Strategie</th><th>Kapital</th><th>Drawdown</th><th>Parametersatz</th></tr></thead><tbody>
 {series.map(s=><tr key={s.id}><th scope="row"><span style={{color:s.color}}>━ </span>{s.name}</th>{(Object.keys(modes) as Mode[]).map(mode=><td key={mode}><input type="checkbox" aria-label={s.name+' · '+modes[mode]} checked={!hidden.has(s.id+mode)} onChange={()=>toggle(s.id+mode)}/></td>)}<td>{s.description}</td></tr>)}</tbody></DataTable></div>
 {(Object.keys(modes) as Mode[]).map(mode=>{const lines=series.filter(s=>!hidden.has(s.id+mode)).map(s=>({id:s.id,name:s.name,color:s.color,dashPattern:s.dashPattern,points:s[mode]}));return <div key={mode}><h4>{modes[mode]}</h4>{lines.length?<Chart lines={lines} from={report.testFrom} to={report.to} showLegend={false} baseline={mode==='losses'?0:undefined} label={mode==='capital'?'Depotkapital ('+currency+')':'Drawdown (%)'}/>:<p>Alle Kurven ausgeblendet.</p>}</div>;})}
 </section>;
}

import {useState} from 'react';
import type {SavedGroup} from '../lib/fixed-sets';
import type {jointSearch} from '../lib/joint-search';
import {labels} from '../lib/batch-search';
import DataTable from './data-table';
type Props={rows:ReturnType<typeof jointSearch>['profitWinners'];options:SavedGroup['options'];testRanges:SavedGroup['testRanges'];save:(group:SavedGroup)=>void};
export default function ProfitWinners({rows,options,testRanges,save}:Props){
 const [selected,select]=useState<number[]>([]),[name,rename]=useState(''),[error,fail]=useState('');
 function storeWinners(){
  const chosen=selected.map(i=>rows[i]);
  if(!chosen.length)return;
  try{
   const id=crypto.randomUUID(),source=[...new Set(chosen.map(r=>r.asset))].join(', ');
   const sets=chosen.map((r,i)=>({...r.set,color:'hsl('+((137.508*i)%360)+' 72% 70%)',variant:{...r.set.variant,id:id+'-'+i,name:r.set.variant.name+' · '+r.asset+' · '+r.from+' bis '+r.to}}));
   save({id,name:name.trim()||'Gewinnmaximierer · '+source,source,from:chosen.map(r=>r.from).sort()[0],to:chosen.map(r=>r.to).sort().at(-1)!,options,sets,testRanges});
  }catch(e){fail((e as Error).message);}
 }
 return <section><h4>Höchster Gewinn je Strategie und Trainingszeitraum</h4>
 <p>Je Asset und Ausgangsvariante steht hier die beste getestete Kombination für den angegebenen Zeitraum. Gewinn = Endkapital abzüglich Startkapital und aller Einzahlungen, nach simulierten Handelskosten. Bei exakt gleichem Gewinn erscheint die zuerst getestete Kombination.</p>
 <div className="table-scroll"><DataTable><thead><tr>{['Auswahl','Strategie','Asset','Von','Bis','Gewinn','Buy & Hold Gewinn','Endkapital','Ø investiert','Handel','Getestet','Gewinnmaximierende Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{rows.map((r,i)=>{const money=(v:number)=>v.toLocaleString('de-DE',{style:'currency',currency:r.asset==='DAX'?'EUR':r.asset==='Nikkei 225'?'JPY':'USD'});
 return <tr key={i}><td><input type="checkbox" aria-label={[r.set.variant.name,r.asset,r.from,r.to,'auswählen'].join(' · ')} checked={selected.includes(i)} onChange={e=>select(e.target.checked?[...selected,i]:selected.filter(n=>n!==i))}/></td><td>{r.set.variant.name}</td><td>{r.asset}</td><td>{r.from}</td><td>{r.to}</td><td>{money(r.result.profit)}</td><td>{money(r.benchmark.profit)}</td><td>{money(r.result.capital)}</td><td>{(100*r.result.exposure).toLocaleString('de-DE',{maximumFractionDigits:2})} %</td><td>{r.result.trades===0?'Null Trades':r.result.trades+' Ausführungen'}{r.result.halted?' · Notbremse ausgelöst':''}</td><td>{r.tested}</td><td>{Object.entries(r.set.settings).map(([k,v])=>(labels[k as keyof typeof labels]||k)+' '+String(v)).join(' · ')}</td></tr>;})}</tbody></DataTable></div><div className="strategy-controls"><label>Name der Gewinnerauswahl<input value={name} maxLength={100} onChange={e=>rename(e.target.value)}/></label><button disabled={!selected.length} onClick={storeWinners}>Gewinnmaximierer speichern ({selected.length})</button></div>{error&&<p role="alert">{error}</p>}</section>;
}

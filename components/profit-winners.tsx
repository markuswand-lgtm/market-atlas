import type {jointSearch} from '../lib/joint-search';
import {labels} from '../lib/batch-search';
import DataTable from './data-table';
export default function ProfitWinners({rows}:{rows:ReturnType<typeof jointSearch>['profitWinners']}){
 return <section><h4>Höchster Gewinn je Strategie und Trainingszeitraum</h4>
 <p>Je Asset und Ausgangsvariante steht hier die beste getestete Kombination für den angegebenen Zeitraum. Gewinn = Endkapital abzüglich Startkapital und aller Einzahlungen, nach simulierten Handelskosten. Bei exakt gleichem Gewinn erscheint die zuerst getestete Kombination.</p>
 <div className="table-scroll"><DataTable><thead><tr>{['Strategie','Asset','Von','Bis','Gewinn','Buy & Hold Gewinn','Endkapital','Ø investiert','Handel','Getestet','Gewinnmaximierende Parameter'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{rows.map((r,i)=>{const money=(v:number)=>v.toLocaleString('de-DE',{style:'currency',currency:r.asset==='DAX'?'EUR':r.asset==='Nikkei 225'?'JPY':'USD'});
 return <tr key={i}><td>{r.set.variant.name}</td><td>{r.asset}</td><td>{r.from}</td><td>{r.to}</td><td>{money(r.result.profit)}</td><td>{money(r.benchmark.profit)}</td><td>{money(r.result.capital)}</td><td>{(100*r.result.exposure).toLocaleString('de-DE',{maximumFractionDigits:2})} %</td><td>{r.result.trades===0?'Null Trades':r.result.trades+' Ausführungen'}{r.result.halted?' · Notbremse ausgelöst':''}</td><td>{r.tested}</td><td>{Object.entries(r.set.settings).map(([k,v])=>(labels[k as keyof typeof labels]||k)+' '+String(v)).join(' · ')}</td></tr>;})}</tbody></DataTable></div></section>;
}

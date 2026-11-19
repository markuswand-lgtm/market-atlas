'use client';
import {useState} from 'react';
import type {Comparison} from '../lib/multi-replay';
import type {SavedGroup} from '../lib/fixed-sets';
import {STRATEGIES} from '../lib/strategy-lab';
import {labels} from '../lib/batch-search';
import {strategyRanking} from '../lib/strategy-ranking';
import DataTable from './data-table';

const num=(v:number)=>v.toLocaleString('de-DE',{maximumFractionDigits:2});
const period=(r:Comparison)=>r.range.from+' bis '+r.range.to;
const keys=['capital','gain','drawdown'] as const;
const titles={capital:'Endkapital',gain:'Rendite',drawdown:'Max. Drawdown'};
function details(r:Comparison){
 const unit=r.asset==='DAX'?' EUR':r.asset==='Nikkei 225'?' JPY':' USD';
 return <details><summary>{r.wins} / 3</summary><p>{r.actual.from} bis {r.actual.to}</p>
 {keys.map(k=>{const scale=k==='capital'?1:100,suffix=k==='capital'?unit:' %';
 return <p key={k}><b>{titles[k]}</b><br/>{num(r.metrics[k]*scale)+suffix} · B&amp;H {num(r.benchmark[k]*scale)+suffix}<br/>
 Differenz {(r.delta[k]>0?'+':'')+num(r.delta[k]*scale)+(k==='capital'?unit:' Pp.')}</p>;})}
 <p>Investitionsquote Ø {num(r.exposure*100)} % · B&amp;H {num(r.holdExposure*100)} %<br/>
 Ausführungen {r.trades} · B&amp;H {r.holdTrades}<br/>Gebühren {num(r.fees)+unit} · B&amp;H {num(r.holdFees)+unit}</p></details>;
}
export default function StrategyRanking({rows,group,expected}:{rows:Comparison[];group:SavedGroup;expected:number}){
 const periods=[...new Set(rows.map(period))];
 const [chosen,choose]=useState('');
 const selected=periods.includes(chosen)?chosen:periods[0];
 const rankings=strategyRanking(rows);
 const cases=rows.filter(r=>period(r)===selected);
 const assets=[...new Set(rows.map(r=>r.asset))];
 const bySet=new Map<string,Map<string,Comparison>>();
 for(const r of cases){const map=bySet.get(r.id)??new Map();map.set(r.asset,r);bySet.set(r.id,map);}
 return <section><h4>Rangliste über alle Testfälle</h4>
 <p>Ein Testfall entspricht einem Asset in einem angeforderten Zeitraum. Rang nach Siegen in allen drei Kennzahlen zugleich. Bei gleicher Anzahl teilen sich Parametersätze einen Rang. Gleichstände mit Buy &amp; Hold zählen als ausgewertete Fälle ohne Sieg in der jeweiligen Kennzahl.</p>
 <div className="table-scroll"><DataTable><thead><tr>{['Rang','Parametersatz','Ausgewertet / geplant','Siege Endkapital','Siege Rendite','Siege Drawdown','Siege in allen drei'].map(h=><th key={h}>{h}</th>)}</tr></thead>
 <tbody>{rankings.map(s=><tr key={s.id}><td>{s.rank}</td><td>{s.name}</td><td>{s.cases} / {expected}</td><td>{s.capital}</td><td>{s.gain}</td><td>{s.drawdown}</td><td>{s.all}</td></tr>)}</tbody></DataTable></div>
 <h4>Bewertungsmatrix je Strategie</h4><label>Zeitraum der Matrix <select value={selected} onChange={e=>choose(e.target.value)}>{periods.map(p=><option key={p}>{p}</option>)}</select></label>
 <p>Jede Zelle zählt die gewonnenen Kennzahlen der gespeicherten Kombination. Öffne sie für Beträge, Abstände zu Buy &amp; Hold, Investitionsquote und Handelskosten. Ein Strich kennzeichnet einen fehlenden Test.</p>
 {STRATEGIES.map(strategy=>{const sets=group.sets.filter(s=>s.variant.strategy===strategy.id);if(!sets.length)return null;
 return <div key={strategy.id}><h5>{strategy.name}</h5><div className="table-scroll"><DataTable><thead><tr><th>Parametersatz</th><th>Kombination</th>{assets.map(a=><th key={a}>{a}</th>)}</tr></thead>
 <tbody>{sets.map(s=><tr key={s.variant.id}><td>{s.variant.name}</td><td><details><summary>{s.variant.order} · Automatik {s.variant.automation?'an':'aus'}</summary>{Object.entries(s.settings).map(([k,v])=><div key={k}>{labels[k as keyof typeof labels]??k} · {typeof v==='boolean'?(v?'ja':'nein'):String(v)}</div>)}</details></td>
 {assets.map(a=>{const r=bySet.get(s.variant.id)?.get(a);return <td key={a}>{r?details(r):'—'}</td>;})}</tr>)}</tbody></DataTable></div></div>;})}</section>;
}

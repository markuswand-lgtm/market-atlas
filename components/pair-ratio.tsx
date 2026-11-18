'use client';
import {useMemo,useState} from 'react';
import type {Point} from '../lib/analytics';
import {ratioSeries,quantile} from '../lib/ratio';
import type {Interval} from '../lib/comparison-matrix';
import Chart,{type ChartLine} from './chart';
type Asset={id:string;name:string;unit:string;frequency:Interval};
type Props={a:Asset;b:Asset;data:Record<string,Point[]>;from:string;to:string};
const number=(n:number|null)=>n==null?'—':n.toLocaleString('de-DE',{maximumSignificantDigits:6});
export default function PairRatio({a,b,data,from,to}:Props){
 const [full,setFull]=useState(true),[normalized,setNormalized]=useState(false),[showQuantiles,setShowQuantiles]=useState(false),[low,setLow]=useState('10'),[high,setHigh]=useState('90');
 const today=new Date().toISOString().slice(0,10),start=full?'0001-01-01':from,end=full?today:to;
 const ratio=useMemo(()=>ratioSeries(data[a.id]||[],data[b.id]||[],a.frequency,b.frequency,start,end,today,normalized),[data,a.id,b.id,a.frequency,b.frequency,start,end,today,normalized]);
 const valid=low.trim()!==''&&high.trim()!==''&&Number.isFinite(Number(low))&&Number.isFinite(Number(high))&&+low>=0&&+high<=100&&+low<=+high;
 const values=useMemo(()=>ratio.points.map(p=>p.value),[ratio]),q1=valid?quantile(values,+low):null,q2=valid?quantile(values,+high):null;
 const first=ratio.points[0]?.date,last=ratio.points.at(-1)?.date;
 const lines:ChartLine[]=[{id:'asset-ratio',name:`${a.name} ÷ ${b.name}`,color:'#83cfee',frequency:ratio.interval,gapDays:ratio.interval==='daily'?7:ratio.interval==='monthly'?62:400,points:ratio.points}];
 if(showQuantiles&&valid&&first&&last)for(const [index,q,p,color] of [[1,q1,low,'#e8b26e'],[2,q2,high,'#c4a3f4']] as const)if(q!==null)lines.push({id:`quantile-${index}`,name:`Q${p} · ${number(q)}`,color,dashPattern:'7 5',points:[{date:first,value:q},{date:last,value:q}]});
 return <div className="pair-ratio"><div className="panel-heading"><div><span className="eyebrow">VERHÄLTNIS IM ZEITVERLAUF</span><h3>{a.name} ÷ {b.name}</h3><p className="muted">{first||'—'} bis {last||'—'} · {ratio.points.length.toLocaleString('de-DE')} gemeinsame {ratio.interval==='daily'?'Tages':ratio.interval==='monthly'?'Monats':'Jahres'}werte</p></div></div>
 <div className="chart-toolbar"><div className="segment" aria-label="Verhältniszeitraum"><button className={full?'on':''} aria-pressed={full} onClick={()=>setFull(true)}>Gesamte gemeinsame Historie</button><button className={!full?'on':''} aria-pressed={!full} onClick={()=>setFull(false)}>Matrixzeitraum</button></div><div className="segment" aria-label="Verhältniswerte"><button className={!normalized?'on':''} aria-pressed={!normalized} onClick={()=>setNormalized(false)}>Quotient A / B</button><button className={normalized?'on':''} aria-pressed={normalized} onClick={()=>setNormalized(true)}>Basis 100</button></div></div>
 <div className="matrix-controls quantile-controls"><label className="check-option"><input type="checkbox" checked={showQuantiles} onChange={e=>setShowQuantiles(e.target.checked)}/> Quantile einblenden</label><label>Unteres Quantil (%)<input type="number" min="0" max="100" step=".1" value={low} onInput={e=>setLow(e.currentTarget.value)} onChange={e=>setLow(e.target.value)}/></label><label>Oberes Quantil (%)<input type="number" min="0" max="100" step=".1" value={high} onInput={e=>setHigh(e.currentTarget.value)} onChange={e=>setHigh(e.target.value)}/></label>{showQuantiles&&valid&&<span>Q{low}: <b>{number(q1)}</b> · Q{high}: <b>{number(q2)}</b></span>}</div>
 {showQuantiles&&!valid&&<p className="notice warning" role="alert">Bitte zwei Prozentwerte zwischen 0 und 100 wählen; das untere Quantil darf nicht über dem oberen liegen.</p>}
 <Chart baseline={normalized?100:undefined} from={full?first:from} to={full?last:to} label={normalized?'Relatives Verhältnis · Start = 100 %':`${a.unit} / ${b.unit}`} lines={lines}/>
 <p className="method-note">Quotient der Quellenwerte am selben Datum, ohne Wechselkursumrechnung. {full?'Der verfügbare gemeinsame Zeitraum wird unabhängig vom Matrixfenster gezeigt.':'Das Diagramm und die Quantile verwenden das gewählte Matrixfenster.'} Die Frequenz richtet sich nach der langsameren der beiden Quellen; fehlende Werte werden nicht aufgefüllt. {ratio.omitted>0?`${ratio.omitted} Werte mit nicht definiertem Quotienten entfallen.`:''} {normalized&&!ratio.normalizable?'Basis 100 benötigt ausschließlich positive Quotienten.':''}</p>
 {showQuantiles&&<p className="method-note">Die horizontalen Quantile werden aus allen {ratio.points.length.toLocaleString('de-DE')} angezeigten Beobachtungen vor der grafischen Verdichtung berechnet (lineare Interpolation, Typ 7). Q{low} / Q{high} beschreiben die historische Verteilung des Verhältnisses. Jeder vorhandene Periodenwert zählt gleich; es sind keine Konfidenzgrenzen und keine Handelssignale. Änderung des Paares, Zeitraums oder Datenstands berechnet sie neu. <a href="https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html" target="_blank" rel="noreferrer">Quantildefinition Typ 7 ↗</a></p>}
 </div>;
}

'use client';
import {useId,useMemo,useState} from 'react';
import {downsample,type Point} from '../lib/analytics';
import {CYCLES,CYCLE_POINTS} from '../lib/cycles';
import {timeDomain} from '../lib/display';
import {valueAxis,timeTicks} from '../lib/chart-axis';

export type ChartLine={id:string;name:string;color:string;points:Point[];dashed?:boolean;dashPattern?:string;gapDays?:number;frequency?:'daily'|'monthly'|'annual'};
const fmt=(n:number)=>new Intl.NumberFormat('de-DE',{notation:Math.abs(n)>99999?'compact':'standard',maximumSignificantDigits:5}).format(n);
type Props={lines:ChartLine[];log?:boolean;cycles?:boolean;cycleKinds?:string[];label?:string;future?:boolean;from?:string;to?:string;baseline?:number};

export default function Chart({lines,log=false,cycles=false,cycleKinds=['A','B','C'],label='Wert',future=false,from,to,baseline}:Props){
 const uid=useId().replace(/:/g,'');
 const [hover,setHover]=useState<number|null>(null);
 const model=useMemo(()=>{
  const valid=lines.map(l=>{const original=l.points.filter(p=>(!log||p.value>0)&&(!from||p.date>=from)&&(!to||p.date<=to));const segments:Point[][]=[];for(const p of original){const last=segments.at(-1),previous=last?.at(-1);if(!last||previous&&l.gapDays&&(Date.parse(p.date)-Date.parse(previous.date))/86400000>l.gapDays)segments.push([p]);else last.push(p);}const reduced=segments.map(s=>downsample(s));return {...l,segments:reduced,points:reduced.flat()};});
  const all=valid.flatMap(l=>l.points);
  if(!all.length)return null;
  let minY=Infinity,maxY=-Infinity;
  for(const p of all){const y=p.value;minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const {minX,maxX}=timeDomain(all,from,to,future&&cycles);
  const axis=valueAxis(minY,maxY,log,baseline);minY=log?Math.log(axis.min):axis.min;maxY=log?Math.log(axis.max):axis.max;
  return {valid,minX,maxX:maxX===minX?maxX+86400000:maxX,minY,maxY,ticks:axis.ticks};
 },[lines,log,cycles,future,from,to,baseline]);

 if(!model)return <div className="chart-empty"><span className="empty-icon">⌁</span><h3>Noch keine Daten im gewählten Zeitraum</h3><p>Historien herunterladen oder Zeitraum und Auswahl anpassen.</p></div>;
 const {minX,maxX,minY,maxY,valid,ticks}=model;
 const W=1120,H=cycles?500:380,L=64,R=25,T=24,B=36,pw=W-L-R;
 const priceBottom=H-B-(cycles?122:0),ph=priceBottom-T,bandTop=priceBottom+20;
 const x=(date:string|number)=>L+((typeof date==='string'?Date.parse(date):date)-minX)/(maxX-minX)*pw;
 const y=(value:number)=>T+(maxY-(log?Math.log(value):value))/(maxY-minY)*ph;
 const cycleY=(kind:string)=>bandTop+(kind==='B'?34:83);
 const path=(p:Point[])=>p.map((v,i)=>`${i?'L':'M'}${x(v.date).toFixed(2)},${y(v.value).toFixed(2)}`).join(' ');
 const hoverDate=hover===null?null:minX+hover*(maxX-minX);
 const nearest=hoverDate===null?[]:valid.filter(l=>!l.dashed&&l.points.length&&hoverDate>=Date.parse(l.points[0].date)&&hoverDate<=Date.parse(l.points.at(-1)!.date)).map(l=>{
  let near=l.points[0];for(const p of l.points)if(Math.abs(Date.parse(p.date)-hoverDate)<Math.abs(Date.parse(near.date)-hoverDate))near=p;
  return {...l,point:near};
 });
 const inRange=(year:number)=>Date.UTC(year,0,1)>=minX&&Date.UTC(year,0,1)<=maxX;
 const showZigzag=cycleKinds.includes('B')&&cycleKinds.includes('C');

 return <div className={`chart-wrap ${cycles?'with-cycles':''}`}>
  <div className="chart-unit">{label}{log?' · logarithmisch':''}</div>
  <svg role="img" aria-label={`Zeitreihendiagramm: ${lines.map(l=>l.name).join(', ')}${cycles?'. Mit historischer Zykluskarte auf gemeinsamer Zeitachse.':''}`} viewBox={`0 0 ${W} ${H}`}
   onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(1,((e.clientX-rect.left)/rect.width*W-L)/pw)));}} onPointerLeave={()=>setHover(null)}>
   <defs>
    <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={valid[0]?.color} stopOpacity=".16"/><stop offset="100%" stopColor={valid[0]?.color} stopOpacity="0"/></linearGradient>
    <clipPath id={`${uid}-plot`}><rect x={L} y={T} width={pw} height={ph}/></clipPath>
    <clipPath id={`${uid}-cycle`}><rect x={L} y={bandTop-2} width={pw} height={104}/></clipPath>
   </defs>
   {ticks.filter(v=>baseline===undefined||Math.abs(v-baseline)>1e-9).map(v=><g key={v}><line x1={L} x2={W-R} y1={y(v)} y2={y(v)} stroke="#35404f" strokeDasharray="3 5"/><text x={L-12} y={y(v)+4} textAnchor="end" fill="#929eaf" fontSize="11">{fmt(v)}</text></g>)}
   {timeTicks(minX,maxX).map(t=><g key={t.value}><line x1={x(t.value)} x2={x(t.value)} y1={T} y2={priceBottom} stroke="#303a48" strokeDasharray="3 5"/><text x={x(t.value)} y={H-9} textAnchor="middle" fill="#929eaf" fontSize="11">{t.label}</text></g>)}
   {baseline!==undefined&&<g aria-label={`Referenzlinie ${baseline}`}><line x1={L} x2={W-R} y1={y(baseline)} y2={y(baseline)} stroke="#c4cfdd" strokeWidth="2" vectorEffect="non-scaling-stroke"/><text x={L-12} y={y(baseline)+4} textAnchor="end" fill="#e5edf7" fontSize="11" fontWeight="700">{fmt(baseline)}{baseline===100?' %':''}</text></g>}
   <g clipPath={`url(#${uid}-plot)`}>
    {cycles&&Object.entries(CYCLES).filter(([k])=>cycleKinds.includes(k)).flatMap(([key,c])=>c.years.filter(inRange).map(year=><g key={`${key}-${year}`}><line x1={x(Date.UTC(year,0,1))} x2={x(Date.UTC(year,0,1))} y1={T} y2={priceBottom} stroke={c.color} strokeOpacity={key==='A'?.45:.18} strokeDasharray="4 6"/><text x={x(Date.UTC(year,0,1))+4} y={T+12+(['A','B','C'].indexOf(key)*14)} fontSize="10" fill={c.color}>{key} {year}</text></g>))}
    {valid[0]?.points.length>1&&valid[0].segments.length===1&&valid.length<3&&<path d={`${path(valid[0].points)} L${x(valid[0].points.at(-1)!.date)},${priceBottom} L${x(valid[0].points[0].date)},${priceBottom} Z`} fill={`url(#${uid}-fill)`}/>}
    {valid.map(l=><path key={l.id} d={l.segments.map(segment=>path(segment)).join(' ')} fill="none" stroke={l.color} strokeWidth={l.dashed?1.6:2} strokeDasharray={l.dashPattern||(l.dashed?'7 5':undefined)} vectorEffect="non-scaling-stroke"/>)}
    {hoverDate!==null&&<line x1={x(hoverDate)} x2={x(hoverDate)} y1={T} y2={priceBottom} stroke="#a6afbd" strokeDasharray="3 4"/>}
    {nearest.map(l=><circle key={l.id} cx={x(l.point.date)} cy={y(l.point.value)} r="4" fill={l.color} stroke="#161b23" strokeWidth="2"/>)}
   </g>
   {cycles&&<g aria-label="Historischer Zyklusverlauf, schematisch ohne Preisskala">
    <rect x={L} y={bandTop-2} width={pw} height="104" rx="5" fill="#211f22"/>
    <text x={L+10} y={bandTop+12} fontSize="10" fill="#b2a58e">ZYKLUSKARTE · schematisch, keine Preisskala</text>
    <g clipPath={`url(#${uid}-cycle)`}>
     <line x1={L} x2={W-R} y1={cycleY('B')} y2={cycleY('B')} stroke="#514537" strokeOpacity=".45"/>
     <line x1={L} x2={W-R} y1={cycleY('C')} y2={cycleY('C')} stroke="#334d42" strokeOpacity=".6"/>
     {showZigzag&&<polyline points={CYCLE_POINTS.map(p=>`${x(Date.UTC(p.year,0,1))},${cycleY(p.kind)}`).join(' ')} fill="none" stroke="#c2b08c" strokeWidth="1.7" vectorEffect="non-scaling-stroke"/>}
     {CYCLE_POINTS.filter(p=>cycleKinds.includes(p.kind)&&inRange(p.year)).map(p=><g key={`${p.kind}-${p.year}`}><circle cx={x(Date.UTC(p.year,0,1))} cy={cycleY(p.kind)} r="3.2" fill={CYCLES[p.kind].color}/><text x={x(Date.UTC(p.year,0,1))} y={cycleY(p.kind)+(p.kind==='B'?-7:15)} textAnchor="middle" fontSize="10" fill={CYCLES[p.kind].color}>{p.kind} {p.year}</text></g>)}
     {cycleKinds.includes('A')&&CYCLES.A.years.filter(inRange).map(year=><path key={year} d={`M${x(Date.UTC(year,0,1))-5},${bandTop+18} L${x(Date.UTC(year,0,1))},${bandTop+8} L${x(Date.UTC(year,0,1))+5},${bandTop+18}`} fill={CYCLES.A.color}/>)}
     {hoverDate!==null&&<line x1={x(hoverDate)} x2={x(hoverDate)} y1={bandTop} y2={bandTop+103} stroke="#b8b0a1" strokeDasharray="3 4"/>}
    </g>
   </g>}
  </svg>
  {hoverDate!==null&&<div className="chart-tooltip"><b>{new Date(hoverDate).toLocaleDateString('de-DE')}</b>{!nearest.length&&<p>Keine Beobachtung in diesem Zeitraum</p>}{nearest.map(l=><div key={l.id}><span style={{color:l.color}}>● {l.name}</span><strong>{fmt(l.point.value)}</strong><small>{l.frequency==='annual'?`${l.point.date.slice(0,4)} · Jahreswert`:l.frequency==='monthly'?l.point.date.slice(0,7):l.point.date}</small></div>)}</div>}
  <div className="chart-legend">{lines.map(l=><span key={l.id}><svg width="25" height="10" aria-hidden="true" style={{width:25,height:10}}><line x1="0" x2="25" y1="5" y2="5" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashPattern||(l.dashed?'7 5':undefined)}/></svg>{l.name}{l.dashed?' · Trend':''}</span>)}{cycles&&Object.entries(CYCLES).filter(([k])=>cycleKinds.includes(k)).map(([k,c])=><span key={k}><i style={{background:c.color}}/>{k} · {c.label}</span>)}</div>
 </div>;
}

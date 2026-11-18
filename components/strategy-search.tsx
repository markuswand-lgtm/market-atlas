'use client';
import {useState} from 'react';
import {cleanPoints,type Point} from '../lib/analytics';
import {runVariant,validateLab,warmup,type Variant,type LabOptions} from '../lib/strategy-lab';
type Patch=Partial<LabOptions>;
function suggestions(id:Variant['strategy']):Patch[]{
 switch(id){
 case 'sma':case 'ema':case 'contrarian':return [10,20,50].flatMap(fast=>[80,120,200].map(slow=>({fast,slow})));
 case 'rsi':return [7,14,21].flatMap(lookback=>[20,30,40].map(rsiLow=>({lookback,rsiLow,rsiHigh:100-rsiLow})));
 case 'bollinger':return [10,20,40].flatMap(lookback=>[1.5,2,2.5].map(band=>({lookback,band})));
 case 'grid':return [20,60,120].flatMap(lookback=>[3,5,10].map(gridStep=>({lookback,gridStep})));
 case 'momentum':case 'breakout':return [10,20,40,60,120,252].map(lookback=>({lookback}));
 default:return [50,75,100].map(allocation=>({allocation}));
 }
}
const labels:Record<string,string>={fast:'Schnell',slow:'Langsam',lookback:'Fenster',rsiLow:'RSI unten',rsiHigh:'RSI oben',band:'Bandbreite',gridStep:'Stufengröße (%)',allocation:'Investitionsquote (%)'};
const describe=(p:Patch)=>Object.entries(p).map(([k,v])=>labels[k]+' '+v).join(' · ');
const percent=(v:number)=>v.toLocaleString('de-DE',{style:'percent',maximumFractionDigits:2});
type Props={points:Point[];from:string;to:string;variants:Variant[];options:LabOptions;apply:(p:Patch)=>void};
export default function StrategySearch({points,from,to,variants,options,apply}:Props){
 const [id,select]=useState(variants[0]?.id||'');
 const variant=variants.find(v=>v.id===id)||variants[0];
 const [report,setReport]=useState<{patch:Patch;train:number;test:number;count:number;start:string;split:string;end:string}|null>(null);
 const [error,setError]=useState('');
 if(!variant)return null;
 const presets=suggestions(variant.strategy);
 function optimize(){
  setReport(null);setError('');
  try{
   validateLab(options);
   const p=cleanPoints(points.filter(p=>p.date<=to));
   const candidates=[...presets, Object.fromEntries(Object.keys(presets[0]).map(k=>[k,options[k as keyof LabOptions]])) as Patch];
   const warm=Math.max(...candidates.map(v=>warmup(variant.strategy,{...options,...v})));
   const start=p.findIndex((v,i)=>i>=warm&&v.date>=from);
   const end=p.length-1,split=start+Math.floor((end-start+1)*0.7);
   if(start<0||end-start<19)throw Error('Mindestens 20 Kurse nach der gemeinsamen Aufwärmphase erforderlich.');
   if(p.slice(start-warm).some(v=>v.value<=0))throw Error('Die Simulation erfordert positive Kurse.');
   const score=(patch:Patch,a:number,b:number)=>runVariant(p.slice(0,b+1),a,b,variant,{...options,...patch}).returnCurve.at(-1)!.value/100-1;
   const ranked=candidates.map(patch=>({patch,train:score(patch,start,split-1)})).sort((a,b)=>b.train-a.train);
   setReport({...ranked[0],test:score(ranked[0].patch,split,end),count:ranked.length,start:p[start].date,split:p[split].date,end:p[end].date});
  }catch(e){setError((e as Error).message);}
 }
 return <details className="lab-settings"><summary>Parameter vorschlagen und optimieren</summary><div className="strategy-controls"><label>Variante<select value={variant.id} onChange={e=>{select(e.target.value);setReport(null);setError('');}}>{variants.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label><button className="quiet-button" onClick={optimize}>Im Vergleichszeitraum optimieren</button></div><p>Startvorschlag: {describe(presets[Math.floor(presets.length/2)])}. Die Suche maximiert die zeitgewichtete Rendite nach Kosten in den ersten 70 % der Testkurse. Die letzten 30 % prüfen die gewählten Parameter separat.</p>{error&&<p role="alert">{error}</p>}{report&&<div><b>{describe(report.patch)}</b><p>{report.count} Kandidaten · Training ab {report.start}: {percent(report.train)} · Prüfzeitraum {report.split} bis {report.end}: {percent(report.test)}</p><button className="quiet-button" onClick={()=>apply(report.patch)}>Für die gemeinsamen Strategieparameter übernehmen</button></div>}</details>;
}

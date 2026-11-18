import type {Point} from './analytics.ts';
import {matchSamples,sampleSeries,type Interval} from './comparison-matrix.ts';
export function quantile(values:number[],percent:number):number|null{
 if(!Number.isFinite(percent)||percent<0||percent>100)return null;
 const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;
 const h=(sorted.length-1)*percent/100,low=Math.floor(h),high=Math.ceil(h);
 return sorted[low]+(sorted[high]-sorted[low])*(h-low);
}
export function ratioSeries(a:Point[],b:Point[],frequencyA:Interval,frequencyB:Interval,from:string,to:string,asOf:string,normalized=false){
 const interval:Interval=[frequencyA,frequencyB].includes('annual')?'annual':[frequencyA,frequencyB].includes('monthly')?'monthly':'daily';
 const matched=matchSamples(sampleSeries(a,frequencyA,interval,asOf),sampleSeries(b,frequencyB,interval,asOf),from,to);
 const raw=matched.filter(p=>p.b!==0).map(p=>({date:p.date,value:p.a/p.b})).filter(p=>Number.isFinite(p.value));
 const positive=raw.length>0&&raw.every(p=>p.value>0),base=raw[0]?.value;
 return {interval,points:normalized?(positive?raw.map(p=>({...p,value:p.value/base*100})):[]):raw,omitted:matched.length-raw.length,normalizable:positive};
}

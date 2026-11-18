import type {Point} from './analytics.ts';
import {matchSamples,sampleSeries,type Interval} from './comparison-matrix.ts';
export function quantile(values:number[],percent:number):number|null{
 if(!Number.isFinite(percent)||percent<0||percent>100)return null;
 const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;
 const h=(sorted.length-1)*percent/100,low=Math.floor(h),high=Math.ceil(h);
 return sorted[low]+(sorted[high]-sorted[low])*(h-low);
}
export function rollingQuantiles(points:Point[],years:number,percentages:[number,number]){
 if(!Number.isInteger(years)||years<1||years>200||percentages.some(p=>!Number.isFinite(p)||p<0||p>100))return [[],[]] as [Point[],Point[]];
 const out:[Point[],Point[]]=[[],[]],sorted:number[]=[];let left=0;
 const position=(v:number)=>{let lo=0,hi=sorted.length;while(lo<hi){const mid=(lo+hi)>>>1;if(sorted[mid]<v)lo=mid+1;else hi=mid;}return lo;};
 for(let i=0;i<points.length;i++){
  const p=points[i],date=new Date(p.date+'T00:00:00Z'),year=date.getUTCFullYear()-years,month=date.getUTCMonth(),day=Math.min(date.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate()),cutoff=new Date(Date.UTC(year,month,day)).toISOString().slice(0,10);
  sorted.splice(position(p.value),0,p.value);
  while(left<=i&&points[left].date<cutoff){sorted.splice(position(points[left].value),1);left++;}
  // Require the full calendar lookback; do not label a partial opening sample as 10 years.
  if(cutoff<points[0].date||sorted.length<2)continue;
  percentages.forEach((percent,k)=>{const h=(sorted.length-1)*percent/100,lo=Math.floor(h),hi=Math.ceil(h);out[k].push({date:p.date,value:sorted[lo]+(sorted[hi]-sorted[lo])*(h-lo)});});
 }
 return out;
}
export function ratioSeries(a:Point[],b:Point[],frequencyA:Interval,frequencyB:Interval,from:string,to:string,asOf:string,normalized=false){
 const interval:Interval=[frequencyA,frequencyB].includes('annual')?'annual':[frequencyA,frequencyB].includes('monthly')?'monthly':'daily';
 const matched=matchSamples(sampleSeries(a,frequencyA,interval,asOf),sampleSeries(b,frequencyB,interval,asOf),from,to);
 const raw=matched.filter(p=>p.b!==0).map(p=>({date:p.date,value:p.a/p.b})).filter(p=>Number.isFinite(p.value));
 const positive=raw.length>0&&raw.every(p=>p.value>0),base=raw[0]?.value;
 return {interval,points:normalized?(positive?raw.map(p=>({...p,value:p.value/base*100})):[]):raw,omitted:matched.length-raw.length,normalizable:positive};
}

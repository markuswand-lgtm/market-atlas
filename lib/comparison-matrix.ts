import {cleanPoints,validDate,type Point} from './analytics.ts';

export type Interval='daily'|'monthly'|'annual';
export type MatrixMetric='correlation'|'relative';
export type Sample=Point & {sourceDate:string; ordinal:number};
export type Matched={date:string;a:number;b:number;sourceA:string;sourceB:string;ordinal:number};
export type PairResult={correlation:number|null;relative:number|null;changeA:number|null;changeB:number|null;count:number;skipped:number;first:string;last:string;matched:Matched[];reason:string};
export const MIN_PAIRS:Record<Interval,number>={daily:20,monthly:6,annual:5};
const DAY=86400000;
export function monthIndex(date:string){return Number(date.slice(0,4))*12+Number(date.slice(5,7))-1;}
export function monthStart(index:number){return `${Math.floor(index/12)}-${String(index%12+1).padStart(2,'0')}-01`;}
export function monthEnd(index:number){return new Date(Date.UTC(Math.floor(index/12),index%12+1,0)).toISOString().slice(0,10);}
export function effectiveInterval(frequencies:Interval[],requested:Interval|'auto',from?:string,to?:string):Interval{
 const years=from&&to&&validDate(from)&&validDate(to)?(Date.parse(to)-Date.parse(from))/(DAY*365.2425):10;
 const automatic:Interval=years<=3?'daily':years<=40?'monthly':'annual';
 const desired=requested==='auto'?automatic:requested;
 if(frequencies.includes('annual'))return 'annual';
 if(frequencies.includes('monthly'))return desired==='annual'?'annual':'monthly';
 return desired;
}

// Relative strength uses a normalized ratio, not a currency conversion.
export function relativePath(matched:Matched[]):Point[]{
 if(matched.length<2||matched.some(p=>p.a<=0||p.b<=0))return [];
 const base=matched[0];
 const points=matched.map(p=>({date:p.date,value:100*(p.a/base.a)/(p.b/base.b)}));
 return points.every(p=>Number.isFinite(p.value))?points:[];
}
export function extrema(points:Point[]){
 if(!points.length)return {min:null,max:null};
 return points.reduce<{min:Point|null;max:Point|null}>((r,p)=>({min:!r.min||p.value<r.min.value?p:r.min,max:!r.max||p.value>r.max.value?p:r.max}),{min:null,max:null});
}
export function assetComparisons(focus:string,ids:string[],sampled:Record<string,Sample[]>,from:string,to:string,interval:Interval){
 return ids.filter(id=>id!==focus).map(id=>{const pair=comparePair(sampled[focus]||[],sampled[id]||[],from,to,interval),path=relativePath(pair.matched);return {id,pair,path,...extrema(path)};});
}

// Never upsample or carry values across missing periods. Annual drawing dates are
// mapped to year-end, so a January key is not mistaken for a known annual result.
export function sampleSeries(rows:Point[],native:Interval,interval:Interval,asOf:string):Sample[]{
 const rank={daily:0,monthly:1,annual:2};
 if(rank[native]>rank[interval]||!validDate(asOf))return [];
 const buckets=new Map<string,Sample>();
 for(const p of cleanPoints(rows)){
  const date=interval==='annual'?p.date.slice(0,4)+'-12-31':interval==='monthly'?monthEnd(monthIndex(p.date)):p.date;
  if(date>asOf)continue;
  // A truncated daily series must not masquerade as a full month/year.
  if(native==='daily'&&interval!=='daily'&&(Date.parse(date)-Date.parse(p.date))/DAY>7)continue;
  if(native==='monthly'&&interval==='annual'&&p.date.slice(5,7)!=='12')continue;
  const ordinal=interval==='annual'?Number(date.slice(0,4)):interval==='monthly'?monthIndex(date):Date.parse(date)/DAY;
  buckets.set(date,{...p,date,sourceDate:p.date,ordinal});
 }
 return [...buckets.values()];
}

export function matchSamples(a:Sample[],b:Sample[],from:string,to:string):Matched[]{
 const byDate=new Map(b.filter(p=>p.date>=from&&p.date<=to).map(p=>[p.date,p]));
 return a.filter(p=>p.date>=from&&p.date<=to).flatMap(p=>{const q=byDate.get(p.date);return q?[{date:p.date,a:p.value,b:q.value,sourceA:p.sourceDate,sourceB:q.sourceDate,ordinal:p.ordinal}]:[];});
}

export function pearson(x:number[],y:number[]):number|null{
 if(x.length<2||x.length!==y.length||x.some(v=>!Number.isFinite(v))||y.some(v=>!Number.isFinite(v)))return null;
 const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;
 let cov=0,vx=0,vy=0;for(let i=0;i<x.length;i++){cov+=(x[i]-mx)*(y[i]-my);vx+=(x[i]-mx)**2;vy+=(y[i]-my)**2;}
 const tolerance=1e-24*x.length;
 return vx<=tolerance||vy<=tolerance?null:Math.max(-1,Math.min(1,cov/Math.sqrt(vx*vy)));
}

export function comparePair(a:Sample[],b:Sample[],from:string,to:string,interval:Interval):PairResult{
 const matched=matchSamples(a,b,from,to),x:number[]=[],y:number[]=[];let skipped=0;
 for(let i=1;i<matched.length;i++){
  const p=matched[i-1],q=matched[i],distance=q.ordinal-p.ordinal;
  if(distance<=0||distance>(interval==='daily'?7:1)||p.a<=0||p.b<=0||q.a<=0||q.b<=0){skipped++;continue;}
  const ra=q.a/p.a-1,rb=q.b/p.b-1;
  if(!Number.isFinite(ra)||!Number.isFinite(rb)){skipped++;continue;}
  x.push(ra);y.push(rb);
 }
 const first=matched[0],last=matched.at(-1),positive=matched.length>=2&&matched.every(p=>p.a>0&&p.b>0);
 const rawA=positive?last!.a/first!.a-1:null,rawB=positive?last!.b/first!.b-1:null;
 const changeA=rawA!==null&&Number.isFinite(rawA)?rawA:null,changeB=rawB!==null&&Number.isFinite(rawB)?rawB:null;
 const relative=changeA!==null&&changeB!==null?(changeA-changeB)*100:null;
 const correlation=x.length>=MIN_PAIRS[interval]?pearson(x,y):null;
 const reason=matched.length<2?'Keine zwei gemeinsamen Perioden':x.length<MIN_PAIRS[interval]?`Zu wenige gemeinsame Veränderungen (${x.length}/${MIN_PAIRS[interval]})`:correlation===null?'Konstante Veränderungen: Korrelation nicht definiert':'';
 return {correlation,relative:relative!==null&&Number.isFinite(relative)?relative:null,changeA,changeB,count:x.length,skipped,first:first?.date||'',last:last?.date||'',matched,reason};
}

export function buildMatrix(ids:string[],sampled:Record<string,Sample[]>,from:string,to:string,interval:Interval){
 const result:PairResult[][]=ids.map(()=>[]);
 for(let i=0;i<ids.length;i++)for(let j=i;j<ids.length;j++){
  const r=comparePair(sampled[ids[i]]||[],sampled[ids[j]]||[],from,to,interval);
  // Detailed matched observations are recomputed only for the selected pair.
  result[i][j]={...r,matched:[]};
  if(i!==j)result[j][i]={...r,relative:r.relative===null?null:-r.relative,changeA:r.changeB,changeB:r.changeA,matched:[]};
 }
 return result;
}

export const PALETTES={
 ocean:{name:'Orange · Blau',negative:'#f5ad69',neutral:'#222b3c',positive:'#78c8ee'},
 mint:{name:'Rose · Mint',negative:'#ed969f',neutral:'#252936',positive:'#79d4b1'},
 violet:{name:'Gold · Violett',negative:'#e9c16a',neutral:'#282735',positive:'#c2a4fa'}
};
export function heatColor(value:number|null,scale:number,negative:string,positive:string,neutral='#222b3c',reverse=false){
 if(value===null||!Number.isFinite(value))return {background:'#1a202b',color:'#738196'};
 const amount=Math.min(1,Math.abs(value)/(scale>0?scale:1)),target=(value<0)!==reverse?negative:positive;
 const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const start=rgb(neutral),end=rgb(target),mixed=start.map((v,i)=>Math.round(v+(end[i]-v)*amount));
 const linear=mixed.map(v=>v/255<=.04045?v/255/12.92:((v/255+.055)/1.055)**2.4);
 const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
 return {background:`rgb(${mixed.join(',')})`,color:luminance>.18?'#101722':'#f2f5fa'};
}

export function shiftWindow(from:string,to:string,offset:number,min:string,max:string){
 const width=Math.max(0,monthIndex(to)-monthIndex(from)),minimum=monthIndex(min),maximum=monthIndex(max);
 const start=Math.max(minimum,Math.min(maximum-width,monthIndex(from)+Math.round(offset)));
 return {from:monthStart(start)<min?min:monthStart(start),to:monthEnd(start+width)>max?max:monthEnd(start+width)};
}

import {backtest,validDate,type Point} from './analytics.ts';

export type SearchOptions={fastMin:number;fastMax:number;fastStep:number;slowMin:number;slowMax:number;slowStep:number;trainingPercent:number;objective:'cagr'|'balanced'};
export const DEFAULT_SEARCH:SearchOptions={fastMin:10,fastMax:100,fastStep:10,slowMin:50,slowMax:400,slowStep:25,trainingPercent:70,objective:'cagr'};
type Test=ReturnType<typeof backtest>;
export type Candidate={fast:number;slow:number;score:number;cagr:number;total:number;drawdown:number;entries:number};
export type SearchResult={best:Candidate;ranking:Candidate[];tested:number;trainingFrom:string;trainingTo:string;validationFrom:string;validationTo:string;training:Test;validation:Test;options:SearchOptions};
function windows(min:number,max:number,step:number){
 if(![min,max,step].every(Number.isInteger)||min<2||max>1000||max<min||step<1)throw new Error('Suchbereiche: ganze Zahlen von 2 bis 1000, Maximum ≥ Minimum und Schrittweite ≥ 1.');
 return Array.from({length:Math.floor((max-min)/step)+1},(_,i)=>min+i*step);
}
export function searchPairs(o:SearchOptions){
 const pairs=windows(o.fastMin,o.fastMax,o.fastStep).flatMap(fast=>windows(o.slowMin,o.slowMax,o.slowStep).filter(slow=>slow>fast).map(slow=>({fast,slow})));
 if(!pairs.length||pairs.length>2500)throw new Error('Bitte 1 bis 2500 gültige Kombinationen wählen; schnell muss kleiner als langsam sein.');
 return pairs;
}
/** Holdout data is never read during ranking. All candidates share the same dates. */
export async function optimizeSma(points:Point[],from:string,to:string,cost:number,capital:number,options:SearchOptions,control:{signal?:AbortSignal;onProgress?:(done:number,total:number)=>void}={}):Promise<SearchResult>{
 if(!validDate(from)||!validDate(to)||from>=to)throw new Error('Bitte einen gültigen Suchzeitraum wählen.');
 if(!Number.isInteger(options.trainingPercent)||options.trainingPercent<50||options.trainingPercent>90)throw new Error('Trainingsanteil muss zwischen 50 und 90 Prozent liegen.');
 if(!['cagr','balanced'].includes(options.objective))throw new Error('Unbekanntes Optimierungsziel.');
 const pairs=searchPairs(options),maxSlow=Math.max(...pairs.map(p=>p.slow));
 const usable=points.map((p,i)=>({p,i})).filter(({p,i})=>i>=maxSlow&&p.date>=from&&p.date<=to);
 const cut=Math.floor(usable.length*options.trainingPercent/100);
 if(cut<60||usable.length-cut<30)throw new Error('Nach gemeinsamem Aufwärmen werden mindestens 60 Trainings- und 30 Prüfbeobachtungen benötigt. Zeitraum verlängern oder Suchbereich verkleinern.');
 const trainingFrom=usable[0].p.date,trainingTo=usable[cut-1].p.date,validationFrom=usable[cut].p.date,validationTo=usable.at(-1)!.p.date;
 const trainingHistory=points.slice(0,usable[cut-1].i+1),ranking:Candidate[]=[];
 for(let i=0;i<pairs.length;i++){
  if(control.signal?.aborted)throw new Error('Suche abgebrochen.');
  const pair=pairs[i],r=backtest(trainingHistory,trainingFrom,trainingTo,pair.fast,pair.slow,cost,capital),m=r.metrics;
  if(m?.cagr!=null&&m.total!=null&&m.drawdown!=null)ranking.push({...pair,cagr:m.cagr,total:m.total,drawdown:m.drawdown,entries:r.entries,score:options.objective==='cagr'?m.cagr:m.cagr-Math.abs(m.drawdown)});
  control.onProgress?.(i+1,pairs.length);
  if(i%8===7)await new Promise(resolve=>setTimeout(resolve,0));
 }
 ranking.sort((a,b)=>b.score-a.score||Math.abs(a.drawdown)-Math.abs(b.drawdown)||a.fast-b.fast||a.slow-b.slow);
 if(!ranking.length)throw new Error('Keine auswertbare Kombination.');
 const best=ranking[0];
 return {best,ranking:ranking.slice(0,10),tested:pairs.length,trainingFrom,trainingTo,validationFrom,validationTo,options:{...options},training:backtest(trainingHistory,trainingFrom,trainingTo,best.fast,best.slow,cost,capital),validation:backtest(points.filter(p=>p.date<=validationTo),validationFrom,validationTo,best.fast,best.slow,cost,capital)};
}

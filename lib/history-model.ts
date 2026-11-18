import type {Point} from './analytics.ts';
import {sampleSeries,type Interval} from './comparison-matrix.ts';
export const HISTORY_MODELS=[
 {id:'msci-world-long',actual:'msci-world',proxy:'shiller-stock',frequency:'monthly',name:'MSCI World · Langzeit mit US-Proxy',symbol:'WORLD MODELL'},
 {id:'sp500-long',actual:'sp500',proxy:'shiller-stock',frequency:'monthly',name:'S&P 500 · Langzeit mit Shiller',symbol:'SPX LANG'},
 {id:'dow-long',actual:'dow',proxy:'shiller-stock',frequency:'monthly',name:'Dow Jones · Langzeit mit US-Proxy',symbol:'DJI MODELL'},
 {id:'nasdaq-long',actual:'nasdaq',proxy:'shiller-stock',frequency:'monthly',name:'Nasdaq 100 · Langzeit mit US-Proxy',symbol:'NDX MODELL'},
 {id:'gold-long',actual:'gold',proxy:'gold-historical',frequency:'annual',name:'Gold · Langzeitmodell',symbol:'GOLD LANG'},
 {id:'silver-long',actual:'silver',proxy:'silver-global',frequency:'monthly',name:'Silber · Langzeit mit Weltbank',symbol:'SILBER LANG'},
 {id:'wti-long',actual:'wti',proxy:'oil-historical',frequency:'annual',name:'WTI · Langzeit mit US-Rohöl',symbol:'WTI LANG'},
 {id:'brent-long',actual:'brent',proxy:'oil-historical',frequency:'annual',name:'Brent · Langzeit mit US-Rohöl',symbol:'BRENT LANG'}
] as const;
export function extendHistory(actual:Point[],proxy:Point[],actualFrequency:Interval,proxyFrequency:Interval,frequency:Interval,asOf:string){
 const observed=sampleSeries(actual,actualFrequency,frequency,asOf),reference=sampleSeries(proxy,proxyFrequency,frequency,asOf),first=observed[0];
 if(!first)throw new Error('Keine vollständige Anbieterperiode für die Rückrechnung.');
 const byDate=new Map(reference.map(p=>[p.date,p])),anchor=observed.find(p=>p.value>0&&(byDate.get(p.date)?.value||0)>0);
 if(!anchor)throw new Error('Keine gemeinsame positive Ankerperiode; eine Datenlücke wird nicht künstlich überbrückt.');
 const anchorProxy=byDate.get(anchor.date)!,factor=anchor.value/anchorProxy.value;
 const modeled=reference.filter(p=>p.date<first.date&&p.value>0).map(p=>({date:p.date,value:p.value*factor}));
 if(!modeled.length)throw new Error('Vergleichsquelle enthält keine ältere nutzbare Historie.');
 return {rows:[...modeled,...observed.map(p=>({date:p.date,value:p.value}))],modeledFrom:modeled[0].date,modeledTo:modeled.at(-1)!.date,observedFrom:first.date,anchorDate:anchor.date,anchorActual:anchor.value,anchorProxy:anchorProxy.value,factor};
}

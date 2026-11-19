import {cleanPoints,downsample,validDate,type Point} from './analytics.ts';
import {jointSearch} from './joint-search.ts';
import {monthlyPayment} from './contributions.ts';
import {runVariant,validateLab,type LabOptions,type Variant} from './strategy-lab.ts';

export type RollingInput={points:Point[];asset:string;from:string;to:string;trainMonths:number;testMonths:number;variants:Variant[];options:LabOptions;limit:number};
const day=86400000;
function monthOffset(date:string,months:number){
 const d=new Date(date),target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+months,1));
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(d.getUTCDate(),last));return target.toISOString().slice(0,10);
}
const previous=(date:string)=>new Date(Date.parse(date)-day).toISOString().slice(0,10);
export function rollingTest(input:RollingInput,progress:(message:string)=>void=()=>{}){
 const {points,asset,from,to,trainMonths,testMonths,variants,options,limit}=input;
 validateLab(options);
 if(!validDate(from)||!validDate(to)||from>=to||![trainMonths,testMonths].every(n=>Number.isInteger(n)&&n>=1&&n<=1200)||!variants.length)throw Error('Bitte Zeitraum, Fensterlängen (1 bis 1200 Monate) und Strategien prüfen.');
 const p=cleanPoints(points.filter(x=>x.date<=to)),anchor=p.length&&p.at(-1)!.date>=from?(p[0].date>from?p[0].date:from):undefined;
 if(!anchor)throw Error('Keine Kurse im gewählten Zeitraum.');
 const seeds=variants.map((variant,i)=>({variant,settings:{},color:'hsl('+i*137+' 72% 70%)'}));
 const accounts=seeds.map(s=>({...s,balance:options.capital,curve:[] as Point[]}));
 const phases:{from:string;to:string;trainingFrom:string;trainingTo:string;winners:{name:string;settings:Partial<LabOptions>;trainingProfit:number;end:number}[]}[]=[];
 let first=-1,last=-1;
 for(let offset=0;;offset+=testMonths){
  const testFrom=monthOffset(anchor,offset+trainMonths),testTo=previous(monthOffset(anchor,offset+trainMonths+testMonths));
  const start=p.findIndex(x=>x.date>=testFrom);
  if(start<0)break;
  const end=p.findLastIndex(x=>x.date<=testTo);
  if(end-start<2){if(end===p.length-1)break;throw Error('Zu wenige Prüfkurse ab '+testFrom+'. Bitte längere Prüffenster wählen.');}
  if(p.slice(start,end+1).some(x=>x.value<=0))throw Error('Null- oder Negativkurs im Prüffenster ab '+testFrom+'.');
  const training={from:monthOffset(anchor,offset),to:previous(testFrom)};
  const tag='Phase '+(phases.length+1)+' · ';
  const fit=jointSearch({markets:[{name:asset,points:p.slice(0,start)}],training:[training],holdout:[],seeds,options,limit,goal:'capital',profitOnly:true},s=>progress(tag+s));
  if(first<0)first=start;
  const boundaryDeposit=last<0?0:monthlyPayment(p[last].date,p[start].date,options.monthly);
  const winners=fit.profitWinners.map((w,i)=>{
   const a=accounts[i];
   const run=runVariant(p.slice(0,end+1),start,end,a.variant,{...options,...w.set.settings,capital:a.balance+boundaryDeposit});
   a.balance=run.curve.at(-1)!.value;
   for(const point of run.curve)a.curve.push(point);
   return {name:a.variant.name,settings:w.set.settings,trainingProfit:w.result.profit,end:a.balance};
  });
  phases.push({from:p[start].date,to:p[end].date,trainingFrom:fit.profitWinners[0].from,trainingTo:fit.profitWinners[0].to,winners});last=end;
 }
 if(first<0)throw Error('Kein auswertbares Prüffenster nach dem Training. Bitte Zeitraum verlängern oder Fenster verkürzen.');
 const hold=runVariant(p,first,last,{id:'hold-reference',name:'Buy & Hold',strategy:'hold',order:'market',automation:false},{...options,allocation:100});
 return {phases,from:p[first].date,to:p[last].date,paidIn:hold.paidIn,lines:[{id:'benchmark',name:'Buy & Hold',color:'#cad3e2',dashPattern:'8 4',points:downsample(hold.curve)},...accounts.map(a=>({id:'strategy-'+a.variant.id,name:a.variant.name,color:a.color,points:downsample(a.curve)}))]};
}

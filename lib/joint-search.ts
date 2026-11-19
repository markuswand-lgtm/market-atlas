import {cleanPoints,validDate,type Point} from './analytics.ts';
import {summarizeCases} from './case-summary.ts';
import {grid} from './batch-search.ts';
import {runVariant,validateLab,warmup,type LabOptions,type Variant} from './strategy-lab.ts';
import type {Range} from './multi-replay.ts';
import type {FixedSet} from './fixed-sets.ts';

export const goals={capital:'Endkapital · Anzahl Siege',meanCapital:'Mittlerer Endkapitalvorsprung',gain:'Rendite',drawdown:'Maximaler Drawdown',all:'Alle drei zugleich'};
export type Goal=keyof typeof goals;
export type JointInput={markets:{name:string;points:Point[]}[];training:Range[];holdout:Range[];seeds:FixedSet[];options:LabOptions;goal:Goal;limit:number;profitOnly?:boolean};
export function validateRanges(training:Range[],holdout:Range[],profitOnly=false){
 for(const ranges of profitOnly?[training]:[training,holdout]){
  if(!ranges.length||ranges.some(r=>!validDate(r.from)||!validDate(r.to)||r.from>r.to))throw Error('Bitte vollständige, gültige Zeiträume eingeben.');
  const sorted=[...ranges].sort((a,b)=>a.from.localeCompare(b.from));
  if(sorted.some((r,i)=>i>0&&r.from<=sorted[i-1].to))throw Error('Zeiträume innerhalb einer Phase dürfen sich nicht überschneiden.');
 }
 if(!profitOnly&&holdout.some(h=>training.some(t=>h.from<=t.to)))throw Error('Alle Prüfzeiträume müssen nach dem letzten Trainingszeitraum beginnen.');
}
const hold:Variant={id:'reference',name:'Buy & Hold',strategy:'hold',order:'market',automation:false};
function simulate(p:Point[],start:number,v:Variant,o:LabOptions){
 const run=runVariant(p,start,p.length-1,v,o);
 if(run.metrics?.total==null||run.metrics.drawdown==null)throw Error('Ungültige Kennzahlen.');
 return {capital:run.curve.at(-1)!.value,gain:run.metrics.total,drawdown:run.metrics.drawdown,profit:run.profit,exposure:run.exposure,trades:run.trades.length,halted:run.halted};
}
function candidates(seed:FixedSet,options:LabOptions,limit:number){
 const base={...options,...seed.settings},g=grid(seed.variant,base);
 const count=Math.min(limit||g.size,g.size);
 const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
 let stride=count===g.size?1:Math.max(1,Math.floor(g.size*0.61803398875));
 while(gcd(stride,g.size)!==1)stride--;
 const result=[];
 for(let i=0,index=0;i<count;i++,index=(index+stride)%g.size){
  let code=index;
  const settings={...seed.settings,...Object.fromEntries(g.keys.map((key,k)=>{const axis=g.axes[k],value=axis[code%axis.length];code=Math.floor(code/axis.length);return [key,value];}))};
  const trial={...options,...settings,capital:options.capital,monthly:options.monthly,costBps:options.costBps,slippageBps:options.slippageBps};
  if(trial.fast>=trial.slow||trial.rsiLow>=trial.rsiHigh)continue;
  validateLab(trial);
  result.push({settings,trial});
 }
 return result;
}
export function jointSearch(input:JointInput,progress:(s:string)=>void=()=>{}){
 const {training,holdout,markets,seeds,options,goal,limit}=input;
 validateRanges(training,holdout,input.profitOnly);validateLab(options);
 if(!markets.length||!seeds.length)throw Error('Bitte Assets und Strategien wählen.');
 const grids=seeds.map(s=>candidates(s,options,limit));
 let warm=0;grids.forEach((g,i)=>g.forEach(c=>{warm=Math.max(warm,warmup(seeds[i].variant.strategy,c.trial));}));
 function prepare(ranges:Range[]){
  return markets.flatMap(m=>ranges.map(range=>{
   const p=cleanPoints(m.points.filter(x=>x.date<=range.to));
   const start=p.findIndex((x,i)=>i>=warm&&x.date>=range.from);
   if(start<0||p.length-start<3||p.slice(start-warm).some(x=>x.value<=0))throw Error(m.name+' · '+range.from+' bis '+range.to+': zu wenige auswertbare positive Kurse.');
   return {asset:m.name,range,p,start,benchmark:simulate(p,start,hold,{...options,allocation:100})};
  }));
 }
 type Case=ReturnType<typeof prepare>[number];
 function evaluate(c:Case,v:Variant,o:LabOptions){
  const result=simulate(c.p,c.start,v,o),b=c.benchmark;
  const margins={capital:result.capital/b.capital-1,gain:result.gain-b.gain,drawdown:result.drawdown-b.drawdown};
  const margin=goal==='meanCapital'?margins.capital:goal==='all'?Math.min(margins.capital,margins.gain,margins.drawdown):margins[goal];
  return {asset:c.asset,from:c.p[c.start].date,to:c.p.at(-1)!.date,range:c.range,result,benchmark:b,won:margin>1e-12,margin};
 }
 const train=prepare(training);
 const order=(a:{wins:number;mean:number},b:{wins:number;mean:number})=>goal==='meanCapital'?b.mean-a.mean||b.wins-a.wins:b.wins-a.wins||b.mean-a.mean;
 type Winner={asset:string;from:string;to:string;set:FixedSet;result:ReturnType<typeof simulate>;benchmark:ReturnType<typeof simulate>;tested:number};
 const profitWinners:Winner[]=[];
 const finalists=seeds.flatMap((seed,i)=>{
  type Candidate={set:FixedSet;trial:LabOptions;wins:number;mean:number;trainingSummary:ReturnType<typeof summarizeCases>;tested:number};
  const top:Candidate[]=[];
  const winners:Winner[]=[];
  for(const [n,c] of grids[i].entries()){
   if(n%8===0)progress(seed.variant.name+' · '+(n+1)+' / '+grids[i].length);
   const evaluations=train.map(t=>evaluate(t,seed.variant,c.trial));
   evaluations.forEach((v,j)=>{if(!winners[j]||v.result.profit>winners[j].result.profit)winners[j]={asset:v.asset,from:v.from,to:v.to,set:{...seed,settings:c.settings},result:v.result,benchmark:v.benchmark,tested:grids[i].length};});
   const wins=evaluations.filter(r=>r.won).length,mean=evaluations.reduce((a,r)=>a+r.margin,0)/train.length;
   top.push({set:{...seed,settings:c.settings},trial:c.trial,wins,mean,trainingSummary:summarizeCases(evaluations),tested:grids[i].length});
   top.sort(order);
   if(top.length>3)top.pop();
  }
  profitWinners.push(...winners);
  return top.map((r,index)=>({...r,set:{...r.set,variant:{...seed.variant,id:seed.variant.id+'-joint-'+index,name:seed.variant.name+' · '+(index+1)}}}));
 }).sort(order);
 progress('Prüfung der fixierten Parametersätze');
 const check=input.profitOnly?[]:prepare(holdout);
 return {profitWinners,trainCases:train.length,checkCases:check.length,results:(input.profitOnly?[]:finalists).map(({trial,...r})=>{const checks=check.map(c=>evaluate(c,r.set.variant,trial));return {...r,checks,checkSummary:summarizeCases(checks)};})};
}

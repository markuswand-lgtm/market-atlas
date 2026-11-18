import {cleanPoints,type Point} from './analytics.ts';
import {runVariant,validateLab,warmup,type Variant,type LabOptions} from './strategy-lab.ts';

export const choices={
 fast:[10,50],slow:[100,200],lookback:[14,60],rsiLow:[20,30],rsiHigh:[70,80],band:[1.5,2],
 gridStep:[3,5],gridLevels:[3,5],allocation:[75,100],offset:[0.5,1],expiry:[3,5],
 stopLoss:[0,8],takeProfit:[0,20],trailing:[0,10],maxHold:[0,60],cooldown:[0,5],maxDrawdown:[0,20],
 cadence:['daily','weekly','monthly'],rebalance:[false,true],entryMonths:[6,12,24],seasonStart:[10,11],seasonEnd:[4,5]
} as const;
type Key=keyof typeof choices;
export const labels:Record<Key,string>={fast:'Schnell',slow:'Langsam',lookback:'Fenster',rsiLow:'RSI unten',rsiHigh:'RSI oben',band:'Bandbreite',gridStep:'Stufengröße (%)',gridLevels:'Stufen',allocation:'Investitionsquote (%)',offset:'Orderabstand (%)',expiry:'Ordergültigkeit',stopLoss:'Stop-Loss (%)',takeProfit:'Take-Profit (%)',trailing:'Trailing-Stop (%)',maxHold:'Max. Haltedauer',cooldown:'Wartezeit',maxDrawdown:'Verlustgrenze (%)',cadence:'Signaltakt',rebalance:'Zielquote wiederherstellen',entryMonths:'Einstiegsdauer (Monate)',seasonStart:'Saisonbeginn',seasonEnd:'Saisonende'};
const signalKeys:Record<Variant['strategy'],Key[]>={hold:[],sma:['fast','slow'],ema:['fast','slow'],contrarian:['fast','slow'],breakout:['lookback'],momentum:['lookback'],rsi:['lookback','rsiLow','rsiHigh'],bollinger:['lookback','band'],grid:['lookback','gridStep','gridLevels'],dca:['entryMonths'],seasonal:['seasonStart','seasonEnd']};
export function grid(v:Variant,o:LabOptions){
 const keys:Key[]=[...signalKeys[v.strategy],'allocation'];
 if(v.order!=='market')keys.push('offset','expiry');
 if(v.automation)keys.push('stopLoss','takeProfit','trailing','maxHold','cooldown','maxDrawdown','cadence','rebalance');
 const axes=keys.map(key=>[...new Set<LabOptions[Key]>([o[key],...choices[key]])]);
 return {keys,axes,size:axes.reduce((n,a)=>n*a.length,1)};
}
type Request={points:Point[];from:string;to:string;variants:Variant[];options:LabOptions;limit:number};
function chartCurves(run:ReturnType<typeof runVariant>){
 let peak=run.returnCurve[0].value;
 const losses=run.returnCurve.map(({date,value})=>{
  peak=Math.max(peak,value);
  return {date,value:100*(value/peak-1)};
 });
 return {capital:run.curve,losses};
}
export type Result=ReturnType<typeof chartCurves>&{variant:Variant;settings:Partial<LabOptions>;training:number;gain:number;drawdown:number;trades:number;tested:number;size:number};
export function batchSearch(input:Request,progress:(name:string,done:number,total:number)=>void=()=>{}){
 const {from,to,variants,options,limit}=input;validateLab(options);
 const p=cleanPoints(input.points.filter(x=>x.date<=to));
 const grids=variants.map(v=>grid(v,options));
 const warm=Math.max(...variants.map(v=>warmup(v.strategy,{...options,slow:Math.max(options.slow,...choices.slow),lookback:Math.max(options.lookback,...choices.lookback)})));
 const start=p.findIndex((x,i)=>i>=warm&&x.date>=from),end=p.length-1,split=start+Math.floor((end-start+1)*0.7);
 if(!variants.length||start<0||end-start<19||p.slice(start-warm).some(x=>x.value<=0))throw Error('Mindestens 20 positive Kurse nach der gemeinsamen Aufwärmphase erforderlich.');
 const train=p.slice(0,split),results:Result[]=[];
 for(const [i,v] of variants.entries()){
  const {keys,axes,size}=grids[i],count=Math.min(limit||size,size);
  // Walk the mixed-radix grid without duplicates. Index zero is the configured baseline.
  let stride=count===size?1:Math.max(1,Math.floor(size*0.61803398875));
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  while(gcd(stride,size)!==1)stride--;
  let best=-Infinity,bestDD=-Infinity,winner:LabOptions=options,tested=0,index=0;
  for(let n=0;n<count;n++,index=(index+stride)%size){
   let code=index;
   const patch=Object.fromEntries(keys.map((key,k)=>{const axis=axes[k],value=axis[code%axis.length];code=Math.floor(code/axis.length);return [key,value];}));
   const trial={...options,...patch};
   if(trial.fast>=trial.slow||trial.rsiLow>=trial.rsiHigh)continue;
   const m=runVariant(train,start,split-1,v,trial).metrics;
   if(m?.total==null||m.drawdown==null)continue;
   tested++;
   if(m.total>best||(m.total===best&&m.drawdown>bestDD)){best=m.total;bestDD=m.drawdown;winner=trial;}
   if(n%16===0)progress(v.name,n+1,count);
  }
  if(!tested)throw Error('Keine gültige Kombination für '+v.name);
  const check=runVariant(p,split,end,v,winner);
  if(check.metrics?.total==null||check.metrics.drawdown==null)throw Error('Prüfkennzahlen fehlen.');
  results.push({...chartCurves(check),variant:v,settings:Object.fromEntries(keys.map(k=>[k,winner[k]])),training:best,gain:check.metrics.total,drawdown:check.metrics.drawdown,trades:check.trades.length,tested,size});
 }
 const benchmark=runVariant(p,split,end,{id:'benchmark',strategy:'hold',order:'market',name:'Buy & Hold',automation:false},{...options,allocation:100});
 return {benchmark:chartCurves(benchmark),from:p[start].date,trainingEnd:p[split-1].date,testFrom:p[split].date,to:p[end].date,results};
}
export type BatchReport=ReturnType<typeof batchSearch>;

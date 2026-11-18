import {cleanPoints,metrics,sma,validDate,type Point} from './analytics.ts';
export const STRATEGIES=[
 {id:'hold',name:'Buy & Hold',group:'Klassisch',description:'Einmal investieren und bis zum Testende halten.'},
 {id:'sma',name:'SMA-Trendfolge',group:'Klassisch',description:'Long, solange der schnelle SMA über dem langsamen liegt.'},
 {id:'ema',name:'EMA-Trendfolge',group:'Klassisch',description:'Wie SMA, mit exponentieller Gewichtung der jüngeren Kurse.'},
 {id:'rsi',name:'RSI-Rückkehr',group:'Klassisch',description:'Wilder-RSI: Einstieg unter der unteren Schwelle, Ausstieg über der oberen.'},
 {id:'bollinger',name:'Bollinger-Rückkehr',group:'Klassisch',description:'Kauf unter dem unteren Band, Verkauf bei Rückkehr zum Mittelwert.'},
 {id:'breakout',name:'Kanalausbruch',group:'Klassisch',description:'Kauf über dem höchsten vorherigen Schlusskurs; Verkauf unter dem vorherigen Tief.'},
 {id:'momentum',name:'Momentum',group:'Klassisch',description:'Long bei positiver Veränderung über das Betrachtungsfenster.'},
 {id:'dca',name:'12 Investitionsstufen',group:'Automatisch',description:'Zielquote monatlich um ein Zwölftel erhöhen; Finanzierung aus vorhandenem Cash, keine weiteren Einzahlungen.'},
 {id:'contrarian',name:'SMA-Gegentrend',group:'Experimentell',description:'Umgekehrte Trendregel: Long, solange der schnelle SMA unter dem langsamen liegt.'},
 {id:'grid',name:'Drawdown-Stufen',group:'Experimentell',description:'Je Rückgangsstufe vom vorherigen Fensterhoch eine weitere Kapitalstufe investieren; bei Erholung abbauen.'},
 {id:'seasonal',name:'November bis April',group:'Experimentell',description:'Saisonale Kalenderregel: Long von November bis April; sonst Cash.'}
] as const;
export type StrategyId=typeof STRATEGIES[number]['id'];
export type OrderType='market'|'limit'|'stop'|'stop-limit';
export type Variant={id:string;strategy:StrategyId;order:OrderType;name:string;automation:boolean};
export type LabOptions={fast:number;slow:number;lookback:number;rsiLow:number;rsiHigh:number;band:number;gridStep:number;gridLevels:number;costBps:number;slippageBps:number;capital:number;allocation:number;offset:number;expiry:number;stopLoss:number;takeProfit:number;trailing:number;maxHold:number;cooldown:number;maxDrawdown:number;cadence:'daily'|'weekly'|'monthly';rebalance:boolean};
export const DEFAULT_LAB:LabOptions={fast:50,slow:200,lookback:20,rsiLow:30,rsiHigh:70,band:2,gridStep:5,gridLevels:5,costBps:10,slippageBps:0,capital:10000,allocation:100,offset:1,expiry:5,stopLoss:0,takeProfit:0,trailing:0,maxHold:0,cooldown:0,maxDrawdown:0,cadence:'daily',rebalance:false};
export type Trade={date:string;signalDate:string;side:'Kauf'|'Verkauf';price:number;quantity:number;fee:number;reason:string};
export type LabResult={variant:Variant;curve:Point[];trades:Trade[];fees:number;turnover:number;exposure:number;cancelled:number;halted:boolean;metrics:ReturnType<typeof metrics>};
function ema(p:Point[],window:number){const initial=sma(p,window),out:(number|null)[]=p.map(()=>null);let previous:number|null=null;for(let i=0;i<p.length;i++){if(i===window-1)previous=initial[i];else if(i>=window)previous=p[i].value*(2/(window+1))+previous!*(1-2/(window+1));out[i]=previous;}return out;}
export function wilderRsi(p:Point[],window:number){let gain=0,loss=0;return p.map((v,i)=>{if(!i)return null;const delta=v.value-p[i-1].value;if(i<=window){gain+=Math.max(0,delta)/window;loss+=Math.max(0,-delta)/window;}else {gain=(gain*(window-1)+Math.max(0,delta))/window;loss=(loss*(window-1)+Math.max(0,-delta))/window;}return i<window?null:gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);});}
export function validateLab(o:LabOptions){
 const integer=(v:number,min:number,max:number)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!integer(o.fast,2,999)||!integer(o.slow,o.fast+1,1000)||!integer(o.lookback,2,1000)||!integer(o.gridLevels,1,20)||!integer(o.expiry,1,100)||!integer(o.maxHold,0,10000)||!integer(o.cooldown,0,1000))throw new Error('Fenster, Stufen und Gültigkeit müssen ganze Zahlen innerhalb der angezeigten Grenzen sein; schnell < langsam.');
 if(Object.values(o).some(v=>typeof v==='number'&&!Number.isFinite(v))||o.capital<=0||o.costBps<0||o.costBps>100||o.slippageBps<0||o.slippageBps>100||o.allocation<=0||o.allocation>100||o.offset<0||o.offset>50||o.band<=0||o.band>10||o.gridStep<=0||o.gridStep>50||o.rsiLow<0||o.rsiHigh>100||o.rsiLow>=o.rsiHigh||[o.stopLoss,o.trailing,o.maxDrawdown].some(v=>v<0||v>=100)||o.takeProfit<0||o.takeProfit>1000)throw new Error('Ungültige Parameter: Prozentwerte und Kosten müssen innerhalb der angezeigten Grenzen liegen.');
}
export function warmup(id:StrategyId,o:LabOptions){return ['sma','ema','contrarian'].includes(id)?o.slow:['hold','dca','seasonal'].includes(id)?0:o.lookback+1;}
function cadenceKey(date:string,cadence:LabOptions['cadence']){if(cadence==='monthly')return date.slice(0,7);if(cadence==='weekly')return String(Math.floor((Date.parse(date)/86400000+3)/7));return date;}

// Orders created after close t can execute no earlier than close t+1.
// Stops observed at a close become market/limit orders for the NEXT close.
export function runVariant(p:Point[],start:number,end:number,v:Variant,o:LabOptions):LabResult{
 const f=sma(p,o.fast),s=sma(p,o.slow),ef=ema(p,o.fast),es=ema(p,o.slow),mean=sma(p,o.lookback),rsi=wilderRsi(p,o.lookback);
 let cash=o.capital,qty=0,entry=0,high=0,entryIndex=0,lastExit=-Infinity,lastTarget=0,signalState=0,cancelled=0,halted=false,fees=0,turnover=0,exposure=0,peak=o.capital;
 type Order={target:number;type:OrderType;reference:number;created:number;signalDate:string;reason:string;triggered?:boolean};
 let pending:Order|null=null;
 const trades:Trade[]=[],curve:Point[]=[];
 const execute=(target:number,i:number,order:Order)=>{
  const mark=p[i].value,equity=cash+qty*mark,wanted=target*equity/mark,delta=wanted-qty;
  if(Math.abs(delta*mark)<Math.max(1e-8,equity*1e-8)){lastTarget=target;return;}
  const buying=delta>0,price=mark*(1+(buying?1:-1)*o.slippageBps/10000),rate=o.costBps/10000;
  if(buying&&(order.type==='limit'||order.type==='stop-limit')&&price>order.reference*(1+(order.type==='limit'?-1:1)*o.offset/100))return;
  const amount=buying?Math.min(delta,cash/(price*(1+rate))):Math.min(-delta,qty),notional=amount*price,fee=notional*rate;
  if(amount<=1e-12)return;
  if(buying){if(qty===0){entryIndex=i;high=mark;}entry=(entry*qty+notional)/(qty+amount);qty+=amount;cash-=notional+fee;}else {cash+=notional-fee;qty-=amount;if(qty<1e-10){qty=0;entry=0;lastExit=i;}}
  cash=Math.max(0,cash);fees+=fee;turnover+=notional;lastTarget=target;
  trades.push({date:p[i].date,signalDate:order.signalDate,side:buying?'Kauf':'Verkauf',price,quantity:amount,fee,reason:order.reason});
 };
 for(let i=start;i<=end;i++){
  const price=p[i].value;
  if(i>start)exposure+=qty* p[i-1].value/(cash+qty*p[i-1].value);
  if(pending&&i>pending.created){
   if(i-pending.created>o.expiry&&pending.target>0&&!(pending.type==='stop'&&pending.triggered)){cancelled++;pending=null;}
   else {const order=pending,level=order.reference*(1+(order.type==='limit'?-1:1)*o.offset/100);let fill=order.type==='market'||order.target===0;
    if(order.type==='limit')fill=price*(1+o.slippageBps/10000)<=level;
    if(order.type==='stop'||order.type==='stop-limit'){
     if(order.triggered)fill=order.type==='stop'||price*(1+o.slippageBps/10000)<=level;
     else if(price>=level)order.triggered=true;
    }
    if(fill){execute(order.target,i,order);pending=null;}
   }
  }
  let equity=cash+qty*price;peak=Math.max(peak,equity);high=qty?Math.max(high,price):0;
  if(i===end){if(qty)execute(0,i,{target:0,type:'market',reference:price,created:i-1,signalDate:p[i].date,reason:'Schlussliquidation'});curve.push({date:p[i].date,value:cash});break;}
  curve.push({date:p[i].date,value:equity});
  let exit='';
  if(v.automation){
   if(o.maxDrawdown&&equity/peak-1<=-o.maxDrawdown/100){halted=true;exit='Kapital-Notbremse';}
   if(qty){if(o.stopLoss&&price/entry-1<=-o.stopLoss/100)exit=exit||'Stop-Loss';if(o.trailing&&price/high-1<=-o.trailing/100)exit=exit||'Trailing-Stop';if(o.takeProfit&&price/entry-1>=o.takeProfit/100)exit=exit||'Take-Profit';if(o.maxHold&&i-entryIndex>=o.maxHold)exit=exit||'Zeit-Ausstieg';}
  }
  if(exit){if(pending)cancelled++;pending=qty?{target:0,type:'market',reference:price,created:i,signalDate:p[i].date,reason:exit}:null;continue;}
  if(pending?.target===0||halted)continue;
  const cadence=v.automation?o.cadence:'daily';
  if(i>start&&cadenceKey(p[i].date,cadence)===cadenceKey(p[i-1].date,cadence))continue;
  let target=0;
  switch(v.strategy){
   case 'hold':target=1;break;
   case 'sma':target=f[i]!>s[i]!?1:0;break;
   case 'ema':target=ef[i]!>es[i]!?1:0;break;
   case 'contrarian':target=f[i]!<s[i]!?1:0;break;
   case 'momentum':target=price>p[i-o.lookback].value?1:0;break;
   case 'rsi':if(rsi[i]!<o.rsiLow)signalState=1;else if(rsi[i]!>o.rsiHigh)signalState=0;target=signalState;break;
   case 'bollinger':{const m=mean[i]!,variance=p.slice(i-o.lookback+1,i+1).reduce((sum,x)=>sum+(x.value-m)**2,0)/o.lookback;if(price<m-o.band*Math.sqrt(variance))signalState=1;else if(price>=m)signalState=0;target=signalState;break;}
   case 'breakout':{const previous=p.slice(i-o.lookback,i).map(x=>x.value);if(price>Math.max(...previous))signalState=1;else if(price<Math.min(...previous))signalState=0;target=signalState;break;}
   case 'grid':{const top=Math.max(...p.slice(i-o.lookback,i).map(x=>x.value));target=Math.min(o.gridLevels,Math.floor(Math.max(0,1-price/top)/(o.gridStep/100)))/o.gridLevels;break;}
   case 'dca':{const months=(Number(p[i].date.slice(0,4))-Number(p[start].date.slice(0,4)))*12+Number(p[i].date.slice(5,7))-Number(p[start].date.slice(5,7));target=Math.min(1,(months+1)/12);break;}
   case 'seasonal':{const month=Number(p[i].date.slice(5,7));target=month>=11||month<=4?1:0;break;}
  }
  target*=o.allocation/100;
  if(v.automation&&i-lastExit<=o.cooldown)target=0;
  if(pending&&Math.abs(pending.target-target)>1e-9){pending=null;cancelled++;}
  if(pending)continue;
  if(Math.abs(target-lastTarget)<1e-9&&!(v.automation&&o.rebalance&&qty>0))continue;
  if(target===0&&qty===0){lastTarget=0;continue;}
  const actual=qty*price/equity;
  if(Math.abs(target-actual)<.0001)continue;
  pending={target,type:target<actual?'market':v.order,reference:price,created:i,signalDate:p[i].date,reason:target<actual?'Strategie-Ausstieg / Reduktion':`Strategie-Einstieg · ${v.order}`};
 }
 return {variant:v,curve,trades,fees,turnover,exposure:exposure/Math.max(1,end-start),cancelled,halted,metrics:metrics(curve)};
}
export function compareStrategies(rows:Point[],from:string,to:string,variants:Variant[],options:LabOptions){
 validateLab(options);if(!validDate(from)||!validDate(to)||from>to)throw new Error('Bitte einen gültigen Testzeitraum wählen.');
 if(!variants.length)throw new Error('Mindestens eine Variante auswählen.');
 if(variants.some(v=>!STRATEGIES.some(s=>s.id===v.strategy)||!['market','limit','stop','stop-limit'].includes(v.order)))throw new Error('Unbekannte Strategie oder Orderart.');
 const p=cleanPoints(rows),warm=Math.max(...variants.map(v=>warmup(v.strategy,options))),start=p.findIndex((v,i)=>v.date>=from&&i>=warm),end=p.findLastIndex(v=>v.date<=to);
 if(start<0||end-start<2)throw new Error(`Zu wenige Kurse nach ${warm} gemeinsamen Aufwärmbeobachtungen. Zeitraum erweitern oder Fenster verkleinern.`);
 if(p.slice(Math.max(0,start-warm),end+1).some(v=>v.value<=0))throw new Error('Null- oder Negativkurse im Test oder Aufwärmfenster: diese prozentbasierten Strategien sind hier nicht definiert.');
 const benchmark:Variant={id:'benchmark',strategy:'hold',order:'market',name:'Buy & Hold · Referenz',automation:false};
 return {from:p[start].date,to:p[end].date,warmup:warm,results:[runVariant(p,start,end,benchmark,{...options,allocation:100}),...variants.map(v=>runVariant(p,start,end,v,options))]};
}

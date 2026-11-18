import type {Point} from './analytics.ts';
export function monthlyPayment(previous:string,current:string,amount:number){
 const month=(date:string)=>Number(date.slice(0,4))*12+Number(date.slice(5,7));
 return Math.max(0,month(current)-month(previous))*amount;
}
// Recurring payments arrive at the first observed close in each new calendar month.
// Unit issuance before trading isolates deposits from investment performance.
export function contributionBacktest(p:Point[],indices:number[],fast:(number|null)[],slow:(number|null)[],cost:number,capital:number,monthly:number){
 const account=()=>({cash:capital,qty:0,units:capital/100,curve:[] as Point[],returns:[] as Point[]});
 const strategy=account(),hold=account();let paidIn=capital,entries=0,turns=0,exposed=0;const invested:Point[]=[];
 function buy(a:ReturnType<typeof account>,price:number){a.qty+=a.cash*(1-cost)/price;a.cash=0;}
 function sell(a:ReturnType<typeof account>,price:number){a.cash+=a.qty*price*(1-cost);a.qty=0;}
 for(let j=0;j<indices.length;j++){
  const i=indices[j],point=p[i],payment=j?monthlyPayment(p[indices[j-1]].date,point.date,monthly):0;
  if(j)exposed+=strategy.qty>0?1:0;
  paidIn+=payment;invested.push({date:point.date,value:paidIn});
  for(const a of [strategy,hold]){
   const before=a.cash+a.qty*point.value;
   if(payment){a.units+=payment/(before/a.units);a.cash+=payment;}
   if(j===indices.length-1&&a.qty){sell(a,point.value);if(a===strategy)turns++;}
   const equity=a.cash+a.qty*point.value;
   a.curve.push({date:point.date,value:equity});a.returns.push({date:point.date,value:equity/a.units});
  }
  if(j===indices.length-1)break;
  // Existing SMA convention: yesterday's signal executes at today's close.
  const desired=fast[i-1]!==null&&slow[i-1]!==null&&fast[i-1]!>slow[i-1]!;
  if(desired&&strategy.cash>0){if(!strategy.qty)entries++;buy(strategy,point.value);turns++;}
  else if(!desired&&strategy.qty){sell(strategy,point.value);turns++;}
  if(hold.cash>0)buy(hold,point.value);
 }
 return {strategy:strategy.curve,benchmark:hold.curve,strategyReturn:strategy.returns,benchmarkReturn:hold.returns,invested,paidIn,profit:strategy.curve.at(-1)!.value-paidIn,holdProfit:hold.curve.at(-1)!.value-paidIn,entries,turns,exposure:exposed/(indices.length-1)};
}

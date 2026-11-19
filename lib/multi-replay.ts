import {replay,type SavedGroup} from './fixed-sets.ts';
import type {Point} from './analytics.ts';
import type {LabOptions} from './strategy-lab.ts';

export type Range={from:string;to:string};
type Metrics={capital:number;gain:number;drawdown:number};
export type Comparison={asset:string;range:Range;actual:Range;id:string;name:string;metrics:Metrics;benchmark:Metrics;delta:Metrics;wins:number;halted:boolean;trades:number;exposure:number;fees:number;holdTrades:number;holdFees:number;holdExposure:number};
function metrics(row:ReturnType<typeof replay>['benchmark']):Metrics{
 return {capital:row.capital.at(-1)!.value,gain:row.gain,drawdown:row.drawdown};
}
function difference(a:number,b:number){
 return Math.abs(a-b)<=Number.EPSILON*16*Math.max(1,Math.abs(a),Math.abs(b))?0:a-b;
}
export function compareRanges(asset:string,points:Point[],ranges:Range[],group:SavedGroup,options:LabOptions){
 const rows:Comparison[]=[],errors:string[]=[];
 for(const range of ranges){
  try{
   const report=replay(group,points,range.from,range.to,options);
   const benchmark=metrics(report.benchmark);
   for(const result of report.results){
    const m=metrics(result);
    const delta={capital:difference(m.capital,benchmark.capital),gain:difference(m.gain,benchmark.gain),drawdown:difference(m.drawdown,benchmark.drawdown)};
    rows.push({asset,range,actual:{from:report.testFrom,to:report.to},id:result.variant.id,name:result.variant.name,metrics:m,benchmark,delta,wins:Object.values(delta).filter(x=>x>0).length,trades:result.trades,halted:result.halted,exposure:result.exposure,fees:result.fees,holdTrades:report.benchmark.trades,holdFees:report.benchmark.fees,holdExposure:report.benchmark.exposure});
   }
  }catch(e){errors.push(asset+' · '+range.from+' bis '+range.to+' · '+(e as Error).message);}
 }
 return {rows,errors};
}

export type CapitalCase={result:{capital:number;exposure:number;trades:number;halted:boolean};benchmark:{capital:number}};
export function summarizeCases(cases:CapitalCase[]){
 let total=0,worst=0,exposure=0,inactive=0,halted=0;
 for(const {result,benchmark} of cases){
  const lead=(result.capital-benchmark.capital)/benchmark.capital;
  total+=lead;worst=Math.max(worst,-lead);exposure+=result.exposure;
  if(!result.trades)inactive++;
  if(result.halted)halted++;
 }
 return {meanLead:total/cases.length,worst,exposure:exposure/cases.length,inactive,halted};
}

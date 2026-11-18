import {deflate,sma,type Point} from './analytics.ts';

export function validSmaPair(fast:number,slow:number){
 return Number.isInteger(fast)&&Number.isInteger(slow)&&fast>=2&&fast<slow&&slow<=1000;
}

// Calculate on the full nominal history before clipping. Apply exactly the
// asset's display scale, rather than rebasing each moving average to 100.
export function smaOverlay(history:Point[],window:number,reference:Point[],normalized:boolean,cpi?:Point[],baseMonth=''):Point[]{
 if(!Number.isInteger(window)||window<2||window>1000||!reference.length)return [];
 const averages=sma(history,window),dates=new Set(reference.map(p=>p.date));
 let points=history.flatMap((p,i)=>averages[i]===null||!dates.has(p.date)?[]:[{date:p.date,value:averages[i]!}]);
 if(cpi)points=deflate(points,cpi,baseMonth);
 const base=reference[0].value;
 return normalized?(base>0?points.map(p=>({...p,value:p.value/base*100})):[]):points;
}

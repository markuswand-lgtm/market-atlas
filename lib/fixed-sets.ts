import {cleanPoints,validDate,type Point} from './analytics.ts';
import {evaluateHoldout} from './batch-search.ts';
import {validateLab,warmup,type LabOptions,type Variant} from './strategy-lab.ts';

export type FixedSet={variant:Variant;settings:Partial<LabOptions>;color:string};
export type SavedGroup={id:string;name:string;source:string;from:string;to:string;options:LabOptions;sets:FixedSet[]};
export function replay(group:SavedGroup,rows:Point[],from:string,to:string,current:LabOptions){
 if(!group.sets.length||!validDate(from)||!validDate(to)||from>to)throw Error('Bitte Auswahl und Zeitraum prüfen.');
 const assumptions={capital:current.capital,monthly:current.monthly,costBps:current.costBps,slippageBps:current.slippageBps};
 const configs=group.sets.map(s=>({...group.options,...s.settings,...assumptions}));
 configs.forEach(validateLab);
 const warm=Math.max(...configs.map((o,i)=>warmup(group.sets[i].variant.strategy,o)));
 const p=cleanPoints(rows.filter(x=>x.date<=to)),end=p.length-1,start=p.findIndex((x,i)=>i>=warm&&x.date>=from);
 if(start<0||end-start<2)throw Error('Zu wenige Kurse im Zeitraum nach der gemeinsamen Aufwärmphase.');
 if(p.slice(start-warm).some(x=>x.value<=0))throw Error('Für diesen Vergleich sind positive Kurse erforderlich.');
 const benchmark=evaluateHoldout(p,start,end,{id:'reference',name:'Buy & Hold',strategy:'hold',order:'market',automation:false},{...configs[0],allocation:100});
 const results=group.sets.map((s,i)=>({...s,...evaluateHoldout(p,start,end,s.variant,configs[i])}));
 return {testFrom:p[start].date,to:p[end].date,results,benchmark};
}

const DAY=86400000;
export function niceStep(span:number,count=6){
 const raw=Math.max(Number.MIN_VALUE,span/count),power=10**Math.floor(Math.log10(raw)),n=raw/power;
 return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*power;
}
export function valueAxis(low:number,high:number,log=false,reference?:number){
 if(reference!==undefined&&(!log||reference>0)){low=Math.min(low,reference);high=Math.max(high,reference);}
 if(log){
  const pad=Math.max(.02,(Math.log(high)-Math.log(low))*.08),min=Math.exp(Math.log(low)-pad),max=Math.exp(Math.log(high)+pad);
  let ticks:number[]=[];
  for(let e=Math.floor(Math.log10(min));e<=Math.ceil(Math.log10(max));e++)for(const m of [1,2,5]){const v=m*10**e;if(v>=min&&v<=max)ticks.push(v);}
  if(ticks.length>10)ticks=ticks.filter((_,i)=>i%Math.ceil(ticks.length/10)===0);
  if(ticks.length<3){const step=niceStep(max-min);ticks=Array.from({length:Math.ceil((max-min)/step)+1},(_,i)=>(Math.ceil(min/step)+i)*step).filter(v=>v<=max&&v>0);}
  return {min,max,ticks};
 }
 const pad=(high-low)*.08||Math.max(Math.abs(low)*.05,1),step=niceStep(high-low+pad*2);
 const min=low>=0?Math.max(0,Math.floor((low-pad)/step)*step):Math.floor((low-pad)/step)*step,max=Math.ceil((high+pad)/step)*step;
 const ticks=Array.from({length:Math.min(30,Math.round((max-min)/step)+1)},(_,i)=>Number((min+i*step).toPrecision(12)));
 return {min,max,ticks};
}
export function timeTicks(min:number,max:number):{value:number;label:string}[]{
 const days=(max-min)/DAY,result:{value:number;label:string}[]=[];
 const add=(value:number,options:Intl.DateTimeFormatOptions)=>{if(value>=min&&value<=max)result.push({value,label:new Date(value).toLocaleDateString('de-DE',{timeZone:'UTC',...options})});};
 if(days<=60){const step=days<=10?1:days<=25?3:7;for(let t=Math.ceil(min/DAY)*DAY;t<=max;t+=step*DAY)add(t,{day:'2-digit',month:'2-digit',year:days>30?'2-digit':undefined});}
 else if(days<=1096){const step=days<=240?1:days<=550?3:6,d=new Date(min);let m=d.getUTCFullYear()*12+d.getUTCMonth();m=Math.ceil(m/step)*step;for(;Date.UTC(Math.floor(m/12),m%12,1)<=max;m+=step)add(Date.UTC(Math.floor(m/12),m%12,1),{month:'short',year:'2-digit'});}
 else {const years=days/365.2425,step=Math.max(1,niceStep(years)===2.5?5:Math.ceil(niceStep(years)));let year=Math.ceil(new Date(min).getUTCFullYear()/step)*step;for(;Date.UTC(year,0,1)<=max;year+=step)add(Date.UTC(year,0,1),{year:'numeric'});}
 return result;
}

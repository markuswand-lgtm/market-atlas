import {DAY,validDate,type Point} from './analytics.ts';

export function periodRange(years:number,now=new Date()){
 const to=now.toISOString().slice(0,10);
 if(years===0)return {from:'1890-01-01',to};
 const year=now.getUTCFullYear()-years,month=now.getUTCMonth();
 const day=Math.min(now.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());
 return {from:new Date(Date.UTC(year,month,day)).toISOString().slice(0,10),to};
}

export function timeDomain(points:Point[],from?:string,to?:string,future=false){
 const dates=points.map(p=>Date.parse(p.date));
 const min=from&&validDate(from)?Date.parse(from):Math.min(...dates);
 let max=to&&validDate(to)?Date.parse(to):Math.max(...dates);
 if(future)max=Math.max(max,Date.UTC(2060,0,1));
 return {minX:min,maxX:Math.max(min+DAY,max)};
}

export function comparisonLines<T extends {points:Point[]}>(lines:T[],normal:boolean,shared=false){
 const starts=lines.filter(l=>l.points.length).map(l=>l.points[0].date).sort();
 const overlap=starts.at(-1)||'';
 return lines.map(l=>{
  const points=normal&&shared?l.points.filter(p=>p.date>=overlap):l.points;
  const first=points[0]?.value;
  return {...l,points:normal?(first>0?points.map(p=>({...p,value:p.value/first*100})):[]):points};
 });
}

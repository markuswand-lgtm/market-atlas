import type {Comparison} from './multi-replay.ts';

export function strategyRanking(rows:Comparison[]){
 const counts=new Map<string,{id:string;name:string;cases:number;capital:number;gain:number;drawdown:number;all:number}>();
 for(const row of rows){
  const score=counts.get(row.id)??{id:row.id,name:row.name,cases:0,capital:0,gain:0,drawdown:0,all:0};
  score.cases++;
  for(const metric of ['capital','gain','drawdown'] as const)if(row.delta[metric]>0)score[metric]++;
  if(row.wins===3)score.all++;
  counts.set(row.id,score);
 }
 const sorted=[...counts.values()].sort((a,b)=>b.all-a.all||a.name.localeCompare(b.name,'de'));
 let rank=0;
 return sorted.map((s,i)=>{if(!i||s.all!==sorted[i-1].all)rank=i+1;return {...s,rank};});
}

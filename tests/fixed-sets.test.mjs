import test from 'node:test';
import assert from 'node:assert/strict';
import {replay} from '../lib/fixed-sets.ts';
import {DEFAULT_LAB,runVariant} from '../lib/strategy-lab.ts';

test('Saved settings survive serialization and replay on different prices and dates',()=>{
 const variant={id:'sma-1',name:'SMA Rang 2',strategy:'sma',order:'market',automation:false};
 const sets=[20,40].map((slow,i)=>({variant:{...variant,id:'sma-'+i},settings:{fast:5,slow},color:'green'}));
 const group=JSON.parse(JSON.stringify({sets,options:DEFAULT_LAB}));
 const assumptions={capital:5500,monthly:130,costBps:9,slippageBps:2};
 for(const [scale,start] of [[1,80],[1.7,115]]){
  const points=Array.from({length:260},(_,i)=>({date:new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10),value:120+i/10+10*Math.sin(i*scale/7)}));
  const end=start+100;
  const result=replay(group,points,points[start].date,points[end].date,{...DEFAULT_LAB,...assumptions,slow:200});
  assert.equal(result.testFrom,points[start].date);
  for(const [i,row] of [...result.results,result.benchmark].entries()){
   const set=sets[i]??{variant:{...variant,strategy:'hold'},settings:{allocation:100}};
   const direct=runVariant(points,start,end,set.variant,{...DEFAULT_LAB,...set.settings,...assumptions});
   assert.equal(row.capital.at(-1).value,direct.curve.at(-1).value);
   assert.equal(row.gain,direct.metrics.total);
   assert.equal(row.drawdown,direct.metrics.drawdown);
   assert.equal(row.losses.at(-1).date,points[end].date);
  }
 }
});

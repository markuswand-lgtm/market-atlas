import test from 'node:test';
import assert from 'node:assert/strict';
import {batchSearch,grid} from '../lib/batch-search.ts';
import {DEFAULT_LAB,runVariant} from '../lib/strategy-lab.ts';
test('Candidate selection ignores holdout prices and each winner reproduces its own holdout metrics',()=>{
 const points=Array.from({length:480},(_,i)=>({date:new Date(Date.UTC(2000,0,1+i)).toISOString().slice(0,10),value:100+i/10+12*Math.sin(i/17)}));
 const variants=['sma','seasonal'].map(strategy=>({id:strategy,name:strategy,strategy,order:'market',automation:false}));
 const request={points,from:points[180].date,to:points.at(-1).date,variants,options:DEFAULT_LAB,limit:0};
 const first=batchSearch(request);
 const split=points.findIndex(p=>p.date===first.testFrom);
 const second=batchSearch({...request,points:points.map((p,i)=>i<split?p:{...p,value:p.value*(1+(i%3)/3)})});
 for(const [i,r] of first.results.entries()){
  assert.deepEqual(r.settings,second.results[i].settings);
  assert.equal(r.training,second.results[i].training);
  const check=runVariant(points,split,points.length-1,variants[i],{...DEFAULT_LAB,...r.settings});
  assert.equal(r.gain,check.metrics.total);assert.equal(r.drawdown,check.metrics.drawdown);
  for(const [rank,c] of r.ranking.entries()){
   const direct=runVariant(points,split,points.length-1,variants[i],{...DEFAULT_LAB,...c.settings});
   assert.deepEqual(c.settings,second.results[i].ranking[rank].settings);
   assert.equal(c.holdout.capital.at(-1).value,direct.curve.at(-1).value);
   assert.equal(c.holdout.gain,direct.metrics.total);
   assert.equal(c.holdout.drawdown,direct.metrics.drawdown);
  }
  assert.equal(r.tested,grid(variants[i],DEFAULT_LAB).size);
 }
 assert.deepEqual(first.benchmark.capital,runVariant(points,split,points.length-1,{id:'bh',name:'BH',strategy:'hold',order:'market',automation:false},{...DEFAULT_LAB,allocation:100}).curve);
 for(const row of first.results){
  assert.equal(row.capital[0].date,first.testFrom);
  assert.equal(row.losses.at(-1).date,first.to);
  assert.equal(Math.min(...row.losses.map(p=>p.value)),100*row.drawdown);
 }
 assert.ok('slow' in first.results[0].settings);
 assert.ok('seasonStart' in first.results[1].settings);
});

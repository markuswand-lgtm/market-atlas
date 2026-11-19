import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRanges} from '../lib/multi-replay.ts';
import {DEFAULT_LAB} from '../lib/strategy-lab.ts';
test('Each range uses its own benchmark, treats ties neutrally and rewards smaller losses',()=>{
 const points=Array.from({length:150},(_,i)=>({date:new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10),value:i<75?100+i:180-i/2}));
 const range=(a,b)=>({from:points[a].date,to:points[b].date});
 const sets=[100,50].map(allocation=>({variant:{id:String(allocation),strategy:'hold',order:'market',automation:false},settings:{allocation}}));
 const {rows,errors,charts}=compareRanges('Test',points,[range(0,60),range(80,140),range(2,2)],{sets,options:DEFAULT_LAB},DEFAULT_LAB);
 assert.equal(charts.length,2);
 for(const {report,range} of charts){
  for(const result of report.results){
   const row=rows.find(r=>r.id===result.variant.id&&r.range.from===range.from);
   assert.equal(result.capital.at(-1).value,row.metrics.capital);
   assert.equal(report.benchmark.capital.at(-1).value,row.benchmark.capital);
   assert.equal(result.capital[0].date,report.testFrom);
   assert.equal(result.capital.at(-1).date,report.to);
  }
 }
 assert.equal(rows.length,4);assert.equal(errors.length,1);
 assert.equal(rows[0].wins,0);assert.equal(rows[2].wins,0);
 assert.ok(rows[1].delta.gain<0);
 assert.equal(rows[3].wins,3);
 assert.ok(rows[3].delta.drawdown>0);
 assert.deepEqual(rows[3].actual,range(80,140));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {rollingTest} from '../lib/rolling-test.ts';
import {DEFAULT_LAB,runVariant} from '../lib/strategy-lab.ts';
const points=Array.from({length:240},(_,i)=>({date:new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10),value:100+15*Math.sin(i/8)+i/7}));
const v={id:'q',name:'Quote',strategy:'hold',order:'market',automation:false};
const options={...DEFAULT_LAB,capital:1100,monthly:120,costBps:10};
const input={asset:'Test',points,from:'2020-01-01',to:'2020-07-31',trainMonths:2,testMonths:2,limit:32,variants:[v],options};
test('Rolling winners use past data and carry capital and contributions across disjoint tests',()=>{
 const r=rollingTest(input),idx=date=>points.findIndex(p=>p.date===date);
 assert.equal(r.phases.length,3);assert.equal(r.from,'2020-03-01');assert.equal(r.to,'2020-07-31');
 const altered=rollingTest({...input,points:points.map(p=>p.date>=r.from?{...p,value:p.value*(1+p.value/300)}:p)});
 assert.deepEqual(r.phases[0].winners[0].settings,altered.phases[0].winners[0].settings);
 let balance=options.capital;
 for(const [i,phase] of r.phases.entries()){
  assert.ok(phase.trainingTo<phase.from);
  if(i)assert.ok(r.phases[i-1].to<phase.from);
  const start=idx(phase.trainingFrom),end=idx(phase.trainingTo);
  const scores=[75,100].map(allocation=>runVariant(points,start,end,v,{...options,allocation}).profit);
  const winner=phase.winners[0];
  assert.equal(winner.trainingProfit,Math.max(...scores));
  const run=runVariant(points,idx(phase.from),idx(phase.to),v,{...options,...winner.settings,capital:balance+(i?options.monthly:0)});
  balance=run.curve.at(-1).value;assert.equal(winner.end,balance);
 }
 assert.equal(r.lines[1].points.at(-1).value,balance);
 const hold=runVariant(points,idx(r.from),idx(r.to),v,options);
 assert.deepEqual(r.lines[0].points,hold.curve);assert.equal(r.paidIn,options.capital+4*options.monthly);
});

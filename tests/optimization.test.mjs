import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizeSma,searchPairs} from '../lib/optimize.ts';
import {backtest} from '../lib/analytics.ts';
const rows=Array.from({length:500},(_,i)=>({date:new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10),value:100+Math.sin(i/13)*20+i*.07}));
const settings={fastMin:5,fastMax:15,fastStep:5,slowMin:20,slowMax:40,slowStep:10,trainingPercent:70,objective:'cagr'};
test('SMA search ranks on common dates with costs and evaluates winner on later holdout',async()=>{
 const r=await optimizeSma(rows,rows[0].date,rows.at(-1).date,25,10000,settings);
 assert.equal(r.tested,9);assert.equal(r.trainingFrom,rows[40].date);assert.ok(r.validationFrom>r.trainingTo);
 const brute=searchPairs(settings).map(pair=>({...pair,value:backtest(rows,r.trainingFrom,r.trainingTo,pair.fast,pair.slow,25,10000).metrics.cagr})).sort((a,b)=>b.value-a.value);
 assert.equal(r.best.fast,brute[0].fast);assert.equal(r.best.slow,brute[0].slow);
 assert.deepEqual(r.validation,backtest(rows,r.validationFrom,r.validationTo,r.best.fast,r.best.slow,25,10000));
});
test('Changing only holdout prices cannot alter candidate selection or training scores',async()=>{
 const a=await optimizeSma(rows,rows[0].date,rows.at(-1).date,10,10000,settings);
 const changed=rows.map(p=>({...p,value:p.date>=a.validationFrom?p.value*5:p.value}));
 const b=await optimizeSma(changed,rows[0].date,rows.at(-1).date,10,10000,settings);
 assert.deepEqual(a.best,b.best);assert.deepEqual(a.ranking,b.ranking);assert.deepEqual(a.training,b.training);
});
test('Search caps computation, rejects inadequate samples and supports cancellation',async()=>{
 assert.throws(()=>searchPairs({...settings,fastStep:0}),/Suchbereiche/);
 assert.throws(()=>searchPairs({...settings,fastMin:2,fastMax:999,fastStep:1,slowMin:3,slowMax:1000,slowStep:1}),/2500/);
 await assert.rejects(optimizeSma(rows.slice(0,80),rows[0].date,rows.at(-1).date,10,10000,settings),/mindestens/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(optimizeSma(rows,rows[0].date,rows.at(-1).date,10,10000,settings,{signal:controller.signal}),/abgebrochen/);
});
test('Negative prices outside evaluation and warmup do not leak into a historical backtest',()=>{
 const changed=rows.map((p,i)=>({...p,value:i===0||i===490?-20:p.value}));
 assert.deepEqual(backtest(changed,rows[100].date,rows[400].date,5,20,10),backtest(rows,rows[100].date,rows[400].date,5,20,10));
 assert.throws(()=>backtest(changed,rows[480].date,rows[499].date,5,20,10),/Negativpreisen/);
});

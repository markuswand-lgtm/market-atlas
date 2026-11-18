import test from 'node:test';
import assert from 'node:assert/strict';
import {compareStrategies,runVariant,DEFAULT_LAB,STRATEGIES,wilderRsi} from '../lib/strategy-lab.ts';
const rows=values=>values.map((value,i)=>({date:new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10),value}));
const options={...DEFAULT_LAB,capital:1000,costBps:0,fast:2,slow:3,lookback:2};
const variant=(order='market',automation=false,strategy='hold')=>({id:'test',name:'Test',strategy,order,automation});
const run=(values,order='market',extra={},automation=false)=>runVariant(rows(values),0,values.length-1,variant(order,automation),{...options,...extra});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
test('Market enters only at next close and charges both sides of actual notional',()=>{
 const r=run([100,200,220,242]);near(r.curve.at(-1).value,1210);assert.equal(r.trades[0].signalDate,'2020-01-01');assert.equal(r.trades[0].date,'2020-01-02');
 const fees=run([100,100,100,100],'market',{costBps:100,slippageBps:100});near(fees.curve.at(-1).value,1000/(1.01*1.01)*.99*.99);assert.equal(fees.trades.length,2);assert.ok(fees.fees>0);
});
test('Limit respects price and slippage, stop waits after trigger, stop-limit can remain unfilled',()=>{
 const l=run([100,100,95,120],'limit',{offset:5});assert.equal(l.trades[0].price,95);near(l.curve.at(-1).value,1000/95*120);
 assert.equal(run([100,100,95,120],'limit',{offset:5,slippageBps:10}).trades.length,0);
 const s=run([100,102,150,160],'stop',{offset:1,expiry:1});assert.equal(s.trades[0].price,150);assert.equal(s.trades[0].date,'2020-01-03');
 assert.equal(run([100,102,150,160],'stop-limit',{offset:1}).trades.length,0);
 const sl=run([100,102,100,103],'stop-limit',{offset:1});assert.equal(sl.trades[0].date,'2020-01-03');assert.equal(sl.trades[0].price,100);
});
test('Trailing protection executes after observed close; disabling automation removes it',()=>{
 const values=[100,100,120,105,80,90],r=run(values,'market',{trailing:10,cooldown:2},true);
 assert.equal(r.trades[1].reason,'Trailing-Stop');assert.equal(r.trades[1].signalDate,'2020-01-04');assert.equal(r.trades[1].price,80);near(r.curve.at(-1).value,800);
 near(run(values,'market',{trailing:10,cooldown:2},false).curve.at(-1).value,900);
 const halted=run([100,100,80,75,90,95],'market',{maxDrawdown:10},true);assert.equal(halted.halted,true);assert.equal(halted.trades.filter(t=>t.side==='Kauf').length,1);
});
test('All strategies share warmup and endpoints, future prices cannot alter earlier capital or fills',()=>{
 const p=rows(Array.from({length:90},(_,i)=>100+i*.1+12*Math.sin(i/4))),variants=STRATEGIES.map(s=>variant('market',true,s.id));
 const a=compareStrategies(p,'2020-01-01','2020-03-30',variants,options),b=compareStrategies(p.map((v,i)=>i>70?{...v,value:v.value*3}:v),'2020-01-01','2020-03-30',variants,options);
 assert.ok(a.results.every(r=>r.curve[0].date===a.from&&r.curve.at(-1).date===a.to));
 for(let i=0;i<a.results.length;i++){const r=a.results[i];assert.ok(r.curve.every(p=>Number.isFinite(p.value)&&p.value>=0));assert.deepEqual(r.curve.filter(p=>p.date<'2020-03-10'),b.results[i].curve.filter(p=>p.date<'2020-03-10'));assert.ok(r.trades.filter(t=>t.reason!=='Schlussliquidation').every(t=>t.signalDate<t.date));}
 assert.equal(wilderRsi(rows([100,100,100,100]),2).at(-1),50);
 assert.throws(()=>compareStrategies(rows([1,0,1,2,3,4]),'2020-01-01','2020-02-01',[variant()],options),/Negativ/);
 assert.throws(()=>compareStrategies(p,'2020-02-01','2020-01-01',[variant()],options),/zeitraum/i);
});

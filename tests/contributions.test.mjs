import test from 'node:test';
import assert from 'node:assert/strict';
import {monthlyPayment,contributionBacktest} from '../lib/contributions.ts';
import {backtest,sma} from '../lib/analytics.ts';
import {compareStrategies,DEFAULT_LAB} from '../lib/strategy-lab.ts';
import {optimizeSma,DEFAULT_SEARCH} from '../lib/optimize.ts';
const points=['2019-12-27','2019-12-28','2019-12-29','2019-12-30','2020-01-30','2020-01-31','2020-02-03','2020-02-04','2020-03-02','2020-03-03'].map(date=>({date,value:100}));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
test('Calendar payments count once per month, include skipped months and start only after test-start month',()=>{
 assert.equal(monthlyPayment('2020-01-31','2020-02-03',100),100);
 assert.equal(monthlyPayment('2019-12-31','2020-03-02',100),300);
 assert.equal(monthlyPayment('2020-02-03','2020-02-28',100),0);
 const result=compareStrategies(points,'2020-01-30','2020-03-03',[{id:'hold',strategy:'hold',order:'market',name:'Hold',automation:true}],{...DEFAULT_LAB,fast:2,slow:3,lookback:2,capital:1000,monthly:100,costBps:0});
 for(const r of result.results){near(r.paidIn,1200);near(r.curve.at(-1).value,1200);near(r.profit,0);near(r.metrics.total,0);near(r.metrics.drawdown,0);assert.deepEqual(r.invested.map(p=>p.value),[1000,1000,1100,1100,1200,1200]);}
});
test('Deposits cannot create investment return or conceal drawdown; orders still pay costs',()=>{
 const p=points.map((p,i)=>({...p,value:i>=6?50:100}));
 const variant={id:'hold',strategy:'hold',order:'market',name:'Hold',automation:true};
 const options={...DEFAULT_LAB,fast:2,slow:3,lookback:2,capital:1000,monthly:10000,costBps:0};
 const r=compareStrategies(p,'2020-01-30','2020-03-03',[variant],options).results[0];near(r.paidIn,21000);near(r.profit,-500);near(r.metrics.total,-.5);near(r.metrics.drawdown,-.5);
 const fees=compareStrategies(points,'2020-01-30','2020-03-03',[variant],{...options,costBps:10}).results[0];assert.ok(fees.fees>0&&fees.profit<0&&fees.metrics.total<0);
 assert.throws(()=>compareStrategies(points,'2020-01-30','2020-03-03',[variant],{...options,monthly:-1}),/Parameter/);
});
test('SMA and optimizer accept recurring capital and keep return metrics independent of cash inflows',async()=>{
 const r=backtest(points,'2020-01-30','2020-03-03',2,3,0,1000,100);
 near(r.paidIn,1200);near(r.profit,0);near(r.metrics.total,0);near(r.holdMetrics.total,0);near(r.holdProfit,0);
 const p=Array.from({length:180},(_,i)=>({date:new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10),value:100+Math.sin(i/9)*10}));
 const legacy=backtest(p,p[30].date,p.at(-1).date,2,3,10,1000),zero=contributionBacktest(p,p.map((_,i)=>i).slice(30),sma(p,2),sma(p,3),.001,1000,0);
 near(legacy.strategy.at(-1).value,zero.strategy.at(-1).value);near(legacy.benchmark.at(-1).value,zero.benchmark.at(-1).value);
 const options={...DEFAULT_SEARCH,fastMin:2,fastMax:3,fastStep:1,slowMin:4,slowMax:6,slowStep:1};
 const search=await optimizeSma(p,p[10].date,p.at(-1).date,0,1000,options,{monthly:100});assert.ok(search.training.paidIn>1000&&search.validation.paidIn>1000);assert.equal(search.training.invested[0].value,1000);assert.equal(search.validation.invested[0].value,1000);
});

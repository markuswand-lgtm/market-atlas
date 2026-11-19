import test from 'node:test';
import assert from 'node:assert/strict';
import {jointSearch,validateRanges} from '../lib/joint-search.ts';
import {DEFAULT_LAB,runVariant} from '../lib/strategy-lab.ts';
const dates=Array.from({length:160},(_,i)=>new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10));
const markets=[1,-1].map((sign,j)=>({name:'Asset '+j,points:dates.map((date,i)=>({date,value:100+i/8+sign*15*Math.sin(i/13)}))}));
const range=(a,b)=>({from:dates[a],to:dates[b]});
const variant={id:'hold',name:'Position',strategy:'hold',order:'market',automation:false};
const base={markets,seeds:[{variant,settings:{},color:'blue'}],options:{...DEFAULT_LAB,monthly:170},limit:32,training:[range(0,39),range(40,79)],holdout:[range(80,119),range(120,159)]};
test('Joint goals use matching case benchmarks, and holdout prices cannot change training selection',()=>{
 for(const goal of ['capital','gain','drawdown','all']){
  const input={...base,goal},r=jointSearch(input);
  assert.equal(r.trainCases,4);assert.equal(r.checkCases,4);
  const changed=jointSearch({...input,markets:markets.map(m=>({...m,points:m.points.map((p,i)=>i>=80?{...p,value:p.value*(i%2?2:1)}:p)}))});
  assert.deepEqual(changed.results.map(({checks,checkSummary,...v})=>v),r.results.map(({checks,checkSummary,...v})=>v));
  for(const v of r.results){
   let wins=0;for(const m of markets)for(const t of base.training){
    const s=dates.indexOf(t.from),e=dates.indexOf(t.to);
    const run=allocation=>runVariant(m.points,s,e,variant,{...base.options,allocation});
    const a=run(v.set.settings.allocation),b=run(100);
    const delta={capital:a.curve.at(-1).value/b.curve.at(-1).value-1,gain:a.metrics.total-b.metrics.total,drawdown:a.metrics.drawdown-b.metrics.drawdown};
    if((goal==='all'?Math.min(...Object.values(delta)):delta[goal])>1e-12)wins++;
   }
   assert.equal(v.wins,wins);assert.equal(v.checks.length,4);
  }
 }
});
test('Mean capital lead can prefer fewer wins; per-market winners maximize actual net profit',()=>{
 const markets=[0.9,0.9,3].map((factor,i)=>({name:String(i),points:dates.map((date,j)=>({date,value:j<2?100:100*factor}))}));
 const options={...DEFAULT_LAB,monthly:0,costBps:0};
 const input={...base,markets,options,training:[range(0,39)],holdout:[range(40,79)]};
 const frequent=jointSearch({...input,goal:'capital'}),average=jointSearch({...input,goal:'meanCapital'});
 assert.equal(frequent.results[0].set.settings.allocation,75);
 assert.equal(average.results[0].set.settings.allocation,100);
 assert.deepEqual(average.profitWinners.map(r=>r.set.settings.allocation),[75,75,100]);
 for(const r of average.profitWinners)assert.equal(r.result.profit,r.result.capital-options.capital);
 const only=jointSearch({...input,holdout:[],goal:'capital',profitOnly:true});
 assert.deepEqual(only.profitWinners,average.profitWinners);assert.equal(only.checkCases,0);
});
test('Reject overlapping, inverted, empty and pre-training holdouts',()=>{
 for(const [t,h] of [[[range(0,39)],[range(39,99)]],[[range(10,9)],[range(50,100)]],[[range(0,10)],[]],[[range(60,90)],[range(0,50)]],[[range(0,20),range(15,30)],[range(40,50)]]])assert.throws(()=>validateRanges(t,h));
});

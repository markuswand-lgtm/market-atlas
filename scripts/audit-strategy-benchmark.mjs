import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_LAB} from '../lib/strategy-lab.ts';
import {compareRanges} from '../lib/multi-replay.ts';
import {strategyRanking} from '../lib/strategy-ranking.ts';

// Run against an exported Market Atlas archive: node scripts/audit-strategy-benchmark.mjs
const archive=process.argv[2]||'dist-static/data';
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const {snapshot}=read(archive+'/manifest.json');
const options={...DEFAULT_LAB,capital:10000,monthly:0,costBps:10,slippageBps:0};
const sets=['sma','rsi','grid','hold'].map(strategy=>({variant:{id:strategy,name:strategy,strategy,order:strategy==='grid'?'limit':'market',automation:false},settings:{},color:''}));
const group={options,sets};
const ranges=[[2016,2018],[2019,2021],[2022,2024]].map(([a,b])=>({from:a+'-01-01',to:b+'-12-31'}));
const results=[];
for(const asset of ['sp500','dax','gold','bitcoin']){
 const {rows:prices}=read(archive+'/'+snapshot+'/'+asset+'.json');
 const {rows,errors}=compareRanges(asset,prices,ranges,group,options);
 assert.deepEqual(errors,[]);
 for(const row of rows.filter(r=>r.id==='hold')){
  const p=prices.filter(x=>x.date>=row.actual.from&&x.date<=row.actual.to);
  const rate=options.costBps/10000,units=options.capital/(p[1].value*(1+rate));
  let peak=options.capital,dd=0,end=0;
  for(let i=0;i<p.length;i++){
   end=i?units*p[i].value*(i===p.length-1?1-rate:1):options.capital;
   peak=Math.max(peak,end);dd=Math.min(dd,end/peak-1);
  }
  assert.ok(Math.abs(row.benchmark.capital-end)<1e-6);
  assert.ok(Math.abs(row.benchmark.gain-(end/options.capital-1))<1e-10);
  assert.ok(Math.abs(row.benchmark.drawdown-dd)<1e-10);
  assert.deepEqual(row.delta,{capital:0,gain:0,drawdown:0});
 }
 results.push(...rows);
}
console.log('Archiv',snapshot);
console.table(strategyRanking(results));
for(const r of results.filter(r=>r.id==='sma'&&r.asset==='sp500'))console.log(r.range,r.metrics,r.benchmark,r.exposure,r.trades);

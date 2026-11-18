import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMatrix,comparePair,effectiveInterval,heatColor,monthEnd,pearson,sampleSeries,shiftWindow} from '../lib/comparison-matrix.ts';
const monthly=values=>values.map((value,i)=>({date:`2020-${String(i+1).padStart(2,'0')}-01`,value}));
const sample=values=>sampleSeries(monthly(values),'monthly','monthly','2021-01-01');
const prices=returns=>returns.reduce((values,r)=>[...values,values.at(-1)*(1+r)],[100]);

test('Pearson uses variable changes, recognizes inverse/identical relations and rejects constants',()=>{
 assert.equal(pearson([1,2,3],[-1,-2,-3]),-1);
 assert.equal(pearson([1,2,3],[2,4,6]),1);
 assert.equal(pearson([1,1,1],[2,3,4]),null);
 assert.equal(pearson([1,2],[3]),null);
 const returns=[.1,-.03,.05,.2,-.1,.02,.07],a=sample(prices(returns)),b=sample(prices(returns.map(r=>-r)));
 const r=comparePair(a,b,'2020-01-01','2020-12-31','monthly');
 assert.ok(Math.abs(r.correlation+1)<1e-12);assert.equal(r.count,7);
});

test('Sampling respects completed periods, historical annual drawing dates and no upsampling',()=>{
 assert.deepEqual(sampleSeries([{date:'1900-01-01',value:20}],'annual','annual','1900-06-01'),[]);
 assert.equal(sampleSeries([{date:'1900-01-01',value:20}],'annual','annual','1900-12-31')[0].date,'1900-12-31');
 assert.deepEqual(sampleSeries(monthly([1,2,3]),'monthly','daily','2021-01-01'),[]);
 const rows=[{date:'2020-01-20',value:1},{date:'2020-02-28',value:2},{date:'2020-03-27',value:3}];
 assert.deepEqual(sampleSeries(rows,'daily','monthly','2020-03-15').map(p=>p.value),[2]);
 assert.equal(monthEnd(2020*12+1),'2020-02-29');
 assert.deepEqual(sampleSeries([{date:'2020-11-01',value:5}],'monthly','annual','2020-12-31'),[]);
 assert.equal(effectiveInterval(['daily','annual'],'monthly'),'annual');
 assert.equal(effectiveInterval(['daily','monthly'],'daily'),'monthly');
});

test('Pair alignment never joins mismatched intervals or fills missing data',()=>{
 const a=sample([100,110,121,125,130,135,140,150]),b=sample([100,105,111,115,120,125,128,130]).filter((_,i)=>i!==2);
 const r=comparePair(a,b,'2020-01-01','2020-12-31','monthly');
 assert.equal(r.matched.length,7);assert.equal(r.count,5);assert.equal(r.skipped,1);assert.equal(r.correlation,null);
 const market=sampleSeries([{date:'2024-01-05',value:100},{date:'2024-01-08',value:110}],'daily','daily','2024-01-31');
 const crypto=sampleSeries([{date:'2024-01-05',value:100},{date:'2024-01-06',value:120},{date:'2024-01-07',value:90},{date:'2024-01-08',value:120}],'daily','daily','2024-01-31');
 const daily=comparePair(market,crypto,'2024-01-01','2024-01-31','daily');
 assert.equal(daily.count,1);assert.ok(Math.abs(daily.relative+10)<1e-12);
});

test('Relative changes use common endpoints, retain gaps and invert direction on matrix transpose',()=>{
 const a=sample([50,100,200,300]),b=sample([90,100,150,200]).slice(1);
 const matrix=buildMatrix(['a','b'],{a,b},'2020-01-01','2020-12-31','monthly');
 assert.equal(matrix[0][1].relative,100);assert.equal(matrix[1][0].relative,-100);
 assert.equal(matrix[0][1].first,'2020-02-29');assert.equal(matrix[0][1].last,'2020-04-30');
 assert.equal(matrix[1][0].changeA,1);assert.equal(matrix[0][0].relative,0);
 const negative=comparePair(sample([1,0,2,-1,3,4,5,6]),sample([1,2,3,4,5,6,7,8]),'2020-01-01','2020-12-31','monthly');
 assert.equal(negative.relative,null);assert.equal(negative.count,3);assert.equal(negative.skipped,4);
 assert.equal(comparePair(a,b,'1890-01-01','1900-01-01','monthly').relative,null);
});

test('Moving window retains length and clamps to available history; palettes keep scale stable',()=>{
 assert.deepEqual(shiftWindow('2020-01-01','2022-12-31',12,'2000-01-01','2023-06-30'),{from:'2020-07-01',to:'2023-06-30'});
 assert.deepEqual(shiftWindow('2020-01-01','2022-12-31',-1000,'2000-01-01','2023-06-30'),{from:'2000-01-01',to:'2002-12-31'});
 const n='#f5ad69',p='#78c8ee';
 assert.deepEqual(heatColor(1,1,n,p),heatColor(-1,1,n,p,'#222b3c',true));
 assert.deepEqual(heatColor(1000,100,n,p),heatColor(100,100,n,p));
 assert.notDeepEqual(heatColor(null,1,n,p),heatColor(0,1,n,p));
});
import {relativePath,extrema,assetComparisons} from '../lib/comparison-matrix.ts';
test('Automatic interval responds to window length and never upsamples slower sources',()=>{
 assert.equal(effectiveInterval(['daily'],'auto','2020-01-01','2021-01-01'),'daily');
 assert.equal(effectiveInterval(['daily'],'auto','2010-01-01','2021-01-01'),'monthly');
 assert.equal(effectiveInterval(['daily'],'auto','1890-01-01','2021-01-01'),'annual');
 assert.equal(effectiveInterval(['monthly'],'auto','2020-01-01','2021-01-01'),'monthly');
});
test('Per-asset rank and temporal ratio extrema retain common dates and earliest ties',()=>{
 const a=sample([100,150,120,200]),b=sample([100,100,200,100]),c=sample([100,200,100,400]);
 const result=assetComparisons('a',['a','b','c'],{a,b,c},'2020-01-01','2020-12-31','monthly');
 assert.equal(result.length,2);assert.equal(result[0].pair.relative,100);assert.equal(result[1].pair.relative,-200);
 assert.equal(result[0].min.value,60);assert.equal(result[0].min.date,'2020-03-31');assert.equal(result[0].max.value,200);
 assert.equal(extrema([{date:'2020-01-01',value:100},{date:'2020-02-01',value:100}]).min.date,'2020-01-01');
 assert.deepEqual(relativePath([{date:'2020-01-01',a:0,b:1},{date:'2020-02-01',a:1,b:2}]),[]);
 const clipped=assetComparisons('a',['a','b'],{a,b},'2020-02-01','2020-03-31','monthly')[0];assert.equal(clipped.path[0].value,100);assert.equal(clipped.max.date,'2020-02-29');assert.equal(clipped.min.value,40);
});

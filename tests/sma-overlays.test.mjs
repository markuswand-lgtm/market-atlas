import test from 'node:test';
import assert from 'node:assert/strict';
import {deflate} from '../lib/analytics.ts';
import {smaOverlay,validSmaPair} from '../lib/sma-overlays.ts';

const history=[10,20,30,40,50,60].map((value,i)=>({date:`2020-01-0${i+1}`,value}));
test('Chart SMA uses pre-range warmup and the asset base, not its own first SMA',()=>{
 const reference=history.slice(3,5);
 assert.deepEqual(smaOverlay(history,3,reference,false),[{date:'2020-01-04',value:30},{date:'2020-01-05',value:40}]);
 assert.deepEqual(smaOverlay(history,3,reference,true),[{date:'2020-01-04',value:75},{date:'2020-01-05',value:100}]);
 // A shared comparison start changes the asset base; warmup remains available.
 assert.deepEqual(smaOverlay(history,3,reference.slice(1),true),[{date:'2020-01-05',value:80}]);
});
test('CPI and index display preserve nominal SMA crossings and omit missing CPI dates',()=>{
 const rows=[{date:'2020-01-31',value:100},{date:'2020-02-01',value:200},{date:'2020-03-01',value:300}];
 const cpi=[{date:'2020-01-01',value:100},{date:'2020-02-01',value:200}];
 const reference=deflate(rows.slice(1),cpi,'2020-02');
 assert.deepEqual(smaOverlay(rows,2,reference,false,cpi,'2020-02'),[{date:'2020-02-01',value:150}]);
 assert.deepEqual(smaOverlay(rows,2,reference,true,cpi,'2020-02'),[{date:'2020-02-01',value:75}]);
});
test('Chart SMA never invents warmup values or uses future prices',()=>{
 assert.equal(smaOverlay(history,5,history,false)[0].date,'2020-01-05');
 assert.deepEqual(smaOverlay(history,20,history,false),[]);
 const changed=history.map((p,i)=>i===5?{...p,value:9999}:p);
 assert.deepEqual(smaOverlay(changed,3,history.slice(0,5),false),smaOverlay(history,3,history.slice(0,5),false));
 for(const n of [0,1,2.5,NaN,1001])assert.deepEqual(smaOverlay(history,n,history,false),[]);
 assert.equal(validSmaPair(50,200),true);
 for(const [f,s] of [[50,50],[200,50],[1,20],[2,1001],[2.5,20]])assert.equal(validSmaPair(f,s),false);
});

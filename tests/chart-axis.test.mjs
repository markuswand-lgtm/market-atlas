import test from 'node:test';
import assert from 'node:assert/strict';
import {valueAxis,timeTicks} from '../lib/chart-axis.ts';
test('Nice axes enclose data and 100 reference with uniform rounded linear ticks',()=>{
 const a=valueAxis(91.2,138.7,false,100);assert.ok(a.min<=91.2&&a.max>=138.7);assert.ok(a.ticks.includes(100));assert.ok(a.ticks.every((v,i)=>!i||v-a.ticks[i-1]===10));
 const b=valueAxis(-30,20);assert.ok(b.ticks.includes(0));assert.ok(b.min<-30);
 const constant=valueAxis(100,100);assert.ok(constant.max>constant.min);
 const log=valueAxis(.002,1300,true,100);assert.ok(log.min>0&&log.ticks.every(v=>v>0));
 const small=valueAxis(.0001,.00015);assert.ok(small.ticks.length>2);
});
test('Time ticks use distinct calendar periods for short and century-long ranges',()=>{
 for(const [from,to] of [['2020-01-02','2020-01-08'],['2020-02-10','2022-11-20'],['1890-01-01','2026-11-18']]){
  const min=Date.parse(from),max=Date.parse(to),ticks=timeTicks(min,max);assert.ok(ticks.length>=3&&ticks.length<=11);assert.equal(new Set(ticks.map(t=>t.label)).size,ticks.length);assert.ok(ticks.every(t=>t.value>=min&&t.value<=max));
 }
});

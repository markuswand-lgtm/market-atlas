import test from 'node:test';
import assert from 'node:assert/strict';
import {quantile,ratioSeries} from '../lib/ratio.ts';
test('Quantiles interpolate all observations, honor endpoints and reject invalid percentages',()=>{
 assert.equal(quantile([40,10,20,30],25),17.5);assert.equal(quantile([40,10,20,30],90),37);
 assert.equal(quantile([5,5,5],10),5);assert.equal(quantile([5,5,5],100),5);
 assert.equal(quantile([4],0),4);assert.equal(quantile([],50),null);assert.equal(quantile([1,2],101),null);assert.equal(quantile([1,2],NaN),null);
});
test('Pair ratio uses common observed dates and native slower frequency, with no currency or gap fills',()=>{
 const a=[{date:'2020-01-01',value:100},{date:'2020-01-02',value:120},{date:'2020-01-03',value:90},{date:'2020-01-04',value:100}],b=[{date:'2020-01-01',value:10},{date:'2020-01-03',value:5},{date:'2020-01-04',value:0}];
 const raw=ratioSeries(a,b,'daily','daily','1900-01-01','2020-12-31','2020-12-31');assert.deepEqual(raw.points.map(p=>p.value),[10,18]);assert.equal(raw.omitted,1);
 const norm=ratioSeries(a,b,'daily','daily','1900-01-01','2020-12-31','2020-12-31',true);assert.deepEqual(norm.points.map(p=>p.value),[100,180]);
 const clipped=ratioSeries(a,b,'daily','daily','2020-01-02','2020-01-03','2020-12-31');assert.equal(quantile(clipped.points.map(p=>p.value),10),18);
 const annual=ratioSeries([{date:'1890-01-01',value:5}],[{date:'1890-12-30',value:10}],'annual','daily','1800-01-01','1900-01-01','1900-01-01');assert.equal(annual.interval,'annual');assert.deepEqual(annual.points,[{date:'1890-12-31',value:.5}]);
});

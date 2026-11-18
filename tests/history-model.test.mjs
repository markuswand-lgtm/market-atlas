import test from 'node:test';
import assert from 'node:assert/strict';
import {extendHistory} from '../lib/history-model.ts';
import {sourceSegments} from '../lib/provenance.ts';
import {parsePinkSheet} from '../lib/pink-sheet.ts';
import {utils,write} from 'xlsx';
test('History extension uses an observed overlap anchor and never overwrites original periods or fills gaps',()=>{
 const actual=[{date:'2000-01-31',value:100},{date:'2000-02-29',value:120}],proxy=[{date:'1999-10-01',value:10},{date:'1999-12-01',value:20},{date:'2000-01-01',value:25},{date:'2000-02-01',value:40}];
 const r=extendHistory(actual,proxy,'daily','monthly','monthly','2000-12-31');assert.equal(r.factor,4);assert.equal(r.anchorDate,'2000-01-31');assert.deepEqual(r.rows,[{date:'1999-10-31',value:40},{date:'1999-12-31',value:80},{date:'2000-01-31',value:100},{date:'2000-02-29',value:120}]);assert.equal(r.modeledTo,'1999-12-31');
 assert.throws(()=>extendHistory(actual,proxy.slice(0,2),'daily','monthly','monthly','2000-12-31'),/Ankerperiode/);
});
test('MSCI source provenance separates the vendor backtest from post-launch history',()=>{
 const a={id:'msci-world',sourceName:'MSCI via Yahoo',link:'https://example.com',frequency:'daily',note:'Provider history'};
 const r=sourceSegments(a,[{date:'1972-01-03',value:100},{date:'2026-11-18',value:1000}]);assert.deepEqual(r.map(s=>s.kind),['vendor-model','provider']);assert.equal(r[0].to,'1986-03-30');assert.equal(r[1].from,'1986-03-31');assert.ok(r.every(s=>s.sourceUrl===a.link));
});
test('World Bank Pink Sheet parser keeps only the named series, positive numeric observations and completed months',()=>{
 const b=utils.book_new();utils.book_append_sheet(b,utils.aoa_to_sheet([['Title'],[null,'Gold','Silver'],[null,'($/troy oz)','($/troy oz)'],['1960M01',35,.91],['1960M02',35,'…'],['2026M10',4000,57],['2026M11',4100,58]]),'Monthly Prices');
 assert.deepEqual(parsePinkSheet(write(b,{type:'array',bookType:'xlsx'}),'Silver','2026-11-18'),[{date:'1960-01-01',value:.91},{date:'2026-10-01',value:57}]);
 assert.throws(()=>parsePinkSheet(write(b,{type:'array',bookType:'xlsx'}),'Oil'),/nicht gefunden/);
});

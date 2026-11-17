import test from 'node:test';
import assert from 'node:assert/strict';
import {utils,write} from 'xlsx';
import {parseShiller,parseEiaHistory,shillerDownloadUrl} from '../lib/history-providers.ts';
import {deflateAnnual} from '../lib/analytics.ts';
test('Shiller numeric October dates and provisional endpoints are handled explicitly',()=>{
 const wb=utils.book_new();utils.book_append_sheet(wb,utils.aoa_to_sheet([['Source'],['Date','P','CPI'],[1890.01,5.38,8],[2026.09,100,30],[2026.1,110,31],[2026.11,120,32]]),'Data');
 const bytes=new Uint8Array(write(wb,{type:'array',bookType:'xlsx'}));
 const prices=parseShiller(bytes,'P',new Date('2026-11-17'));
 assert.equal(prices.at(-1).date,'2026-10-01');assert.equal(prices[0].date,'1890-01-01');
 const cpi=parseShiller(bytes,'CPI',new Date('2026-11-17'));assert.equal(cpi.at(-1).date,'2026-09-01');
 assert.equal(shillerDownloadUrl('<a href="//img1.wsimg.com/a/ie_data.xls?ver=1&amp;x=2">'), 'https://img1.wsimg.com/a/ie_data.xls?ver=1&x=2');
 assert.throws(()=>shillerDownloadUrl('<a href="https://unrelated.example/ie_data.xls">'),/Downloadhost/);
});
test('Annual CPI deflation uses twelve months, never just the January value',()=>{
 const cpi=Array.from({length:12},(_,i)=>({date:`2000-${String(i+1).padStart(2,'0')}-01`,value:i?200:100}));
 const p=[{date:'2000-01-01',value:100}];
 assert.ok(Math.abs(deflateAnnual(p,cpi,'2000-12')[0].value-100*200/(2300/12))<1e-10);
 assert.deepEqual(deflateAnnual(p,cpi.slice(1),'2000-12'),[]);
});
test('EIA historical decades preserve blank cells and exclude incomplete current year',()=>{
 const html=Array.from({length:18},(_,i)=>{const decade=1850+i*10;return `<tr><td>${decade}'s</td>${Array.from({length:10},(_,j)=>`<td>${decade+j<1859?'':1}</td>`).join('')}</tr>`;}).join('');
 const rows=parseEiaHistory(html,new Date('2026-11-17'));assert.equal(rows[0].date,'1859-01-01');assert.equal(rows.at(-1).date,'2025-01-01');assert.equal(rows.length,167);
 assert.throws(()=>parseEiaHistory('<html>Error</html>'),/nicht erkannt/);
});

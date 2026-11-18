import test from 'node:test';
import assert from 'node:assert/strict';
import {parseImfDebt} from '../lib/debt-provider.ts';
import {DEBT_ASSETS,canDeflate} from '../lib/debt.ts';
test('IMF debt preserves observed zero, gaps and excludes current-year/projections and missing values',()=>{
 const body={values:{GGXWDG_NGDP:{USA:{'2022':0,'2023':null,'2024':50,'2025':'60','2026':70,'2030':90}}}};
 assert.deepEqual(parseImfDebt('GGXWDG_NGDP','USA',body,undefined,new Date('2026-11-18')),[{date:'2022-12-31',value:0},{date:'2024-12-31',value:50}]);
 assert.throws(()=>parseImfDebt('GGXWDG_NGDP','DEU',body),/fehlt/);
});
test('Derived USD debt uses matching country-year GDP and never sums the selected countries as world',()=>{
 const b={values:{GGXWDG_NGDP:{USA:{'2022':50,'2023':70,'2024':60},WEOWORLD:{'2024':90}}}};
 const g={values:{NGDPD:{USA:{'2022':200,'2023':0},WEOWORLD:{'2024':100000}}}};
 assert.deepEqual(parseImfDebt('GGXWDG_NGDP','USA',b,g),[{date:'2022-12-31',value:100}]);
 assert.deepEqual(parseImfDebt('GGXWDG_NGDP','WEOWORLD',b,g),[{date:'2024-12-31',value:90000}]);
 assert.equal(canDeflate(DEBT_ASSETS.find(a=>a.id==='debt-deu-gdp')),false);
 assert.equal(canDeflate(DEBT_ASSETS.find(a=>a.id==='debt-deu-usd')),true);
});

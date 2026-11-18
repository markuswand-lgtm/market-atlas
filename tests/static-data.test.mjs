import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {ASSETS} from '../lib/catalog.ts';
import {exportStaticData} from '../scripts/export-static-data.mjs';

test('Independent publication keeps all series in SQL and immutable JSON; missing history aborts',async()=>{
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'market-atlas-static-')),source=path.join(temporary,'source'),dest=path.join(temporary,'output');
 try{
  await fs.mkdir(source);
  for(const a of ASSETS)await fs.writeFile(path.join(source,a.id+'.json'),JSON.stringify({sourceUrl:a.link,retrievedAt:'2026-11-17T10:00:00Z',rows:[{date:'1890-01-01',value:12},{date:'1890-01-02',value:13}]}));
  const result=await exportStaticData(source,dest);
  assert.equal(result.series.length,ASSETS.length);assert.match(result.snapshot,/^[a-f0-9]{16}$/);
  const row=JSON.parse(await fs.readFile(path.join(dest,result.snapshot,'sp500.json'),'utf8'));assert.equal(row.rows[0].value,12);
  const db=new DatabaseSync(path.join(dest,'market-atlas.sqlite'),{readOnly:true});assert.equal(db.prepare('SELECT COUNT(*) n FROM observations').get().n,ASSETS.length*2);assert.equal(db.prepare('SELECT COUNT(*) n FROM provenance').get().n,ASSETS.length);db.close();
  await fs.unlink(path.join(source,'sp500.json'));await assert.rejects(exportStaticData(source,dest));
  assert.equal(JSON.parse(await fs.readFile(path.join(dest,'manifest.json'),'utf8')).snapshot,result.snapshot);
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
});
test('Static browser reads snapshot files and refuses any write request',async()=>{
 globalThis.__MARKET_ATLAS_STATIC__=true;
 const original=globalThis.fetch,requests=[];
 globalThis.fetch=async url=>{requests.push(url);return Response.json(url.includes('manifest.json')?{snapshot:'1234567890abcdef',series:[]}:{rows:[{date:'2020-01-01',value:1}]});};
 try{
  const {apiJson,publicPath}=await import('../lib/data-client.ts');
  await apiJson('/api/data');assert.equal((await apiJson('/api/data?id=sp500')).rows[0].value,1);
  assert.deepEqual(requests,['./data/manifest.json','./data/1234567890abcdef/sp500.json']);
  assert.equal(publicPath('/reference/image.png'),'./reference/image.png');
  await assert.rejects(apiJson('/api/import',{id:'sp500'}),/täglichen/);
  await assert.rejects(apiJson('/api/data?id=..%2Fsecret'),/Unbekannte/);
 }finally{globalThis.fetch=original;delete globalThis.__MARKET_ATLAS_STATIC__;}
});

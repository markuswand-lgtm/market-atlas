import test from 'node:test';
import assert from 'node:assert/strict';
import {publishManifest} from '../scripts/firebase-retention.mjs';

function fakeDatabase(failAt) {
 const old='1111111111111111',recent='2222222222222222',current='3333333333333333';
 const state={manifest:{snapshot:current},_publicationHistory:{[old]:'2026-11-15',[recent]:'2026-11-16',[current]:'2026-11-17'},snapshots:{}};
 for(const id of [old,recent,current])state.snapshots[id]={series:{a:{rows:[1]},b:{rows:[2]}},sqlite:{chunks:{0:'base64-a',1:'base64-b'},encoding:'base64-chunks'},_complete:{format:1}};
 const calls=[],get=p=>p.split('/').filter(Boolean).reduce((v,k)=>v?.[k],state);
 const ref=p=>({child:k=>ref([p,k].filter(Boolean).join('/')),orderByKey:()=>ref(p),limitToFirst:()=>({...ref(p),get:async()=>{
  const entry=Object.entries(get(p)||{})[0];return {exists:()=>!!entry,forEach:fn=>{if(entry)fn({key:entry[0]});}};
 }}),get:async()=>({val:()=>get(p)}),update:async changes=>{
  assert.equal(p,'');assert.deepEqual(Object.keys(changes).sort(),['_publicationHistory','manifest']);
  calls.push('publish');Object.assign(state,changes);
 },remove:async()=>{
  calls.push(p);if(p===failAt)throw new Error('interrupted');
  if(/^snapshots\/[a-f0-9]+$/.test(p)){assert.deepEqual(get(p).series,{});assert.deepEqual(get(p).sqlite.chunks,{});}
  const parts=p.split('/'),key=parts.pop();delete get(parts.join('/'))[key];
 }});
 return {database:{ref:(p='')=>ref(p)},state,calls,old,recent,current};
}
const manifest={snapshot:'4444444444444444',publishedAt:'2026-11-18'};
test('Publication retains two previous snapshots and deletes old archives in bounded units',async()=>{
 const f=fakeDatabase();await publishManifest(f.database,manifest);
 assert.equal(f.calls[0],'publish');assert.equal(f.state.manifest.snapshot,manifest.snapshot);
 assert.deepEqual(Object.keys(f.state._publicationHistory).sort(),[f.recent,f.current,manifest.snapshot]);
 assert.ok(f.state.snapshots[f.current]);assert.ok(f.state.snapshots[f.recent]);assert.equal(f.state.snapshots[f.old],undefined);
 assert.equal(f.calls.filter(p=>p.includes('/series/')).length,2);
 assert.equal(f.calls.filter(p=>p.includes('/chunks/')).length,2);
});
test('Interrupted cleanup keeps the published pointer and retryable history',async()=>{
 const f=fakeDatabase('snapshots/1111111111111111/series/b');
 await assert.rejects(publishManifest(f.database,manifest),/interrupted/);
 assert.equal(f.state.manifest.snapshot,manifest.snapshot);assert.ok(f.state._publicationHistory[f.old]);
 assert.ok(f.state.snapshots[f.current]);assert.ok(f.state.snapshots[f.recent]);
});

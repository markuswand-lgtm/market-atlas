import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {decodeSqliteTransfer} from '../lib/sqlite-transfer.ts';
const pack=bytes=>({encoding:'base64-chunks',byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),chunks:Array.from({length:Math.ceil(bytes.length/(512*1024))},(_,i)=>bytes.subarray(i*512*1024,(i+1)*512*1024).toString('base64'))});
test('Large SQLite downloads cross the single-string limit in bounded, hash-verified chunks',async()=>{
 const bytes=Buffer.alloc(8*1024*1024+7,147);bytes.write('SQLite format 3\0');
 const payload=pack(bytes);assert.ok(bytes.toString('base64').length>10*1024*1024);
 assert.deepEqual(Buffer.from(await decodeSqliteTransfer(payload)),bytes);
});
test('Missing, truncated, excessive and corrupted SQLite transfers fail explicitly',async()=>{
 const payload=pack(Buffer.from('SQLite format 3\0test database'));
 await assert.rejects(()=>decodeSqliteTransfer(null),/Format|format/);
 await assert.rejects(()=>decodeSqliteTransfer({...payload,byteLength:100*1024*1024+1}),/format/);
 await assert.rejects(()=>decodeSqliteTransfer({...payload,chunks:[]}),/format/);
 await assert.rejects(()=>decodeSqliteTransfer({...payload,chunks:['%%%']}),/block/);
 await assert.rejects(()=>decodeSqliteTransfer({...payload,byteLength:payload.byteLength+1}),/Unvollständig/);
 await assert.rejects(()=>decodeSqliteTransfer({...payload,sha256:'0'.repeat(64)}),/Prüfsumme/);
});

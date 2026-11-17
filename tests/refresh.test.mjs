import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {applyRefresh} from '../lib/refresh.ts';
import {comparisonLines,periodRange,timeDomain} from '../lib/display.ts';

test('MAX pins 1890 and selected bounds survive sparse/new asset history',()=>{
 const r=periodRange(0,new Date('2026-11-17T13:00:00Z'));
 assert.deepEqual(r,{from:'1890-01-01',to:'2026-11-17'});
 assert.deepEqual(timeDomain([{date:'2014-09-17',value:100}],r.from,r.to),{minX:Date.parse(r.from),maxX:Date.parse(r.to)});
 assert.equal(timeDomain([],r.from,r.to,true).maxX,Date.UTC(2060,0,1));
 assert.equal(periodRange(1,new Date('2024-02-29')).from,'2023-02-28');
});
test('Normalization preserves older history unless shared start explicitly chosen',()=>{
 const lines=[{points:[{date:'1927-01-01',value:10},{date:'2014-01-01',value:200}]},{points:[{date:'2014-01-01',value:4}]}];
 assert.equal(comparisonLines(lines,true)[0].points[0].date,'1927-01-01');
 assert.equal(comparisonLines(lines,true)[0].points[1].value,2000);
 assert.equal(comparisonLines(lines,true,true)[0].points[0].date,'2014-01-01');
 assert.equal(comparisonLines(lines,true,true)[0].points[0].value,100);
});

function database(){
 const sql=new DatabaseSync(':memory:');
 sql.exec("CREATE TABLE series(id TEXT PRIMARY KEY,source_url TEXT,retrieved_at TEXT,status TEXT,count INTEGER,first_date TEXT,last_date TEXT,job_id TEXT);CREATE TABLE observations(series_id TEXT,date TEXT,value REAL,PRIMARY KEY(series_id,date));CREATE TABLE import_runs(id TEXT PRIMARY KEY,series_id TEXT,started_at TEXT,finished_at TEXT,status TEXT,row_count INTEGER,source_url TEXT);INSERT INTO series VALUES('btc','old','old','ready',1,'2020-01-01','2020-01-01','initial');INSERT INTO observations VALUES('btc','2020-01-01',1)");
 function prepare(query){let args=[];return {query,get args(){return args;},bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};}};}
 const db={prepare,async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>({meta:{changes:Number(sql.prepare(s.query).run(...s.args).changes)}}));sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,db};
}
const snapshot=rows=>({rows,url:'https://example.com/source',retrievedAt:'2026-11-17T07:00:00Z'});
test('Refresh revises and appends atomically, retains older history and is idempotent',async()=>{
 const {db,sql}=database();
 const s=snapshot([{date:'2020-01-01',value:2},{date:'2026-11-16',value:100}]);
 assert.equal((await applyRefresh(db,'btc',s)).updated,2);
 assert.equal((await applyRefresh(db,'btc',s)).updated,0);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM observations').get().n,2);
 assert.equal(sql.prepare('SELECT count FROM series').get().count,2);
 assert.equal(sql.prepare('SELECT status FROM series').get().status,'ready');
 await applyRefresh(db,'btc',snapshot([{date:'2026-11-17',value:101}]));
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM observations').get().n,3);
 sql.close();
});
test('Large revisions resume in bounded batches without losing rows',async()=>{
 const {db,sql}=database();
 const rows=Array.from({length:650},(_,i)=>({date:new Date(Date.UTC(2021,0,i+1)).toISOString().slice(0,10),value:i}));
 assert.equal((await applyRefresh(db,'btc',snapshot(rows))).remaining,50);
 assert.equal((await applyRefresh(db,'btc',snapshot(rows))).remaining,0);
 assert.equal(sql.prepare('SELECT count FROM series').get().count,651);sql.close();
});
test('Concurrent newer importer wins; no stale refresh writes leak through',async()=>{
 const {db,sql}=database(),batch=db.batch;
 db.batch=async statements=>{sql.exec("UPDATE series SET job_id='new-import',status='loading'");return batch(statements);};
 await assert.rejects(applyRefresh(db,'btc',snapshot([{date:'2020-01-01',value:999}])),/andere Aktualisierung/);
 assert.equal(sql.prepare('SELECT value FROM observations').get().value,1);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM import_runs').get().n,0);sql.close();
});

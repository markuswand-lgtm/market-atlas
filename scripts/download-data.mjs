import fs from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {ASSETS} from '../lib/catalog.ts';
import {download} from '../lib/providers.ts';
const out=path.resolve('work/data');await fs.mkdir(out,{recursive:true});
const db=new DatabaseSync(path.join(out,'market-atlas.sqlite'));
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS series(id TEXT PRIMARY KEY,name TEXT,source_url TEXT,retrieved_at TEXT,unit TEXT,frequency TEXT,first_date TEXT,last_date TEXT,count INTEGER); CREATE TABLE IF NOT EXISTS observations(series_id TEXT REFERENCES series(id),date TEXT,value REAL,PRIMARY KEY(series_id,date));');
const insert=db.prepare('INSERT INTO observations VALUES(?,?,?) ON CONFLICT(series_id,date) DO UPDATE SET value=excluded.value');
const requested=process.argv.slice(2);const chosen=requested.length?ASSETS.filter(a=>requested.includes(a.id)):ASSETS.filter(a=>a.provider!=='archive'&&a.provider!=='model');
if(requested.some(id=>!ASSETS.some(a=>a.id===id)))throw new Error('Unbekannte Reihen-ID.');
let previous=[];try{previous=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8'));}catch{}
const manifest=previous.filter(m=>!chosen.some(a=>a.id===m.id));let failures=0;
for(const a of chosen){try{const cached=a.provider==='archive'?JSON.parse(await fs.readFile(path.join(out,a.id+'.json'),'utf8')):null;const data=cached?{rows:cached.rows,url:cached.sourceUrl,retrievedAt:cached.retrievedAt}:await download(a);const m={id:a.id,name:a.name,sourceName:a.sourceName,sourceUrl:data.url,retrievedAt:data.retrievedAt,frequency:a.frequency,unit:a.unit,first:data.rows[0].date,last:data.rows.at(-1).date,count:data.rows.length,note:a.note};
db.exec('BEGIN');try{db.prepare('INSERT OR REPLACE INTO series VALUES(?,?,?,?,?,?,?,?,?)').run(a.id,a.name,data.url,data.retrievedAt,a.unit,a.frequency,m.first,m.last,m.count);for(const p of data.rows)insert.run(a.id,p.date,p.value);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
await fs.writeFile(path.join(out,a.id+'.json'),JSON.stringify({...m,rows:data.rows}));await fs.writeFile(path.join(out,a.id+'.csv'),'date,value\n'+data.rows.map(p=>`${p.date},${p.value}`).join('\n'));manifest.push(m);console.log(`${a.id}: ${m.count} observations, ${m.first} → ${m.last}`);
}catch(e){failures++;console.error(`${a.id}: ${e.message}`);manifest.push({id:a.id,error:e.message});}}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));db.close();console.log(JSON.stringify({output:out,series:manifest.length,failures}));if(failures)process.exitCode=1;

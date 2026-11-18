import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import {ASSETS} from '../lib/catalog.ts';
import {cleanPoints} from '../lib/analytics.ts';

export async function exportStaticData(source='work/data',destination='dist-static/data'){
 const datasets=[];
 for(const asset of ASSETS){
  const entry=JSON.parse(await fs.readFile(path.join(source,asset.id+'.json'),'utf8'));
  const rows=cleanPoints(entry.rows||[]);
  if(!rows.length||rows.length!==entry.rows.length||!Number.isFinite(Date.parse(entry.retrievedAt)))throw new Error(`Ungültiger oder fehlender Datenbestand: ${asset.id}`);
  datasets.push({...entry,id:asset.id,name:asset.name,unit:asset.unit,frequency:asset.frequency,rows,count:rows.length,first:rows[0].date,last:rows.at(-1).date});
 }
 const snapshot=createHash('sha256').update(JSON.stringify(datasets)).digest('hex').slice(0,16);
 await fs.mkdir(path.join(destination,snapshot),{recursive:true});
 const sqlPath=path.join(destination,'market-atlas.sqlite');
 // The output is rebuilt from validated source snapshots, never from browser input.
 await fs.rm(sqlPath,{force:true});
 const db=new DatabaseSync(sqlPath);
 db.exec('CREATE TABLE series(id TEXT PRIMARY KEY,name TEXT,source_url TEXT,retrieved_at TEXT,unit TEXT,frequency TEXT,first_date TEXT,last_date TEXT,count INTEGER); CREATE TABLE observations(series_id TEXT REFERENCES series(id),date TEXT,value REAL,PRIMARY KEY(series_id,date));');
 const insert=db.prepare('INSERT INTO observations VALUES(?,?,?)');
 db.exec('BEGIN');
 try{for(const entry of datasets){
  db.prepare('INSERT INTO series VALUES(?,?,?,?,?,?,?,?,?)').run(entry.id,entry.name,entry.sourceUrl,entry.retrievedAt,entry.unit,entry.frequency,entry.first,entry.last,entry.count);
  for(const p of entry.rows)insert.run(entry.id,p.date,p.value);
  await fs.writeFile(path.join(destination,snapshot,entry.id+'.json'),JSON.stringify(entry));
 }db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
 const failures=datasets.filter(d=>d.refreshError).map(d=>d.name);
 const result={snapshot,publishedAt:new Date().toISOString(),warning:failures.length?'Quellenabruf für '+failures.length+' Reihen fehlgeschlagen. Letzter erfolgreicher Stand bleibt verfügbar; Einzelheiten in der Datenbank.':'',series:datasets.map(d=>({id:d.id,count:d.count,first_date:d.first,last_date:d.last,retrieved_at:d.retrievedAt,status:'ready',source_url:d.sourceUrl,refresh_error:d.refreshError||''}))};
 await fs.writeFile(path.join(destination,'manifest.json'),JSON.stringify(result));
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await exportStaticData();console.log(JSON.stringify({series:result.series.length,observations:result.series.reduce((n,s)=>n+s.count,0),snapshot:result.snapshot}));}

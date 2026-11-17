import type {Point} from './analytics.ts';

type Snapshot={rows:Point[];url:string;retrievedAt:string};
/** Atomic, bounded, idempotent refresh. Existing history remains readable on failure. */
export async function applyRefresh(db:D1Database,id:string,snapshot:Snapshot){
 const previous=await db.prepare('SELECT job_id,status FROM series WHERE id=?').bind(id).first<{job_id:string;status:string}>();
 if(!previous||previous.status!=='ready')throw new Error('Bitte zuerst die vollständige Historie importieren bzw. den laufenden Import abschließen.');
 const stored=await db.prepare('SELECT date,value FROM observations WHERE series_id=?').bind(id).all<Point>();
 const byDate=new Map(stored.results.map(p=>[p.date,p.value]));
 const changed=snapshot.rows.filter(p=>byDate.get(p.date)!==p.value),chunk=changed.slice(0,600);
 const remaining=changed.length-chunk.length,job=crypto.randomUUID();
 const statements=[db.prepare("UPDATE series SET job_id=? WHERE id=? AND job_id=? AND status='ready'").bind(job,id,previous.job_id)];
 // A single JSON parameter avoids D1's bound-parameter limit. Every write checks the lease.
 if(chunk.length)statements.push(db.prepare("INSERT INTO observations(series_id,date,value) SELECT ?,json_extract(value,'$.date'),json_extract(value,'$.value') FROM json_each(?) WHERE EXISTS(SELECT 1 FROM series WHERE id=? AND job_id=?) ON CONFLICT(series_id,date) DO UPDATE SET value=excluded.value").bind(id,JSON.stringify(chunk),id,job));
 statements.push(db.prepare("UPDATE series SET source_url=?,retrieved_at=?,count=(SELECT COUNT(*) FROM observations WHERE series_id=?),first_date=(SELECT MIN(date) FROM observations WHERE series_id=?),last_date=(SELECT MAX(date) FROM observations WHERE series_id=?) WHERE id=? AND job_id=?").bind(snapshot.url,snapshot.retrievedAt,id,id,id,id,job));
 statements.push(db.prepare("INSERT INTO import_runs(id,series_id,started_at,finished_at,status,row_count,source_url) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM series WHERE id=? AND job_id=?)").bind(job,id,snapshot.retrievedAt,new Date().toISOString(),remaining?'refresh-partial':'ready',chunk.length,snapshot.url,id,job));
 const result=await db.batch(statements);
 if(!result[0].meta.changes)throw new Error('Eine andere Aktualisierung war schneller. Bitte erneut versuchen.');
 return {id,updated:chunk.length,remaining,retrievedAt:snapshot.retrievedAt};
}

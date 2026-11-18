import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {ASSETS} from '../lib/catalog.ts';
const series=[];
for(const asset of ASSETS){const data=JSON.parse(await fs.readFile('work/data/'+asset.id+'.json','utf8'));if(!data.rows?.length)throw Error('Missing '+asset.id);series.push({id:asset.id,sourceUrl:data.sourceUrl,retrievedAt:data.retrievedAt,frequency:asset.frequency,unit:asset.unit,rows:data.rows});}
await fs.mkdir('data',{recursive:true});const bytes=gzipSync(JSON.stringify({createdAt:new Date().toISOString(),series}),{level:9});await fs.writeFile('data/bootstrap.json.gz',bytes);console.log(JSON.stringify({series:series.length,observations:series.reduce((n,s)=>n+s.rows.length,0),bytes:bytes.length}));

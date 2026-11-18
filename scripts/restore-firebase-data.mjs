import fs from 'node:fs/promises';
import {initializeApp,applicationDefault,deleteApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {firebaseConfig} from './firebase-config.mjs';
import {ASSETS} from '../lib/catalog.ts';
import {cleanPoints} from '../lib/analytics.ts';
const config=firebaseConfig(process.env.MARKET_ATLAS_FIREBASE_CONFIG||await fs.readFile(new URL('../firebase/web-config.json',import.meta.url),'utf8'));
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS||process.env.GOOGLE_CLOUD_PROJECT!==config.projectId)throw new Error('Protected archive recovery requires the configured workload identity.');
const app=initializeApp({credential:applicationDefault(),projectId:config.projectId,databaseURL:config.databaseURL});
try{
 const db=getDatabase(app),manifest=(await db.ref('manifest').get()).val();
 if(!manifest||!/^[a-f0-9]{16}$/.test(manifest.snapshot)||!Array.isArray(manifest.series))throw new Error('The protected archive is not initialized. Refusing to replace it with a bootstrap snapshot.');
 await fs.mkdir('work/data',{recursive:true});
 for(const asset of ASSETS){
  if(!manifest.series.some(s=>s.id===asset.id)){console.log(`New catalog series ${asset.id}: source download or model generation required before publication.`);continue;}
  const entry=(await db.ref(`snapshots/${manifest.snapshot}/series/${asset.id}`).get()).val();
  if(entry?.id!==asset.id||!Array.isArray(entry.rows)||!entry.rows.length||entry.rows.length!==cleanPoints(entry.rows).length||!Number.isFinite(Date.parse(entry.retrievedAt)))throw new Error('Invalid protected archive: '+asset.id);
  const filename=`work/data/${asset.id}.json`;let cache;try{cache=JSON.parse(await fs.readFile(filename,'utf8'));}catch{}
  const newer=cache?.retrievedAt>entry.retrievedAt?cache:entry,older=newer===cache?entry:cache;
  const rows=cleanPoints([...(older?.rows||[]),...newer.rows]);
  await fs.writeFile(filename,JSON.stringify({...newer,rows,count:rows.length,first:rows[0].date,last:rows.at(-1).date}));
 }
 console.log(`Restored ${ASSETS.length} protected series before source refresh.`);
}finally{await deleteApp(app);}

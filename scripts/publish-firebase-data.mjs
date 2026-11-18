import fs from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {initializeApp,cert,applicationDefault,deleteApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {firebaseConfig} from './firebase-config.mjs';
import {publishManifest} from './firebase-retention.mjs';
const config=firebaseConfig(process.env.MARKET_ATLAS_FIREBASE_CONFIG||await fs.readFile(new URL('../firebase/web-config.json',import.meta.url),'utf8'));
if(!config){console.log('Public deployment: Firebase is not enabled.');process.exit(0);}
if(!process.env.FIREBASE_SERVICE_ACCOUNT&&!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw new Error('Firebase enabled but upload credential missing. Publication stopped.');
let credential;
if(process.env.FIREBASE_SERVICE_ACCOUNT){
 const account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
 if(account.project_id!==config.projectId)throw new Error('Firebase project does not match the upload credential.');
 credential=cert(account);
}else{
 if(process.env.GOOGLE_CLOUD_PROJECT!==config.projectId)throw new Error('Firebase project does not match the workload identity project.');
 credential=applicationDefault();
}
const app=initializeApp({credential,projectId:config.projectId,databaseURL:config.databaseURL});
try{
 const directory=path.resolve('dist-static/data'),manifest=JSON.parse(await fs.readFile(path.join(directory,'manifest.json'),'utf8'));
 if(!/^[a-f0-9]{16}$/.test(manifest.snapshot)||!Array.isArray(manifest.series))throw new Error('Invalid exported manifest.');
 const series={};for(const a of manifest.series){if(!/^[a-z0-9-]+$/.test(a.id))throw new Error('Invalid series ID');series[a.id]=JSON.parse(await fs.readFile(path.join(directory,manifest.snapshot,a.id+'.json'),'utf8'));}
 const database=getDatabase(app);
 // Defense against accidentally deploying public or writable database rules.
 const rules=await database.getRulesJSON(),expected=JSON.parse(await fs.readFile('firebase/database.rules.json','utf8'));
 if(!isDeepStrictEqual(rules,expected))throw new Error('Deploy and verify the committed Firebase access rules before publication.');
 const sql=await fs.readFile(path.join(directory,'market-atlas.sqlite')),chunks=[];
 for(let i=0;i<sql.length;i+=512*1024)chunks.push(sql.subarray(i,i+512*1024).toString('base64'));
 const sqlite={encoding:'base64-chunks',byteLength:sql.length,sha256:createHash('sha256').update(sql).digest('hex'),chunks};
 const snapshot=database.ref('snapshots/'+manifest.snapshot),completion={format:1,seriesCount:manifest.series.length,sqliteSha256:sqlite.sha256};
 // Stage immutable data in bounded requests; expose the manifest only after all
 // writes finish. The previous published snapshot stays usable during uploads.
 if(!isDeepStrictEqual((await snapshot.child('_complete').get()).val(),completion)){
  for(const [id,entry] of Object.entries(series))await snapshot.child('series/'+id).set(entry);
  for(let i=0;i<chunks.length;i++)await snapshot.child('sqlite/chunks/'+i).set(chunks[i]);
  await snapshot.child('sqlite').update({encoding:sqlite.encoding,byteLength:sqlite.byteLength,sha256:sqlite.sha256});
  await snapshot.child('_complete').set(completion);
 }
 await publishManifest(database,manifest);
 // GitHub Pages must receive no public copy of the protected data.
 const expectedDirectory=path.join(process.cwd(),'dist-static','data');
 if(directory!==expectedDirectory)throw new Error('Unexpected data output directory.');
 await fs.rm(directory,{recursive:true,force:true});
 console.log(`Protected snapshot published: ${manifest.series.length} series. Public data files removed from Pages output.`);
}finally{await deleteApp(app);}
